pragma solidity ^0.5.0;

contract SimpleVote {
    
    // simply iterate over arrays, with totalVotes - 1 as an index
    address[] public voters;
    //int8[] public votes;
    int256 public totalVotes;
    int8 public maxVoteValue;
    
    mapping (address=> int8) public getVote;
    mapping (address=> bool) public hasVoted;

    constructor (int8 _maxVoteValue) public {
        maxVoteValue = _maxVoteValue;
    }
    
    function vote(int8 _vote) public returns (bool) {
        require(_vote <= maxVoteValue, "Voted for value higher than allowed");
        getVote[msg.sender] = _vote;
        if(hasVoted[msg.sender] == false) {
            hasVoted[msg.sender] == true
            voters.push(msg.sender);
            totalVotes++;
        }
    }
}
