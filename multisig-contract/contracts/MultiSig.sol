pragma solidity ^0.4.25;

/**
 * Multi-sig functionality for a contract.
 *
 * Two admins are defined in the constructor and a `onlyOwner` modifier is added.
 *
 * When a method is annotated with the modifier, both admins have to call the
 * method with the exact same arguments in order for it to be executed
 * successfully.
 */
contract Ownable {
    // First administrator for multi-sig mechanism
    address private admin1;

    // Second administrator for multi-sig mechanism
    address private admin2;

    // store the hashes of admins' msg.data
    mapping (address => bytes32) private multiSigHashes;

    /**
    *  @param _admin1 The first admin account that owns this contract.
    *  @param _admin2 The second admin account that owns this contract.
    */
    constructor(
        address _admin1,
        address _admin2
    )
        internal
    {
        // admin1 and admin2 address must be set and must be different
        require (_admin1 != 0x0);
        require (_admin2 != 0x0);
        require (_admin1 != _admin2);

        admin1 = _admin1;
        admin2 = _admin2;
    }

    modifier onlyOwner() {
        // check if transaction sender is admin.
        require (msg.sender == admin1 || msg.sender == admin2);

        // if yes, store his msg.data.
        multiSigHashes[msg.sender] = keccak256(msg.data);

        // check if his stored msg.data hash equals to the one of the other admin
        if ((multiSigHashes[admin1]) == (multiSigHashes[admin2])) {
            // if yes, both admins agreed - continue.
            _;

            // Reset hashes after successful execution
            multiSigHashes[admin1] = 0x0;
            multiSigHashes[admin2] = 0x0;
        } else {
            // if not (yet), return.
            return;
        }
    }
}
