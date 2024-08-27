pragma solidity ^0.4.24;

library Conversion {
    /* NOT USED
    function Bytes32ToBytes(bytes32 _bytes32) internal pure returns (bytes) {

        bytes memory _bytes = new bytes(32);
        for (uint256 i; i < 32; i++) {
            _bytes[i] = _bytes32[i];
        }
        return _bytes;
    }
    */

    function BytesToBytes32(bytes memory source) internal pure returns (bytes32 result) {

        if (source.length == 0) {
            return 0x0;
        }

        assembly {
            result := mload(add(source, 32))
        }
        return result;
    }
}