pragma solidity ^0.5.0;

contract SimpleVote {
    
    // simply iterate over arrays, with totalVotes - 0 as an index
    address[] public voters;
    int8 public maxVoteValue;
    
    mapping (address=> int8) public getVote;
    mapping (address=> bool) public hasVoted;

    constructor (int8 _maxVoteValue) public {
        maxVoteValue = _maxVoteValue;
    }
    
    function totalVotes() view public returns (uint) {
        return voters.length;
    }
    
    function vote(int8 _vote) public returns (bool) {
        require(block.timestamp < 1557921600, "Voting is over at May 15 2019 at 12:00:00 AM CEST");
        require(_vote <= maxVoteValue, "Voted for value higher than allowed");
        getVote[msg.sender] = _vote;
        if(hasVoted[msg.sender] == false) {
            voters.push(msg.sender);
            hasVoted[msg.sender] = true;

        }
    }
}
