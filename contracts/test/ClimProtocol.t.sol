// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import "../src/ClimProtocol.sol";
import "../src/core/ClimateEventToken.sol";
import "../src/core/ClimateEventFactory.sol";
import "../src/core/LiquidityPool.sol";
import "../src/core/SettlementEngine.sol";
import "../src/oracle/ClimateOracle.sol";

contract ClimProtocolTest is Test {
    ClimProtocol public protocol;
    ClimateEventToken public climateToken;
    ClimateEventFactory public factory;
    LiquidityPool public liquidityPool;
    SettlementEngine public settlementEngine;
    ClimateOracle public oracle;
    
    address public owner = address(0x1);
    address public liquidityProvider = address(0x2);
    address public tokenBuyer = address(0x3);
    
    // Mock Chainlink Functions router for testing
    address public mockRouter = address(0x999);
    uint64 public constant SUBSCRIPTION_ID = 1;
    bytes32 public constant DON_ID = 0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000;
    
    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy contracts
        climateToken = new ClimateEventToken();
        liquidityPool = new LiquidityPool();
        oracle = new ClimateOracle(mockRouter, SUBSCRIPTION_ID, DON_ID);
        settlementEngine = new SettlementEngine(
            address(climateToken),
            address(liquidityPool),
            address(oracle)
        );
        factory = new ClimateEventFactory(
            address(climateToken),
            address(liquidityPool),  
            address(settlementEngine)
        );
        protocol = new ClimProtocol(
            address(climateToken),
            address(factory),
            address(liquidityPool),
            address(settlementEngine),
            address(oracle)
        );
        
        // Setup roles
        climateToken.grantRole(climateToken.MINTER_ROLE(), address(factory));
        climateToken.grantRole(climateToken.SETTLER_ROLE(), address(settlementEngine));
        liquidityPool.grantRole(liquidityPool.POOL_MANAGER_ROLE(), address(factory));
        liquidityPool.grantRole(liquidityPool.POOL_MANAGER_ROLE(), address(settlementEngine));
        oracle.grantRole(oracle.ORACLE_REQUESTER_ROLE(), address(settlementEngine));
        factory.grantRole(factory.EVENT_CREATOR_ROLE(), owner);
        // Allow factory to register events with the settlement engine
        settlementEngine.grantRole(settlementEngine.AUTOMATION_ROLE(), address(factory));
        
        vm.stopPrank();
        
        // Provide some ETH to test accounts
        vm.deal(owner, 100 ether);
        vm.deal(liquidityProvider, 100 ether);
        vm.deal(tokenBuyer, 10 ether);
    }
    
    function testInitialSetup() public view {
        // Test that all contracts are deployed and connected
        assertEq(address(protocol.climateToken()), address(climateToken));
        assertEq(address(protocol.factory()), address(factory));
        assertEq(address(protocol.liquidityPool()), address(liquidityPool));
        assertEq(address(protocol.settlementEngine()), address(settlementEngine));
        assertEq(address(protocol.oracle()), address(oracle));
    }
    
    function testLiquidityProvision() public {
        vm.startPrank(liquidityProvider);
        
        // Provide liquidity
        liquidityPool.deposit{value: 10 ether}();
        
        assertEq(liquidityPool.getLPBalance(liquidityProvider), 10 ether);
        assertEq(liquidityPool.totalLiquidity(), 10 ether);
        assertEq(liquidityPool.availableLiquidity(), 10 ether);
        
        vm.stopPrank();
    }
    
    function testEventCreation() public {
        // First provide liquidity
        vm.prank(liquidityProvider);
        liquidityPool.deposit{value: 10 ether}();
        
        vm.startPrank(owner);
        
        // Create a climate event
        int256 latitude = -8_050_000; // Recife, Brazil (-8.05 degrees * 1e6)
        int256 longitude = -34_881_000; // Recife, Brazil (-34.881 degrees * 1e6)
        uint256 startTime = block.timestamp + 1 days;
        uint256 endTime = startTime + 30 days;
        uint256 thresholdMm = 30_000; // 30mm * 1000
        uint256 payoutPerToken = 0.01 ether;
        uint256 tokensToCreate = 100;
        
        uint256 eventId = factory.createClimateEvent(
            latitude,
            longitude,
            startTime,
            endTime,
            thresholdMm,
            payoutPerToken,
            tokensToCreate
        );
        
        // Check event was created
        IClimateEvent.ClimateEventData memory eventData = climateToken.getEventData(eventId);
        assertEq(eventData.latitude, latitude);
        assertEq(eventData.longitude, longitude);
        assertEq(eventData.thresholdMm, thresholdMm);
        assertEq(eventData.totalSupply, tokensToCreate);
        
        // Check tokens were minted to factory
        assertEq(climateToken.balanceOf(address(factory), eventId), tokensToCreate);
        
        vm.stopPrank();
    }
    
    function testTokenPurchase() public {
        // Setup: provide liquidity and create event
        vm.prank(liquidityProvider);
        liquidityPool.deposit{value: 10 ether}();
        
        vm.prank(owner);
        uint256 eventId = factory.createClimateEvent(
            -8_050_000, // Recife latitude
            -34_881_000, // Recife longitude  
            block.timestamp + 1 days,
            block.timestamp + 31 days,
            30_000, // 30mm threshold
            0.01 ether, // payout per token
            100 // tokens to create
        );
        
        // Calculate premium
        uint256 premium = factory.getEventPremium(eventId);
        uint256 tokensToBuy = 10;
        uint256 totalCost = premium * tokensToBuy;
        
        vm.startPrank(tokenBuyer);
        
        // Buy tokens
        factory.buyClimateTokens{value: totalCost}(eventId, tokensToBuy);
        
        // Check buyer received tokens
        assertEq(climateToken.balanceOf(tokenBuyer, eventId), tokensToBuy);
        
        // Check factory has fewer tokens
        assertEq(climateToken.balanceOf(address(factory), eventId), 100 - tokensToBuy);
        
        vm.stopPrank();
    }
    
    function testProtocolStats() public {
        // Provide liquidity
        vm.prank(liquidityProvider);
        liquidityPool.deposit{value: 5 ether}();
        
        // Get stats
        (
            uint256 totalLiquidity,
            uint256 availableLiquidity,
            uint256 activeEvents,
            string memory version
        ) = protocol.getProtocolStats();
        
        assertEq(totalLiquidity, 5 ether);
        assertEq(availableLiquidity, 5 ether);
        assertEq(activeEvents, 0);
        assertEq(version, "1.0.0");
    }
    
    function testQuickBuyFunction() public {
        // Setup
        vm.prank(liquidityProvider);
        liquidityPool.deposit{value: 10 ether}();
        
        vm.prank(owner);
        uint256 eventId = factory.createClimateEvent(
            -8_050_000,
            -34_881_000,
            block.timestamp + 1 days,
            block.timestamp + 31 days,
            30_000,
            0.01 ether,
            100
        );
        
        // Use protocol's quick buy
        uint256 premium = factory.getEventPremium(eventId);
        uint256 tokenAmount = 5;
        
        vm.prank(tokenBuyer);
        protocol.quickBuy{value: premium * tokenAmount}(eventId, tokenAmount);
        
        assertEq(climateToken.balanceOf(tokenBuyer, eventId), tokenAmount);
    }
    
    function testContractAddresses() public view {
        (
            address tokenContract,
            address factoryContract,
            address poolContract,
            address settlementContract,
            address oracleContract
        ) = protocol.getContractAddresses();
        
        assertEq(tokenContract, address(climateToken));
        assertEq(factoryContract, address(factory));
        assertEq(poolContract, address(liquidityPool));
        assertEq(settlementContract, address(settlementEngine));
        assertEq(oracleContract, address(oracle));
    }
}