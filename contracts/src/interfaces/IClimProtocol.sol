// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IClimateEvent
 * @dev Interface for climate event definitions and state
 */
interface IClimateEvent {
    enum EventStatus {
        ACTIVE,
        SETTLED,
        EXPIRED
    }
    
    struct ClimateEventData {
        int256 latitude;        // Scaled by 1e6 (e.g., -8050000 for -8.05 degrees)
        int256 longitude;       // Scaled by 1e6
        uint256 startTime;      // Unix timestamp
        uint256 endTime;        // Unix timestamp
        uint256 thresholdMm;    // Precipitation threshold in mm (scaled by 1e3)
        uint256 payoutPerToken; // Payout amount per token in wei
        uint256 totalSupply;    // Total tokens minted for this event
        uint256 actualMm;       // Actual precipitation recorded (filled after settlement)
        EventStatus status;
    }
    
    event EventCreated(uint256 indexed eventId, int256 latitude, int256 longitude, uint256 startTime, uint256 endTime);
    event EventSettled(uint256 indexed eventId, uint256 actualMm, bool payoutTriggered);
    event TokensRedeemed(uint256 indexed eventId, address indexed user, uint256 amount, uint256 payout);
}

/**
 * @title ILiquidityPool
 * @dev Interface for liquidity pool operations
 */
interface ILiquidityPool {
    event LiquidityProvided(address indexed provider, uint256 amount);
    event LiquidityWithdrawn(address indexed provider, uint256 amount);
    event CollateralLocked(uint256 indexed eventId, uint256 amount);
    event CollateralReleased(uint256 indexed eventId, uint256 amount);
    
    function deposit() external payable;
    function withdraw(uint256 amount) external;
    function lockCollateral(uint256 eventId, uint256 amount) external;
    function releaseCollateral(uint256 eventId, uint256 amount) external;
    function availableLiquidity() external view returns (uint256);
}

/**
 * @title IClimateOracle
 * @dev Interface for Chainlink Functions climate data oracle
 */
interface IClimateOracle {
    event ClimateDataRequested(bytes32 indexed requestId, uint256 indexed eventId);
    event ClimateDataReceived(bytes32 indexed requestId, uint256 indexed eventId, uint256 precipitationMm);
    
    function requestClimateData(
        uint256 eventId,
        int256 latitude,
        int256 longitude,
        uint256 startTime,
        uint256 endTime
    ) external returns (bytes32 requestId);
}