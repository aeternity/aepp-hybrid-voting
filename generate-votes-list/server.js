const Web3 = require("web3");
require('dotenv').config();
const axios = require('axios');
const express = require('express');

var Web3getInfoUrl = process.env.NODE_WEB3_URL;
const TOKEN_ADDRESS = process.env.NODE_TOKEN_CONTRACT;
const VOTING_CONTRACT_ADDRESS = process.env.NODE_VOTING_CONTRACT;
const BLOCK_NUMBER = process.env.NODE_BLOCK_NUMBER;
const DELIVERY_PERIOD = process.env.NODE_DELIVERY_PERIOD;
const BL_ID = process.env.NODE_BL_ID
const BL_KEY = process.env.NODE_BL_KEY
const TABLE = process.env.NODE_BL_TABLE;
const BL_URL = `https://api.backendless.com/${BL_ID}/${BL_KEY}`

var web3 = new Web3(new Web3.providers.HttpProvider(Web3getInfoUrl));
var AETokenABI = require("./AEToken.json");
var AEToken = new web3.eth.Contract(AETokenABI, TOKEN_ADDRESS);

var VotingContractABI = require("./SimpleVote.json");
var VotingContract = new web3.eth.Contract(VotingContractABI, VOTING_CONTRACT_ADDRESS);

const app = express();

app.get('/vote/:address', getVote);

async function getVote(request, response) {
    var voter = request.params.address;
    if (!voter || !web3.utils.isAddress(voter)) {
        response.writeHeader(400, { "Content-Type": "application/json" });
        response.write(JSON.stringify({
            error: true,
            message: "Invalid address"
        }));
        response.end();
    } else {
        try {
            // fetch the vote
            var vote = await VotingContract.methods.getVote(voter).call();
            // get the balance at height
            var balanceAtHeight = new web3.utils.BN(
                await AEToken.methods.balanceOf(voter).call(BLOCK_NUMBER));
            // check Burns in the current delivery period
            var res = await axios.get(
                `${BL_URL}/data/${TABLE}?where=from%3D%27${voter}%27%20AND%20deliveryPeriod%3D${DELIVERY_PERIOD}`,
            );

            var burnedTokens = new web3.utils.BN(0);
            for (var j = 0; j < res.data.length; j++) {
                let transactionHash = res.data[j].transactionHash;
                let txReceipt = await web3.eth.getTransactionReceipt(transactionHash);
                if (txReceipt.blockNumber < BLOCK_NUMBER)
                    burnedTokens = burnedTokens.add(new web3.utils.BN(res.data[j].value));
            }

            response.writeHeader(200, { "Content-Type": "application/json" });
            response.write(JSON.stringify({
                voter: voter,
                vote: vote,
                totalBalance: balanceAtHeight.add(new web3.utils.BN(burnedTokens)).toString(),
                burnedTokens: burnedTokens.toString(),
                ownedTokens: balanceAtHeight.toString()
            }));
            response.end();
        } catch (err) {
            console.log(err);
            response.writeHeader(500, { "Content-Type": "application/json" });
            response.write(JSON.stringify({
                error: true,
                message: err
            }));
        }
    }
}

app.listen(8080);