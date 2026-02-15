// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IClimProtocol.sol";

/**
 * @title ClimateEventToken
 * @dev ERC1155 token representing climate event protection
 * Each token ID represents a specific climate event
 */
contract ClimateEventToken is ERC1155, AccessControl, ReentrancyGuard, IClimateEvent {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant SETTLER_ROLE = keccak256("SETTLER_ROLE");
    
    // Mapping from event ID to climate event data
    mapping(uint256 => ClimateEventData) public climateEvents;
    
    // Mapping to track redeemed tokens per user per event
    mapping(uint256 => mapping(address => bool)) public hasRedeemed;
    
    constructor() ERC1155("https://api.climprotocol.com/metadata/{id}.json") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(SETTLER_ROLE, msg.sender);
    }
    
    /**
     * @dev Creates a new climate event and mints initial tokens
     * @param eventId Unique identifier for the event
     * @param data Climate event data
     * @param recipient Address to receive the tokens
     * @param amount Number of tokens to mint
     */
    function createEvent(
        uint256 eventId,
        ClimateEventData memory data,
        address recipient,
        uint256 amount
    ) external onlyRole(MINTER_ROLE) {
        require(climateEvents[eventId].startTime == 0, "Event already exists");
        require(data.startTime > block.timestamp, "Start time must be in future");
        require(data.endTime > data.startTime, "End time must be after start time");
        require(data.payoutPerToken > 0, "Payout must be greater than 0");
        
        data.totalSupply = amount;
        data.status = EventStatus.ACTIVE;
        climateEvents[eventId] = data;
        
        _mint(recipient, eventId, amount, "");
        
        emit EventCreated(eventId, data.latitude, data.longitude, data.startTime, data.endTime);
    }
    
    /**
     * @dev Settles an event with actual climate data
     * @param eventId The event to settle
     * @param actualMm Actual precipitation recorded in mm (scaled by 1e3)
     */
    function settleEvent(uint256 eventId, uint256 actualMm) 
        external 
        onlyRole(SETTLER_ROLE) 
    {
        ClimateEventData storage eventData = climateEvents[eventId];
        require(eventData.status == EventStatus.ACTIVE, "Event not active");
        require(block.timestamp > eventData.endTime, "Event period not ended");
        
        eventData.actualMm = actualMm;
        eventData.status = EventStatus.SETTLED;
        
        bool payoutTriggered = actualMm < eventData.thresholdMm;
        
        emit EventSettled(eventId, actualMm, payoutTriggered);
    }
    
    /**
     * @dev Allows token holders to redeem their tokens for payout if event was triggered
     * @param eventId The event ID to redeem from
     */
    function redeemTokens(uint256 eventId) external nonReentrant {
        ClimateEventData storage eventData = climateEvents[eventId];
        require(eventData.status == EventStatus.SETTLED, "Event not settled");
        require(!hasRedeemed[eventId][msg.sender], "Already redeemed");
        
        uint256 userBalance = balanceOf(msg.sender, eventId);
        require(userBalance > 0, "No tokens to redeem");
        
        hasRedeemed[eventId][msg.sender] = true;
        
        // Check if payout is triggered (precipitation below threshold)
        if (eventData.actualMm < eventData.thresholdMm) {
            uint256 payout = userBalance * eventData.payoutPerToken;
            _burn(msg.sender, eventId, userBalance);
            
            // Transfer payout using call for better security
            (bool success, ) = payable(msg.sender).call{value: payout}("");
            require(success, "Payout transfer failed");
            
            emit TokensRedeemed(eventId, msg.sender, userBalance, payout);
        } else {
            // No payout, just burn the tokens
            _burn(msg.sender, eventId, userBalance);
            emit TokensRedeemed(eventId, msg.sender, userBalance, 0);
        }
    }
    
    /**
     * @dev Returns whether an event was triggered (precipitation below threshold)
     */
    function isEventTriggered(uint256 eventId) external view returns (bool) {
        ClimateEventData storage eventData = climateEvents[eventId];
        require(eventData.status == EventStatus.SETTLED, "Event not settled");
        return eventData.actualMm < eventData.thresholdMm;
    }
    
    /**
     * @dev Returns event data for a given event ID
     */
    function getEventData(uint256 eventId) external view returns (ClimateEventData memory) {
        return climateEvents[eventId];
    }
    
    // Required overrides
    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(ERC1155, AccessControl) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
}