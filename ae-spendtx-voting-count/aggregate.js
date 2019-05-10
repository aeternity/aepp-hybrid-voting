const fs = require('fs');
const BigNumber = require('bignumber.js');

const atomsToAe = (atoms) => (new BigNumber(atoms)).dividedBy(
    new BigNumber(1000000000000000000)).toFixed(4);

const aggregateVotes = () => {
  let aeVotes = JSON.parse(fs.readFileSync('./ae-votes.json'));
  let ethVotes = JSON.parse(
      fs.readFileSync('../eth-contract-voting-count/eth-votes.json'));

  // Merge aevotes and ethvotes
  let allVotes = [];

  for (let i = 0; i <= 20; i++) {
    allVotes.push({
      option: String(i),
      totalStake: new BigNumber('0'),
      votes: [],
    });
  }

  allVotes = allVotes.map(voteOption => {
    const aeOption = aeVotes.find(ae => ae.option === voteOption.option);
    const ethOption = ethVotes.find(eth => eth.option === voteOption.option);

    if (aeOption) {
      voteOption.totalStake = new BigNumber(voteOption.totalStake).plus(
          new BigNumber(aeOption.totalStake));
      voteOption.votes = [...voteOption.votes, ...aeOption.votes];
    }

    if (ethOption) {
      voteOption.totalStake = new BigNumber(voteOption.totalStake).plus(
          new BigNumber(ethOption.totalStake));
      voteOption.votes = [...voteOption.votes, ...ethOption.votes];
    }

    return voteOption;
  });

  let totalStake = allVotes.map(vote => vote.totalStake).
      reduce((acc, cur) => acc.plus(cur), new BigNumber(0));
  console.log(`Total Stake: ${atomsToAe(totalStake)} AE`);

  let percentageVotes = allVotes.map(vote => {
    return {
      option: vote.option,
      stake: `${atomsToAe(vote.totalStake)} AE`,
      percentageOfTotal: new BigNumber(vote.totalStake).dividedBy(totalStake).
          multipliedBy(100).
          toFixed(2),
    };
  });
  console.log(percentageVotes);

  let votesWithoutZero = allVotes.filter(vote => vote.option !== '0');
  let totalStakeWithoutZero = votesWithoutZero.map(vote => vote.totalStake).
      reduce((acc, cur) => acc.plus(cur), new BigNumber(0));
  let weightedAverages = votesWithoutZero.map(
      vote => new BigNumber(vote.option).multipliedBy(
          new BigNumber(vote.totalStake))).
      reduce((acc, cur) => acc.plus(cur), new BigNumber(0));
  console.log(`Weighted Average of 1% to 20%: ${weightedAverages.dividedBy(
      totalStakeWithoutZero).toFixed(8)} %`);
};

aggregateVotes();
