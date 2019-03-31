const {Universal} = require('@aeternity/aepp-sdk');
const axios = require('axios');

const votingAcc = 'ak_2V5w6BVQYzP66VCtxQUfM9QJP2dN6bBENJXNsQTpqFcc5CDTNB';


const getClient = () => {
    return Universal({
        url: 'https://sdk-testnet.aepps.com',
        internalUrl: 'https://sdk-testnet.aepps.com',
        keypair: {
            secretKey: '',
            publicKey: 'ak_twR4h7dEcUtc2iSEDv8kB7UFJJDGiEDQCXr85C3fYF8FdVdyo'
        },
        networkId: 'ae_uat'
    });
};

// same with async
const testVote = async () => {

    const client = await getClient();

    const vote = {
        vote: {
            id: 1,
            option: 2
        }
    };


    client.spend(0, votingAcc, {payload: JSON.stringify(vote)});
};

const testVerify = async () => {
    // 1. fetch all txs towards voting account from middleware
    // 2. filter multiple votes by same account, filter txs for valid voting payload, filter txs for specific vote
    // 3. check stake for each voter account at height
    // 4. multiply stake by votes for options

    const votingHeight = 30000;
    const middlewareUrl = "http://localhost:8000";
    const votingAccTxs = await axios.get(`${middlewareUrl}/middleware/transactions/account/${votingAcc}`).catch(console.error).then(res => res.data.transactions);
    const filteredVotingTxs = votingAccTxs
        .filter(tx => tx.tx.type === 'SpendTx')
        .filter(tx => tx.tx.payload !== '')
        .filter(tx => {
            try {
                const payload = JSON.parse(tx.tx.payload);
                return payload.vote && payload.vote.id && payload.vote.option;
            } catch {
                return false;
            }
        })
        .map(tx => {
            const payload = JSON.parse(tx.tx.payload);
            return {
                account: tx.tx.sender_id,
                vote: payload.vote
            }
        });

    console.log(filteredVotingTxs);

    const client = await getClient();

    const balanceAtHeight = await client.balance('ak_twR4h7dEcUtc2iSEDv8kB7UFJJDGiEDQCXr85C3fYF8FdVdyo', {height: votingHeight});
    console.log(balanceAtHeight); // sdk seems to be incorrect

};

//testVote();
testVerify();
