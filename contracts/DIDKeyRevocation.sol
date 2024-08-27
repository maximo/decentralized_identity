pragma solidity ^0.4.24;

import "./Utils/DID.sol";
import "./Utils/EC.sol";

contract DIDKeyRevocation {
    using DID for *;
    using EC for *;

    // public key => timestamp mapping
    mapping (address => uint256) revocation;

    /*
        EVENTS
    */

    event Revoked(address output, uint256 timestamp);

    /* 
        MODIFIERS 
    */

    modifier isAddressValid(address wallet) {
        require(wallet != 0x0);
        _;
    }

    /*
        FUNCTIONS
    */

    function Revoke(address public_key_account, bytes signed_hash) external isAddressValid(public_key_account) {

        uint256 _timestamp = revocation[public_key_account];

        if (_timestamp > 0) {
            emit Revoked(public_key_account, _timestamp);
            return;
        }

        // generate hash
        bytes32 _hash = keccak256(abi.encodePacked("\x19Signed Claim Revocation:", public_key_account));

        // validate signature
        require(true == EC.verify(_hash, signed_hash, public_key_account));

        // revoke public key with current timestamp
        revocation[public_key_account] = now;
        emit Revoked(public_key_account, revocation[public_key_account]);
    }

    function Check(address public_key_account) public view isAddressValid(public_key_account) returns (uint256) {

        return (revocation[public_key_account]);
    }
}
