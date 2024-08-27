pragma solidity ^0.4.24;

// source: https://gist.github.com/axic/5b33912c6f61ae6fd96d6c4a47afde6d

// Written by Alex Beregszaszi (@axic), use it under the terms of the MIT license.

library EC {
    function recovery(bytes32 hash, bytes sig) internal pure returns (bool, address) {
        bytes32 r;
        bytes32 s;
        uint8 v;

        if (sig.length != 65)
          return (false, 0);

        // The signature format is a compact form of:
        //   {bytes32 r}{bytes32 s}{uint8 v}
        // Compact means, uint8 is not padded to 32 bytes.
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))

            // Here we are loading the last 32 bytes. We exploit the fact that
            // 'mload' will pad with zeroes if we overread.
            // There is no 'mload8' to do this, but that would be nicer.
            v := byte(0, mload(add(sig, 96)))

            // Alternative solution:
            // 'byte' is not working due to the Solidity parser, so lets
            // use the second best option, 'and'
            // v := and(mload(add(sig, 65)), 255)
        }

        // albeit non-transactional signatures are not specified by the YP, one would expect it
        // to match the YP range of [27, 28]
        //
        // geth uses [0, 1] and some clients have followed. This might change, see:
        //  https://github.com/ethereum/go-ethereum/issues/2053
        if (v < 27)
          v += 27;

        if (v != 27 && v != 28)
            return (false, 0);

        bytes memory _prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 _prefix_hash = keccak256(abi.encodePacked(_prefix, hash));

        return (true, ecrecover(_prefix_hash, v, r, s));
    }

    function verify(bytes32 hash, bytes sig, address signer) internal pure returns (bool) {
        bool ret;
        address addr;
        (ret, addr) = recovery(hash, sig);
        return ret == true && addr == signer;
    }
}
