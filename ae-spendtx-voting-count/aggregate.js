const fs = require('fs');
const BigNumber = require('bignumber.js');

const atomsToAe = (atoms) => (new BigNumber(atoms)).dividedBy(new BigNumber(1000000000000000000)).toFixed(4);

const aggregateVotes = async () => {
    let aeVotes = JSON.parse(fs.readFileSync("./ae-votes.json"));
    let ethVotes = JSON.parse(fs.readFileSync("../eth-spendtx-voting-count/eth-votes.json"));

    // Merge aevotes and ethvotes
    let allVotes = aeVotes;


    Object.keys(ethVotes).map(voteOption => {
        if (!allVotes.hasOwnProperty(voteOption)) allVotes[voteOption] = ethVotes[voteOption]
        else {
            allVotes[voteOption].totalStake = new BigNumber(aeVotes[voteOption].totalStake).plus(new BigNumber(ethVotes[voteOption].totalStake))
            allVotes[voteOption].votes = [...aeVotes[voteOption].votes, ...ethVotes[voteOption].votes]
        }
    });

    let totalStake = allVotes.map(vote => vote.totalStake).reduce((acc, cur) => acc.plus(cur), new BigNumber(0));
    console.log(`Total Stake: ${atomsToAe(totalStake)} AE`);


    let percentageVotes = allVotes.map(vote => {
        return {
            option: vote.option,
            stake: `${atomsToAe(vote.totalStake)} AE`,
            percentageOfTotal: new BigNumber(vote.totalStake).dividedBy(totalStake).multipliedBy(100).toFixed(2)
        }
    });
    console.log(percentageVotes);


    let votesWithoutZero = allVotes.filter(vote => vote.option !== '0');
    let totalStakeWithoutZero = votesWithoutZero.map(vote => vote.totalStake).reduce((acc, cur) => acc.plus(cur), new BigNumber(0));
    let weightedAverages = votesWithoutZero
        .map(vote => new BigNumber(vote.option).multipliedBy(new BigNumber(vote.totalStake)))
        .reduce((acc, cur) => acc.plus(cur), new BigNumber(0));
    console.log(`Weighted Average of 1% to 20%: ${weightedAverages.dividedBy(totalStakeWithoutZero).toFixed(8)} %`);
};

aggregateVotes();
