// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Minimal stub of Chainlink Automation interface used by the project.
 * This is intentionally small: only the interface SettlementEngine needs.
 */
interface AutomationCompatibleInterface {
    function checkUpkeep(bytes calldata data) external returns (bool upkeepNeeded, bytes memory performData);
    function performUpkeep(bytes calldata performData) external;
}

abstract contract AutomationCompatible is AutomationCompatibleInterface {}
