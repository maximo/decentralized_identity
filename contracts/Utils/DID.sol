pragma solidity ^0.4.24;

import "./Strings.sol";

/* DID format:
    - version: 1 byte version number currently 1
    - network: first four bytes (32 bits) of genesis block hash
    - payload: public key
    - sha3: first four bytes of hash of (version + network + payload)

    Base58 encoding is applied resulting the following structure:
    did:life:base58(version + network + public key + sha3)
*/
library DID {
    using Strings for *;

    // constants
    bytes1 constant VERSION_NUMBER = "1";
    uint constant VERSION_SIZE = 1;
    uint constant GENESIS_SIZE = 4;
    uint constant TYPE_SIZE = 1;
    uint constant KEY_SIZE = 40;
    uint constant SHA3_SIZE = 4;

    bytes4 constant GENESIS_BLOCK = "1234";

    function Validate(bytes did) internal pure returns (bytes) {
        // parse DID
        Strings.slice memory _s = did.toSlice();
        Strings.slice memory _separator = ":".toSlice();

        bytes memory _did = _s.split(_separator).toBytes();
        bytes memory _method = _s.split(_separator).toBytes();
        // verify DID is properly formed
        require(keccak256(_did) == keccak256("did") && keccak256(_method) == keccak256("life"));

        bytes memory _id = _s.split(_separator).toBytes();
        // Base 58 decode id portion of DID
        // _id = bytes(Decode(_id));

        // validate version number
        require(_id[0] == VERSION_NUMBER);

        // validate genesis block
        for (uint i = 1; i < GENESIS_SIZE + 1; i++) {
            require(_id[i] == GENESIS_BLOCK[i - 1]);
        }

        // retrieve public key from DID
        bytes memory _pubkey = new bytes(KEY_SIZE);
        for (i = 0; i < KEY_SIZE; i++) {
            _pubkey[i] = _id[i + GENESIS_SIZE + VERSION_SIZE + TYPE_SIZE];
        }

        // extract id without sha3 suffix
        bytes memory _id_without_sha3 = new bytes(VERSION_SIZE + GENESIS_SIZE + TYPE_SIZE + KEY_SIZE);
        for (i = 0; i < VERSION_SIZE + GENESIS_SIZE + TYPE_SIZE + KEY_SIZE; i++) {
            _id_without_sha3[i] = _id[i];
        }
        // compute hash of id without sha3 suffix
        bytes memory _hash = bytes32bytes(keccak256(_id_without_sha3));

        // validate sha3 hash from DID
        for (i = 0; i < SHA3_SIZE; i++) {
            require(_hash[i] == _id[VERSION_SIZE + GENESIS_SIZE + TYPE_SIZE + KEY_SIZE + i]);
        }

        return _pubkey;
    }

    function ConvertAddresstoBytes(address x) internal pure returns (bytes) {
        bytes memory s = new bytes(40);

        for (uint i = 0; i < 20; i++) {
            byte b = byte(uint8(uint(x) / (2**(8*(19 - i)))));
            byte hi = byte(uint8(b) / 16);
            byte lo = byte(uint8(b) - 16 * uint8(hi));
            s[2*i] = char(hi);
            s[2*i+1] = char(lo);
        }
        return s;
    }

    function char(byte b) private pure returns (byte c) {
        if (b < 10) return byte(uint8(b) + 0x30);
        else return byte(uint8(b) + 0x57);
    }

    function bytes32bytes(bytes32 b32) private pure returns (bytes) {
        bytes memory s = new bytes(64);

        for (uint i = 0; i < 32; i++) {
            byte b = byte(b32[i]);
            byte hi = byte(uint8(b) / 16);
            byte lo = byte(uint8(b) - 16 * uint8(hi));
            s[i*2] = char(hi);
            s[i*2+1] = char(lo);
        }

        return s;
    }
}
