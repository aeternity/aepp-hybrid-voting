var SimpleVote = artifacts.require("./SimpleVote.sol");

module.exports = function(deployer) {
  deployer.deploy(SimpleVote, 19);
};
