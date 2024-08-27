pragma solidity ^0.4.24;

import "./Utils/DID.sol";
import "./Utils/EC.sol";

contract ClaimsRevocation {
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

    function Revoke(address issuer_key, bytes signed_hash) external payable isAddressValid(issuer_key) {

        uint256 _timestamp = revocation[issuer_key];

        if (_timestamp > 0) {
            emit Revoked(issuer_key, _timestamp);
            return;
        }

        // generate hash
        bytes32 _hash = keccak256(abi.encodePacked("\x19Signed Claim Revocation:", issuer_key));

        // validate signature
        require(true == EC.verify(_hash, signed_hash, issuer_key));

        // revoke claim with current timestamp
        revocation[issuer_key] = now;
        emit Revoked(issuer_key, revocation[issuer_key]);
    }

    function Check(address issuer_key) public view isAddressValid(issuer_key) returns (uint256) {

        return (revocation[issuer_key]);
    }
}
