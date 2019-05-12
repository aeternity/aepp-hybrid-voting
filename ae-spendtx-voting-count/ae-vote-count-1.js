const {ChainNode} = require('@aeternity/aepp-sdk');
const axios = require('axios');
const AeComputeVotingTx = require('./ae-compute-voting-transactions');

const middlewareUrl = "https://mainnet.mdw.aepps.com";

const getClient = () => {
    return ChainNode({
        url: 'https://sdk-mainnet.aepps.com',
        internalUrl: 'https://sdk-mainnet.aepps.com',
        networkId: 'ae_uat'
    });
};

const countVotes = async () => {
    const votingAcc = 'ak_11111111111111111111111111111111273Yts';

    // 1. fetch all txs towards voting account from middleware
    console.log("1. fetch all txs towards voting account from middleware");
    const votingAccTxs = await axios.get(`${middlewareUrl}/middleware/transactions/account/${votingAcc}`).catch(console.error).then(res => res.data);

    return await AeComputeVotingTx.computeTransactions(votingAccTxs, await getClient());
};

// countVotes();

module.exports = {
    countVotes: countVotes
};
