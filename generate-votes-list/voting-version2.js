const Web3 = require("web3");
require('dotenv').config();
const fs = require('fs');
const axios = require('axios')
const ProgressBar = require('progress');

var Web3getInfoUrl = process.env.NODE_WEB3_URL;
const TOKEN_ADDRESS = process.env.NODE_TOKEN_CONTRACT;
const VOTING_CONTRACT_ADDRESS = process.env.NODE_VOTING_CONTRACT;
const BLOCK_NUMBER = process.env.NODE_BLOCK_NUMBER;
const DELIVERY_PERIOD = process.env.NODE_DELIVERY_PERIOD;
const BL_ID = process.env.NODE_BL_ID
const BL_KEY = process.env.NODE_BL_KEY
const TABLE = process.env.NODE_BL_TABLE;
const BL_URL = `https://api.backendless.com/${BL_ID}/${BL_KEY}`
var json = {};
var lastCount = 0;
var bar;

web3 = new Web3(new Web3.providers.HttpProvider(Web3getInfoUrl));
var AETokenABI = require("./AEToken.json");
var AEToken = new web3.eth.Contract(AETokenABI, TOKEN_ADDRESS);

var VotingContractABI = require("./SimpleVote.json");
var VotingContract = new web3.eth.Contract(VotingContractABI, VOTING_CONTRACT_ADDRESS);

process
  .on('exit', (code) => {
    if (code == 0) {
      if (fs.existsSync("./.cfg"))
        fs.unlinkSync("./.cfg");
      console.log(`File saved: votes.json.`);
    }
  })
  .on('SIGINT', onexit)
  .on('SIGTERM', onexit);

function onexit() {
  console.log('*** EXITING ***');
  saveState();
  process.exit(1);
}


async function start() {
    console.log("Starting...");
    checkConfig();
    await setupProgressBar();

    if (lastCount != 0)
        bar.tick(lastCount);

    var votersCount = await VotingContract.methods.totalVotes().call();

    var i = lastCount == 0 ? 0 : lastCount;

    for (i ; i < votersCount; i++) {
        var voter = await VotingContract.methods.voters(i).call();
        // fetch the vote
        var vote = await VotingContract.methods.getVote(voter).call();
        // get the balance at height
        var balanceAtHeight = new web3.utils.BN(
            await AEToken.methods.balanceOf(voter).call(BLOCK_NUMBER));
        // check Burns in the current delivery period
        var response = await axios.get(
            `${BL_URL }/data/${TABLE}?where=from%3D%27${voter}%27%20AND%20deliveryPeriod%3D${DELIVERY_PERIOD}`,
            );

        var burnedTokens = new web3.utils.BN(0);
        for (var j = 0; j < response.data.length; j++) {
            let transactionHash = response.data[j].transactionHash;
            let txReceipt = await web3.eth.getTransactionReceipt(transactionHash);
            if (txReceipt.blockNumber < BLOCK_NUMBER)
            burnedTokens = burnedTokens.add(new web3.utils.BN(response.data[j].value));
        }

        json[voter] = {
            "vote": Number(vote),
            "balance": balanceAtHeight.add(new web3.utils.BN(burnedTokens)),
            "burnedTokens": burnedTokens,
            "ownedTokens": balanceAtHeight
        };
        lastCount = i;
        bar.tick();
    }
    saveJSON();
}

async function setupProgressBar() {
    let total = await VotingContract.methods.totalVotes().call();
    console.log(total + " voters to be processed");
    bar = new ProgressBar(':bar :current/:total voters found.', { total: Number(total), renderThrottle : 1});
}

function checkConfig() {
    if (fs.existsSync("./.cfg") && fs.existsSync("./votes.json")) {
      let input = fs.readFileSync("./.cfg");
      let jsonConfig = JSON.parse(input);
      lastCount = jsonConfig.lastCount;
      input = fs.readFileSync("./votes.json");
      json = JSON.parse(input);
    }
}

function saveJSON() {
    let jsonString = JSON.stringify(json, Object.keys(json).concat(["vote", "balance"]), 2);
    jsonString = jsonString.replace(/: "/gm, ': ')
    jsonString = jsonString.replace(/",$/gm, ',')
    jsonString = jsonString.replace(/"$/gm, '')
    fs.writeFileSync("./votes.json", jsonString+'\n') ;
  }
  
  function saveCFG() {
    fs.writeFileSync("./.cfg", JSON.stringify({ lastCount: lastCount }))
  }
  
  function saveState() {
    saveJSON();
    saveCFG();
  }

start();