// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IClimProtocol.sol";
import "./ClimateEventToken.sol";
import "./LiquidityPool.sol";
import "../oracle/ClimateOracle.sol";

/**
 * @title SettlementEngine
 * @dev Orchestrates climate event settlement using Chainlink Automation
 */
contract SettlementEngine is AutomationCompatibleInterface, AccessControl, ReentrancyGuard {
    bytes32 public constant AUTOMATION_ROLE = keccak256("AUTOMATION_ROLE");
    
    ClimateEventToken public immutable climateToken;
    LiquidityPool public immutable liquidityPool;
    ClimateOracle public immutable oracle;
    
    // Settlement tracking
    mapping(uint256 => bool) public eventsRequested;
    mapping(uint256 => bool) public eventsSettled;
    
    // Array to track active events for upkeep
    uint256[] public activeEvents;
    mapping(uint256 => uint256) public eventIndexInArray;
    
    event SettlementRequested(uint256 indexed eventId, bytes32 requestId);
    event SettlementCompleted(uint256 indexed eventId, uint256 precipitationMm, bool payoutTriggered);
    
    constructor(
        address _climateToken,
        address _liquidityPool,
        address _oracle
    ) {
        climateToken = ClimateEventToken(_climateToken);
        liquidityPool = LiquidityPool(payable(_liquidityPool));
        oracle = ClimateOracle(_oracle);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(AUTOMATION_ROLE, msg.sender);
    }
    
    /**
     * @dev Adds an event to the active events list for monitoring
     */
    function addEventForSettlement(uint256 eventId) 
        external 
        onlyRole(AUTOMATION_ROLE) 
    {
        require(eventIndexInArray[eventId] == 0, "Event already tracked");
        
        activeEvents.push(eventId);
        eventIndexInArray[eventId] = activeEvents.length;
    }
    
    /**
     * @dev Chainlink Automation checkUpkeep function
     * @return upkeepNeeded True if upkeep is needed
     * @return performData Encoded event IDs that need settlement
     */
    function checkUpkeep(bytes calldata) 
        external 
        view 
        override 
        returns (bool upkeepNeeded, bytes memory performData) 
    {
        uint256[] memory eventsToSettle = new uint256[](activeEvents.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < activeEvents.length; i++) {
            uint256 eventId = activeEvents[i];
            
            if (_shouldSettleEvent(eventId)) {
                eventsToSettle[count] = eventId;
                count++;
            }
        }
        
        if (count > 0) {
            // Resize array to actual count
            uint256[] memory finalEvents = new uint256[](count);
            for (uint256 i = 0; i < count; i++) {
                finalEvents[i] = eventsToSettle[i];
            }
            
            upkeepNeeded = true;
            performData = abi.encode(finalEvents);
        }
    }
    
    /**
     * @dev Chainlink Automation performUpkeep function
     * @param performData Encoded event IDs to settle
     */
    function performUpkeep(bytes calldata performData) 
        external 
        override 
        onlyRole(AUTOMATION_ROLE) 
    {
        uint256[] memory eventsToSettle = abi.decode(performData, (uint256[]));
        
        for (uint256 i = 0; i < eventsToSettle.length; i++) {
            uint256 eventId = eventsToSettle[i];
            
            if (_shouldSettleEvent(eventId) && !eventsRequested[eventId]) {
                _requestSettlement(eventId);
            }
        }
    }
    
    /**
     * @dev Manually trigger settlement for an event (emergency function)
     */
    function manualSettlement(uint256 eventId) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(!eventsRequested[eventId], "Settlement already requested");
        _requestSettlement(eventId);
    }
    
    /**
     * @dev Process climate data and settle the event
     */
    function processSettlement(uint256 eventId) 
        external 
        onlyRole(AUTOMATION_ROLE) 
        nonReentrant 
    {
        require(eventsRequested[eventId], "Settlement not requested");
        require(!eventsSettled[eventId], "Event already settled");
        
        // Get precipitation data from oracle
        uint256 precipitationMm = oracle.getPrecipitationData(eventId);
        require(precipitationMm > 0, "No precipitation data available");
        
        // Get event data
        IClimateEvent.ClimateEventData memory eventData = climateToken.getEventData(eventId);
        
        // Settle the event in the token contract
        climateToken.settleEvent(eventId, precipitationMm);
        
        // Calculate if payout is needed
        bool payoutTriggered = precipitationMm < eventData.thresholdMm;
        
        if (payoutTriggered) {
            // Calculate total payout
            uint256 totalPayout = eventData.totalSupply * eventData.payoutPerToken;
            
            // Release collateral from liquidity pool
            liquidityPool.releaseCollateral(eventId, totalPayout);
        } else {
            // Release collateral without payout
            liquidityPool.releaseCollateral(eventId, 0);
        }
        
        eventsSettled[eventId] = true;
        _removeEventFromArray(eventId);
        
        emit SettlementCompleted(eventId, precipitationMm, payoutTriggered);
    }
    
    /**
     * @dev Internal function to request climate data
     */
    function _requestSettlement(uint256 eventId) internal {
        IClimateEvent.ClimateEventData memory eventData = climateToken.getEventData(eventId);
        
        bytes32 requestId = oracle.requestClimateData(
            eventId,
            eventData.latitude,
            eventData.longitude,
            eventData.startTime,
            eventData.endTime
        );
        
        eventsRequested[eventId] = true;
        
        emit SettlementRequested(eventId, requestId);
    }
    
    /**
     * @dev Check if an event should be settled
     */
    function _shouldSettleEvent(uint256 eventId) internal view returns (bool) {
        if (eventsSettled[eventId] || eventsRequested[eventId]) {
            return false;
        }
        
        IClimateEvent.ClimateEventData memory eventData = climateToken.getEventData(eventId);
        
        // Check if event period has ended
        return block.timestamp > eventData.endTime && 
               eventData.status == IClimateEvent.EventStatus.ACTIVE;
    }
    
    /**
     * @dev Remove event from active events array
     */
    function _removeEventFromArray(uint256 eventId) internal {
        uint256 index = eventIndexInArray[eventId];
        require(index > 0, "Event not in array");
        
        uint256 arrayIndex = index - 1;
        uint256 lastIndex = activeEvents.length - 1;
        
        if (arrayIndex != lastIndex) {
            uint256 lastEventId = activeEvents[lastIndex];
            activeEvents[arrayIndex] = lastEventId;
            eventIndexInArray[lastEventId] = index;
        }
        
        activeEvents.pop();
        eventIndexInArray[eventId] = 0;
    }
    
    /**
     * @dev Get all active events
     */
    function getActiveEvents() external view returns (uint256[] memory) {
        return activeEvents;
    }
    
    /**
     * @dev Get count of active events
     */
    function getActiveEventCount() external view returns (uint256) {
        return activeEvents.length;
    }
    
    /**
     * @dev Check if event is settled
     */
    function isEventSettled(uint256 eventId) external view returns (bool) {
        return eventsSettled[eventId];
    }
    
    /**
     * @dev Emergency function to remove stuck event
     */
    function emergencyRemoveEvent(uint256 eventId) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        _removeEventFromArray(eventId);
    }
}