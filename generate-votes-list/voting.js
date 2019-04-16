const Web3 = require("web3");
require('dotenv').config();
const fs = require('fs');
const ProgressBar = require('progress');

var Web3getInfoUrl = process.env.NODE_WEB3_URL;
var tokenAddress = process.env.NODE_TOKEN_CONTRACT;
var tokenBurnerAddress = process.env.NODE_BURNER_CONTRACT;
var votingContractAddress = process.env.NODE_VOTING_CONTRACT;
var block = process.env.NODE_BLOCK_NUMBER;
var deliveryPeriod = process.env.NODE_DELIVERY_PERIOD;
var json = {};
var lastCount = 0;
var bar;

web3 = new Web3(new Web3.providers.HttpProvider(Web3getInfoUrl));
var AETokenABI = require("./AEToken.json");
var AEToken = new web3.eth.Contract(AETokenABI, tokenAddress);

var TokenBurnerABI = require("./TokenBurner.json");
var TokenBurner = new web3.eth.Contract(TokenBurnerABI, tokenBurnerAddress);

var VotingContractABI = require("./SimpleVote.json");
var VotingContract = new web3.eth.Contract(VotingContractABI, votingContractAddress);

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
            await AEToken.methods.balanceOf(voter).call(block));
        // check Burns in the current delivery period
        var events = await TokenBurner.getPastEvents('Burn', {
                filter: {
                    _from: [voter],
                    _deliveryPeriod: [deliveryPeriod],
                },
                fromBlock: 9028627,
                toBlock: block
            }
        );

        for (var j = 0; j < events.length; j++) {
            balanceAtHeight = balanceAtHeight.add(new web3.utils.BN(events[j].returnValues._value));
        }

        json[voter] = {
            "vote": Number(vote),
            "balance": balanceAtHeight.toString()
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