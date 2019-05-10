const {ChainNode} = require('@aeternity/aepp-sdk');
const axios = require('axios');
const fs = require('fs');
const BigNumber = require('bignumber.js');

const middlewareUrl = "https://mainnet.mdw.aepps.com";

const getClient = () => {
    return ChainNode({
        url: 'https://sdk-mainnet.aepps.com',
        internalUrl: 'https://sdk-mainnet.aepps.com',
        networkId: 'ae_uat'
    });
};

const groupBy = (xs, key) => xs.reduce((acc, x) => Object.assign({}, acc, {
    [x[key]]: (acc[x[key]] || []).concat(x)
}), {});

const countVotes = async () => {
    const votingAcc = 'ak_11111111111111111111111111111111273Yts';
    const votingStakeHeight = 80541;
    const votingEndingHeight = 80541;
    const voteId = 1;

    // 1. fetch all txs towards voting account from middleware
    console.log("1. fetch all txs towards voting account from middleware");
    const votingAccTxs = await axios.get(`${middlewareUrl}/middleware/transactions/account/${votingAcc}`).catch(console.error).then(res => res.data);
    const filteredVotingTxs = votingAccTxs
        .filter(tx => tx.tx.type === 'SpendTx') // filter spend transactions
        .filter(tx => tx.tx.payload !== '') // filter transactions with empty payload
        .filter(tx => tx.block_height <= votingEndingHeight)
        .filter(tx => { // filter transactions with valid voting payload
            try {
                const payload = JSON.parse(tx.tx.payload);
                return payload.vote && payload.vote.id &&
                    payload.vote.option !== undefined &&
                    payload.vote.id === voteId &&
                    typeof payload.vote.option === 'number' &&
                    payload.vote.option >= 0 &&
                    payload.vote.option <= 20;
            } catch (e) {
                return false;
            }
        })
        .map(tx => { // map data to extract needed information
            const payload = JSON.parse(tx.tx.payload);
            return {
                height: tx.block_height,
                nonce: tx.tx.nonce,
                txHash: tx.hash,
                account: tx.tx.sender_id,
                voteOption: payload.vote.option
            }
        });
    console.log(`1. did fetch ${filteredVotingTxs.length} valid voting transactions from middleware\n`);


    // 2. filter multiple votes by same account, filter txs for valid voting payload, filter txs for specific vote
    console.log("2. filter multiple votes by same account, filter txs for valid voting payload, filter txs for specific vote");
    const votingAccounts = Object.values(groupBy(filteredVotingTxs, 'account')).map((txs) => {
        const highestNonce = Math.max(...txs.map(tx => tx.nonce), 0);
        return txs.find(tx => tx.nonce === highestNonce); // only show vote with highest nonce
    }).filter(vote => vote); // filter accounts with no votes before votingEndingHeight
    console.log(`2. ${votingAccounts.length} remaining latest voting accounts remaining\n`);
    console.log(`2. minimum voting height: ${Math.min(...votingAccounts.map(vote => vote.height))}`);


    // 3. check stake for each voter account at height
    console.log("3. check stake for each voter account at height");
    const client = await getClient();
    const votingAccountStakes = await Promise.all(votingAccounts.map(async (vote) => {
        const balanceAtHeight = await client.balance(vote.account, {height: votingStakeHeight}).catch(async (e) => {
            console.error(`3. choose stake 0 for account ${vote.account} (${e.message})`);

            if (e.message.includes("Height not available")) {
                // account balance will fail if not yet at votingStakeHeight, use current height for a temporary result
                console.error("CAREFUL: WILL USE NON-FINAL RESULT!");
                return await client.balance(vote.account).catch(() => '0');
            } else {
                // account balance will fail if account didn't exist at votingStakeHeight, so stake is 0
                return '0';
            }
        });
        return {...vote, ...{stake: balanceAtHeight}} // append stake to vote object
    }));
    console.log(`3. did check ${votingAccountStakes.length} accounts balance at height ${votingStakeHeight}\n`);


    // 4. sum up stake by votes for options
    console.log("4. sum up stake by votes for options");
    const votesByOption = groupBy(votingAccountStakes, 'voteOption');
    const stakesForOption = Object.keys(votesByOption).reduce(function (acc, option) {
        const votes = votesByOption[option];

        const totalStake = votes.reduce((acc, vote) => { // sum up stakes using bignumber
            return acc.plus(new BigNumber(vote.stake))
        }, new BigNumber('0')).toFixed();

        acc.push({option: option, totalStake: totalStake, votes: votes}); // add stakes and votes for option to final result
        return acc;
    }, []);
    console.log(`4. did sum stakes for ${stakesForOption.length} options\n`);

    let jsonString = JSON.stringify(stakesForOption, null, 2);
    fs.writeFileSync("./ae-votes.json", jsonString + '\n');
    console.log("did write detailed result to ./ae-votes.json file")
    return stakesForOption;
};

module.exports = {
    countVotes: countVotes
};
