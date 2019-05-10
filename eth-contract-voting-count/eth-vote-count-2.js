const Web3 = require("web3");
const fs = require('fs');
const axios = require('axios');
const BigNumber = require('bignumber.js');

const Web3getInfoUrl = process.env.NODE_WEB3_URL;
const TOKEN_ADDRESS = '0x5CA9a71B1d01849C0a95490Cc00559717fCF0D1d';
const VOTING_CONTRACT_ADDRESS = '0x863d8e96B5D00d2342fc46c527B002326b9813c2';
const BLOCK_NUMBER = 7761835; // TODO change to block number closest to vote close
const DELIVERY_PERIOD = 2;
const BL_ID = 'CBD0589C-4114-2D15-FF41-6FC7F3EE8800';
const BL_KEY = process.env.NODE_BL_KEY;
const BL_URL = `https://api.backendless.com/${BL_ID}/${BL_KEY}/data/migrations`;

const web3 = new Web3(new Web3.providers.HttpProvider(Web3getInfoUrl));
const AEToken = new web3.eth.Contract(require("./AEToken.json"), TOKEN_ADDRESS);
const VotingContract = new web3.eth.Contract(require("./SimpleVote.json"), VOTING_CONTRACT_ADDRESS);


const groupBy = (xs, key) => xs.reduce((acc, x) => Object.assign({}, acc, {
    [x[key]]: (acc[x[key]] || []).concat(x)
}), {});

async function countVotes() {
    console.log("Starting...");

    // Check if vote has already ended and if we can get final balances
    console.log("0. Checking height");
    let height = (await web3.eth.getBlock('latest')).number;
    let balanceHeight = height < BLOCK_NUMBER ? height : BLOCK_NUMBER;
    if (height < BLOCK_NUMBER) {
        console.warn(`0. Chain at height ${height} but target height is ${BLOCK_NUMBER}.`);
        console.warn(`0. Using ${height} for balances. The obtained results are subject to change.`);
    }

    const votersCount = await VotingContract.methods.totalVotes().call();

    const voterIds = [];

    for (let i = 0; i < votersCount; i++) {
        voterIds.push(i);
    }
    console.log(`1. Found ${votersCount} votes in the smart contract`);

    // Map ids to addresses
    const accounts = await Promise.all(voterIds.map(
        id => VotingContract.methods.voters(id).call()));
    console.log(`1. Got ${accounts.length} addresses`);

    // Map addresses to votedOptions
    const votedOptions = await Promise.all(accounts.map(
        account => VotingContract.methods.getVote(account).call()));
    console.log(`1. Got ${votedOptions.length} votes`);

    // Map addresses to balances at block height
    const balances = await Promise.all(accounts.map(
        async account => new BigNumber(await AEToken.methods.balanceOf(account).call(balanceHeight))));
    console.log(`1. Got ${balances.length} balances`);

    // Obtain migrated tokens from 2nd period
    console.log(`2. Getting tokens in migrations for accounts`);
    const burned = await Promise.all(accounts.map(async account => {
        // Obtain burn transactions from 2nd migration
        const response = await axios.get(
            `${BL_URL}?where=from%3D%27${account}%27%20AND%20deliveryPeriod%3D${DELIVERY_PERIOD}`,
        );

        // filter burn transactions based on block height
        const relevantBalances = await Promise.all(response.data.map(async tx => {
                let txReceipt = await web3.eth.getTransactionReceipt(tx.transactionHash);
                if (txReceipt.blockNumber < balanceHeight) {
                    return new BigNumber(tx.value)
                }
            }
        ));

        // aggregate all relevant burn transactions
        return relevantBalances.reduce((acc, curr) => {
            return acc.plus(curr)
        }, new BigNumber(0));

    }));
    console.log(`2. Got ${burned.length} accounts migration stake`);

    // Aggregate obtained information to one vote
    const votes = voterIds.map(id => {
        return {
            account: accounts[id],
            voteOption: Number(votedOptions[id]),
            balance: balances[id].toFixed(),
            burned: burned[id].toFixed(),
            stake: balances[id].plus(burned[id]).toFixed()
        }
    });

    // 3. sum up stake by votes for options
    console.log('3. sum up stake by votes for options');
    const votesByOption = groupBy(votes, 'voteOption');

    const stakesForOption = Object.keys(votesByOption).reduce(function (acc, option) {
        const votes = votesByOption[option];

        const totalStake = votes.reduce((acc, vote) => { // sum up stakes using bignumber
            return acc.plus(new BigNumber(vote.stake))
        }, new BigNumber('0')).toFixed();

        acc.push({option: option, totalStake: totalStake, votes: votes}); // add stakes and votes for option to final result
        return acc
    }, []);

    console.log(`3. did sum stakes for ${stakesForOption.length} options\n`);
    saveJSON(stakesForOption);
    return stakesForOption;
}

function saveJSON(json) {
    let jsonString = JSON.stringify(json, null, 2);
    fs.writeFileSync("./eth-votes.json", jsonString + '\n');
    console.log(`Finished.`)
}

module.exports = {
    countVotes: countVotes
};

