const {ChainNode} = require('@aeternity/aepp-sdk');
const AeComputeVotingTx = require('./ae-compute-voting-transactions');

const getClient = () => {
    return ChainNode({
        url: 'http://127.0.0.1:3013',
        internalUrl: 'http://127.0.0.1:3113',
    });
};

const range = (start, end) => {
    return Array(end - start + 1).fill().map((_, idx) => start + idx)
};

const countVotes = async () => {
    const votingAcc = 'ak_11111111111111111111111111111111273Yts';
    const votingEndingHeight = 80541;
    const votingStartHeight = 71860;

    const client = await getClient();

    const height = await client.height();
    const lastConsideredHeight = height < votingEndingHeight ? height : votingEndingHeight;
    const consideredBlockHeights = range(votingStartHeight, lastConsideredHeight);

    // 1. fetch all txs towards voting account from node
    console.log("1. fetch all txs towards voting account from node");

    const consideredTransactions = [];
    for (let height of consideredBlockHeights) {
        if (height % 100 == 0) process.stdout.write(`${height}, `);
        const generation = await client.getGeneration(height).catch(console.error);

        for (let microBlock of generation.microBlocks) {
            consideredTransactions.push(...(await client.getMicroBlockTransactions(microBlock).catch(console.error)))
        }
    }

    const filteredVotingTxs = consideredTransactions
        .filter(tx => tx.tx.type === 'SpendTx') // filter spend transactions
        .filter(tx => tx.tx.recipientId === votingAcc); // filter spend transactions

    return await AeComputeVotingTx.computeTransactions(filteredVotingTxs, client);
};

// countVotes();

module.exports = {
    countVotes: countVotes
};
