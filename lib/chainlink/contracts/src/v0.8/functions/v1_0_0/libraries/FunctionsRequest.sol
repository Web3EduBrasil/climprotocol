// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library FunctionsRequest {
    struct Request {
        string source;
        string[] args;
    }

    function initializeRequestForInlineJavaScript(Request memory self, string memory source) internal pure {
        self.source = source;
    }

    function setArgs(Request memory self, string[] memory args) internal pure {
        self.args = args;
    }

    function encodeCBOR(Request memory self) internal pure returns (bytes memory) {
        return abi.encode(self.source, self.args);
    }
}
