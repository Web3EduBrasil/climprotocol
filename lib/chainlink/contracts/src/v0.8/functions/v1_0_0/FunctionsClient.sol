// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Minimal stub of Chainlink FunctionsClient used by ClimateOracle.
 * Provides a simple _sendRequest and a router-caller hook to forward
 * responses to the child's `fulfillRequest` implementation.
 */
contract FunctionsClient {
    address public router;

    constructor(address _router) {
        router = _router;
    }

    event RequestSent(bytes32 indexed requestId);

    function _sendRequest(bytes memory cbor, uint64 /* subscriptionId */, uint32 /* gasLimit */, bytes32 /* donID */) internal returns (bytes32) {
        bytes32 requestId = keccak256(abi.encodePacked(cbor, block.timestamp, address(this)));
        emit RequestSent(requestId);
        return requestId;
    }

    /**
     * @dev Called by the Chainlink router (simulated here) to deliver responses.
     * The implementation calls the internal virtual `fulfillRequest` so child
     * contracts can override it.
     */
    function rawFulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) external {
        require(msg.sender == router, "Only router");
        fulfillRequest(requestId, response, err);
    }

    // Child contracts must implement this to handle responses.
    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal virtual {}
}
