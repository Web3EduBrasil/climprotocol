// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./core/ClimateEventToken.sol";
import "./core/ClimateEventFactory.sol";
import "./core/LiquidityPool.sol";
import "./core/SettlementEngine.sol";
import "./oracle/ClimateOracle.sol";

/**
 * @title ClimProtocol
 * @dev Main facade contract for the Clim Protocol
 */
contract ClimProtocol is AccessControl {
    bytes32 public constant PROTOCOL_ADMIN_ROLE = keccak256("PROTOCOL_ADMIN_ROLE");
    
    ClimateEventToken public immutable climateToken;
    ClimateEventFactory public immutable factory;
    LiquidityPool public immutable liquidityPool;
    SettlementEngine public immutable settlementEngine;
    ClimateOracle public immutable oracle;
    
    string public constant VERSION = "1.0.0";
    
    event ProtocolDeployed(
        address indexed climateToken,
        address indexed factory,
        address indexed liquidityPool,
        address settlementEngine,
        address oracle
    );
    
    constructor(
        address _climateToken,
        address _factory,
        address _liquidityPool,
        address _settlementEngine,
        address _oracle
    ) {
        climateToken = ClimateEventToken(_climateToken);
        factory = ClimateEventFactory(_factory);
        liquidityPool = LiquidityPool(payable(_liquidityPool));
        settlementEngine = SettlementEngine(_settlementEngine);
        oracle = ClimateOracle(_oracle);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PROTOCOL_ADMIN_ROLE, msg.sender);
        
        emit ProtocolDeployed(
            _climateToken,
            _factory,
            _liquidityPool,
            _settlementEngine,
            _oracle
        );
    }
    
    /**
     * @dev Get protocol statistics
     */
    function getProtocolStats() external view returns (
        uint256 totalLiquidity,
        uint256 availableLiquidity,
        uint256 activeEvents,
        string memory version
    ) {
        return (
            liquidityPool.totalLiquidity(),
            liquidityPool.availableLiquidity(),
            settlementEngine.getActiveEventCount(),
            VERSION
        );
    }
    
    /**
     * @dev Get event details with additional computed information
     */
    function getEventDetails(uint256 eventId) external view returns (
        IClimateEvent.ClimateEventData memory eventData,
        uint256 availableTokens,
        uint256 currentPremium,
        bool isSettled
    ) {
        eventData = climateToken.getEventData(eventId);
        availableTokens = factory.getAvailableTokens(eventId);
        currentPremium = factory.getEventPremium(eventId);
        isSettled = settlementEngine.isEventSettled(eventId);
    }
    
    /**
     * @dev Quick buy function that combines premium calculation and token purchase
     */
    function quickBuy(uint256 eventId, uint256 tokenAmount) 
        external 
        payable 
    {
        factory.buyClimateTokens{value: msg.value}(eventId, tokenAmount);
    }
    
    /**
     * @dev Quick liquidity provision
     */
    function provideLiquidity() external payable {
        liquidityPool.deposit{value: msg.value}();
    }
    
    /**
     * @dev Batch redeem tokens from multiple events
     */
    function batchRedeemTokens(uint256[] calldata eventIds) external {
        for (uint256 i = 0; i < eventIds.length; i++) {
            if (climateToken.balanceOf(msg.sender, eventIds[i]) > 0) {
                climateToken.redeemTokens(eventIds[i]);
            }
        }
    }
    
    /**
     * @dev Get user portfolio information
     */
    function getUserPortfolio(address user) external view returns (
        uint256[] memory eventIds,
        uint256[] memory tokenBalances,
        uint256[] memory potentialPayouts,
        bool[] memory canRedeem
    ) {
        // This would need to be implemented with event tracking
        // For MVP, we can track via frontend or events
        uint256 activeEventCount = settlementEngine.getActiveEventCount();
        uint256[] memory activeEvents = settlementEngine.getActiveEvents();
        
        uint256 userEventCount = 0;
        for (uint256 i = 0; i < activeEvents.length; i++) {
            if (climateToken.balanceOf(user, activeEvents[i]) > 0) {
                userEventCount++;
            }
        }
        
        eventIds = new uint256[](userEventCount);
        tokenBalances = new uint256[](userEventCount);
        potentialPayouts = new uint256[](userEventCount);
        canRedeem = new bool[](userEventCount);
        
        uint256 index = 0;
        for (uint256 i = 0; i < activeEvents.length; i++) {
            uint256 eventId = activeEvents[i];
            uint256 balance = climateToken.balanceOf(user, eventId);
            
            if (balance > 0) {
                eventIds[index] = eventId;
                tokenBalances[index] = balance;
                
                IClimateEvent.ClimateEventData memory eventData = climateToken.getEventData(eventId);
                potentialPayouts[index] = balance * eventData.payoutPerToken;
                canRedeem[index] = eventData.status == IClimateEvent.EventStatus.SETTLED;
                
                index++;
            }
        }
    }
    
    /**
     * @dev Emergency pause (admin only)
     */
    function emergencyPause() external onlyRole(PROTOCOL_ADMIN_ROLE) {
        // Implementation would pause critical functions
        // For MVP, this is a placeholder
    }
    
    /**
     * @dev Get all contract addresses
     */
    function getContractAddresses() external view returns (
        address tokenContract,
        address factoryContract,
        address poolContract,
        address settlementContract,
        address oracleContract
    ) {
        return (
            address(climateToken),
            address(factory),
            address(liquidityPool),
            address(settlementEngine),
            address(oracle)
        );
    }
}