pragma solidity ^0.5.0;

contract SimpleVote {
    
    // simply iterate over arrays, with totalVotes - 1 as an index
    address[] public voters;
    int8[] public votes;
    int256 public totalVotes;
    int8 public maxVoteValue;
    
    mapping (address=> int8) public getVote;

    constructor (int8 _maxVoteValue) public {
        maxVoteValue = _maxVoteValue;
    }
    
    function vote(int8 _vote) public returns (bool) {
        // TODO: Uncomment next line in production, testing is easier like this now. It's prohibiting users from votig multiple times.
        //require(getVote[msg.sender] == 0, "Sender has voted already");
        require(_vote <= maxVoteValue, "Voted for value higher than allowed");
        getVote[msg.sender] = _vote;
        voters.push(msg.sender);
        votes.push(_vote);
        totalVotes++;
    }
    
}