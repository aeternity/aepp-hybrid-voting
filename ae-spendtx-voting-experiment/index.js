const {ChainNode} = require('@aeternity/aepp-sdk');
const axios = require('axios');
const BigNumber = require('bignumber.js');

const middlewareUrl = "http://localhost:8000";

const getClient = () => {
    return ChainNode({
        url: 'https://sdk-testnet.aepps.com',
        internalUrl: 'https://sdk-testnet.aepps.com',
        networkId: 'ae_uat'
    });
};

const groupBy = (xs, key) => xs.reduce((acc, x) => Object.assign({}, acc, {
    [x[key]]: (acc[x[key]] || []).concat(x)
}), {});

const testVerify = async () => {
    const votingAcc = 'ak_2V5w6BVQYzP66VCtxQUfM9QJP2dN6bBENJXNsQTpqFcc5CDTNB';
    const votingStakeHeight = 30000;
    const votingEndingHeight = 60000;
    const voteId = 1;


    // 1. fetch all txs towards voting account from middleware
    const votingAccTxs = await axios.get(`${middlewareUrl}/middleware/transactions/account/${votingAcc}`).catch(console.error).then(res => res.data.transactions);
    const filteredVotingTxs = votingAccTxs
        .filter(tx => tx.tx.type === 'SpendTx') // filter spend transactions
        .filter(tx => tx.tx.payload !== '') // filter transactions with empty payload
        .filter(tx => { // filter transactions with valid voting payload
            try {
                const payload = JSON.parse(tx.tx.payload);
                return payload.vote && payload.vote.id && payload.vote.option && payload.vote.id === voteId;
            } catch {
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


    // 2. filter multiple votes by same account, filter txs for valid voting payload, filter txs for specific vote
    const votingAccounts = Object.values(groupBy(filteredVotingTxs, 'account')).map((txs) => {
        const beforeEndingTxs = txs.filter(tx => tx.height <= votingEndingHeight); // filter votes before votingEndingHeight
        const highestNonce = Math.max(...beforeEndingTxs.map(tx => tx.nonce), 0);
        return beforeEndingTxs.find(tx => tx.nonce === highestNonce); // only show vote with highest nonce
    }).filter(vote => vote); // filter accounts with no votes before votingEndingHeight


    // 3. check stake for each voter account at height
    const client = await getClient();
    const votingAccountStakes = await Promise.all(votingAccounts.map(async (vote) => {
        const balanceAtHeight = await client.balance(vote.account, {height: votingStakeHeight}).catch((e) => {
            console.error(e.message);
            return '0'; // account balance will fail if account didn't exist at votingStakeHeight, so stake is 0
        });
        return {...vote, ...{stake: balanceAtHeight}} // append stake to vote object
    }));


    // 4. sum up stake by votes for options
    const votesByOption = groupBy(votingAccountStakes, 'voteOption');
    const stakesForOption = Object.keys(votesByOption).reduce(function (acc, option) {
        const votes = votesByOption[option];

        const totalStake = votes.reduce((acc, vote) => { // sum up stakes using bignumber
            return acc.plus(new BigNumber(vote.stake))
        }, new BigNumber('0')).toFixed();

        acc.push({option: option, totalStake: totalStake, votes: votes}); // add stakes and votes for option to final result
        return acc;
    }, []);


    console.log(JSON.stringify(stakesForOption, null, 2));
};

testVerify();
