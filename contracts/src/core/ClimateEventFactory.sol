// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IClimProtocol.sol";
import "./ClimateEventToken.sol";
import "./LiquidityPool.sol";
import "./SettlementEngine.sol";

/**
 * @title ClimateEventFactory
 * @dev Factory contract for creating new climate events
 */
contract ClimateEventFactory is AccessControl, ReentrancyGuard {
    bytes32 public constant EVENT_CREATOR_ROLE = keccak256("EVENT_CREATOR_ROLE");
    
    ClimateEventToken public immutable climateToken;
    LiquidityPool public immutable liquidityPool;
    SettlementEngine public immutable settlementEngine;
    
    // Event creation parameters
    uint256 public eventCounter;
    uint256 public constant MIN_EVENT_DURATION = 1 days;
    uint256 public constant MAX_EVENT_DURATION = 365 days;
    uint256 public constant MIN_PAYOUT_PER_TOKEN = 0.001 ether;
    
    // Premium calculation parameters
    uint256 public basePremiumRate = 100; // 10% base premium (1000 = 100%)
    uint256 public riskMultiplier = 50; // Additional risk factor
    
    event EventCreated(
        uint256 indexed eventId,
        address indexed creator,
        int256 latitude,
        int256 longitude,
        uint256 startTime,
        uint256 endTime,
        uint256 thresholdMm,
        uint256 tokensAvailable,
        uint256 premiumPerToken
    );
    
    constructor(
        address _climateToken,
        address _liquidityPool,
        address _settlementEngine
    ) {
        climateToken = ClimateEventToken(_climateToken);
        liquidityPool = LiquidityPool(payable(_liquidityPool));
        settlementEngine = SettlementEngine(_settlementEngine);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EVENT_CREATOR_ROLE, msg.sender);
    }
    
    /**
     * @dev Creates a new climate event
     * @param latitude Latitude in degrees (scaled by 1e6)
     * @param longitude Longitude in degrees (scaled by 1e6)
     * @param startTime Event start timestamp
     * @param endTime Event end timestamp
     * @param thresholdMm Precipitation threshold in mm (scaled by 1e3)
     * @param payoutPerToken Payout amount per token in wei
     * @param tokensToCreate Number of tokens to create and make available
     */
    function createClimateEvent(
        int256 latitude,
        int256 longitude,
        uint256 startTime,
        uint256 endTime,
        uint256 thresholdMm,
        uint256 payoutPerToken,
        uint256 tokensToCreate
    ) external onlyRole(EVENT_CREATOR_ROLE) returns (uint256 eventId) {
        // Validation
        require(startTime > block.timestamp + 1 hours, "Start time must be at least 1 hour in future");
        require(endTime > startTime, "End time must be after start time");
        require(endTime - startTime >= MIN_EVENT_DURATION, "Event duration too short");
        require(endTime - startTime <= MAX_EVENT_DURATION, "Event duration too long");
        require(payoutPerToken >= MIN_PAYOUT_PER_TOKEN, "Payout per token too low");
        require(tokensToCreate > 0, "Must create at least one token");
        require(thresholdMm > 0, "Threshold must be positive");
        
        // Validate coordinates (rough bounds check)
        require(latitude >= -90_000_000 && latitude <= 90_000_000, "Invalid latitude");
        require(longitude >= -180_000_000 && longitude <= 180_000_000, "Invalid longitude");
        
        // Calculate required collateral
        uint256 maxPayout = tokensToCreate * payoutPerToken;
        uint256 requiredCollateral = liquidityPool.calculateRequiredCollateral(maxPayout);
        
        require(liquidityPool.availableLiquidity() >= requiredCollateral, "Insufficient liquidity");
        
        // Generate unique event ID
        eventCounter++;
        eventId = _generateEventId(
            latitude,
            longitude,
            startTime,
            endTime,
            thresholdMm,
            eventCounter
        );
        
        // Create event data
        IClimateEvent.ClimateEventData memory eventData = IClimateEvent.ClimateEventData({
            latitude: latitude,
            longitude: longitude,
            startTime: startTime,
            endTime: endTime,
            thresholdMm: thresholdMm,
            payoutPerToken: payoutPerToken,
            totalSupply: tokensToCreate,
            actualMm: 0,
            status: IClimateEvent.EventStatus.ACTIVE
        });
        
        // Lock collateral in liquidity pool
        liquidityPool.lockCollateral(eventId, requiredCollateral);
        
        // Create event and mint tokens to this contract
        climateToken.createEvent(eventId, eventData, address(this), tokensToCreate);
        
        // Add event to settlement engine for monitoring
        settlementEngine.addEventForSettlement(eventId);
        
        // Calculate premium per token
        uint256 premiumPerToken = calculatePremium(payoutPerToken, endTime - startTime);
        
        emit EventCreated(
            eventId,
            msg.sender,
            latitude,
            longitude,
            startTime,
            endTime,
            thresholdMm,
            tokensToCreate,
            premiumPerToken
        );
        
        return eventId;
    }
    
    /**
     * @dev Allows users to buy climate event tokens
     * @param eventId The event ID
     * @param tokenAmount Number of tokens to buy
     */
    function buyClimateTokens(uint256 eventId, uint256 tokenAmount) 
        external 
        payable 
        nonReentrant 
    {
        require(tokenAmount > 0, "Must buy at least one token");
        
        IClimateEvent.ClimateEventData memory eventData = climateToken.getEventData(eventId);
        require(eventData.status == IClimateEvent.EventStatus.ACTIVE, "Event not active");
        require(block.timestamp < eventData.startTime, "Event already started");
        
        // Check token availability
        uint256 availableTokens = climateToken.balanceOf(address(this), eventId);
        require(tokenAmount <= availableTokens, "Insufficient tokens available");
        
        // Calculate premium
        uint256 premiumPerToken = calculatePremium(
            eventData.payoutPerToken,
            eventData.endTime - eventData.startTime
        );
        uint256 totalPremium = tokenAmount * premiumPerToken;
        
        require(msg.value >= totalPremium, "Insufficient payment");
        
        // Transfer tokens to buyer
        climateToken.safeTransferFrom(
            address(this),
            msg.sender,
            eventId,
            tokenAmount,
            ""
        );
        
        // Send premium to liquidity pool
        liquidityPool.deposit{value: totalPremium}();
        
        // Refund excess payment
        if (msg.value > totalPremium) {
            payable(msg.sender).transfer(msg.value - totalPremium);
        }
    }
    
    /**
     * @dev Calculates premium for climate event tokens
     * @param payoutPerToken Maximum payout per token
     * @param duration Event duration in seconds
     */
    function calculatePremium(uint256 payoutPerToken, uint256 duration) 
        public 
        view 
        returns (uint256) 
    {
        // Base premium calculation
        uint256 basePremium = (payoutPerToken * basePremiumRate) / 1000;
        
        // Duration multiplier (longer events have higher premiums)
        uint256 durationMultiplier = 1000 + ((duration / 1 days) * riskMultiplier);
        
        return (basePremium * durationMultiplier) / 1000;
    }
    
    /**
     * @dev Generates a unique event ID based on parameters
     */
    function _generateEventId(
        int256 latitude,
        int256 longitude,
        uint256 startTime,
        uint256 endTime,
        uint256 thresholdMm,
        uint256 nonce
    ) internal pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
            latitude,
            longitude,
            startTime,
            endTime,
            thresholdMm,
            nonce
        )));
    }
    
    /**
     * @dev Updates premium rate parameters (admin only)
     */
    function updatePremiumParameters(
        uint256 _basePremiumRate,
        uint256 _riskMultiplier
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_basePremiumRate <= 500, "Base premium rate too high"); // Max 50%
        require(_riskMultiplier <= 200, "Risk multiplier too high");
        
        basePremiumRate = _basePremiumRate;
        riskMultiplier = _riskMultiplier;
    }
    
    /**
     * @dev Get available tokens for an event
     */
    function getAvailableTokens(uint256 eventId) external view returns (uint256) {
        return climateToken.balanceOf(address(this), eventId);
    }
    
    /**
     * @dev Get current premium for an event
     */
    function getEventPremium(uint256 eventId) external view returns (uint256) {
        IClimateEvent.ClimateEventData memory eventData = climateToken.getEventData(eventId);
        return calculatePremium(
            eventData.payoutPerToken,
            eventData.endTime - eventData.startTime
        );
    }
    
    /**
     * @dev Emergency withdrawal of unsold tokens (admin only)
     */
    function emergencyWithdrawTokens(uint256 eventId) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        uint256 balance = climateToken.balanceOf(address(this), eventId);
        if (balance > 0) {
            climateToken.safeTransferFrom(
                address(this),
                msg.sender,
                eventId,
                balance,
                ""
            );
        }
    }
    
    /**
     * @dev Accept ERC1155 tokens
     */
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }
    
    /**
     * @dev Accept batch ERC1155 tokens
     */
    function onERC1155BatchReceived(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
}