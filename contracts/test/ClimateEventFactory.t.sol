// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import "../src/core/ClimateEventFactory.sol";
import "../src/core/ClimateEventToken.sol";
import "../src/core/LiquidityPool.sol";
import "../src/core/SettlementEngine.sol";
import "../src/oracle/ClimateOracle.sol";

contract ClimateEventFactoryTest is Test {
    ClimateEventFactory public factory;
    ClimateEventToken public token;
    LiquidityPool public pool;
    SettlementEngine public settlement;
    ClimateOracle public oracle;
    
    address public admin = address(0x1);
    address public lp = address(0x2);
    address public buyer = address(0x3);
    address public mockRouter = address(0x999);
    
    function setUp() public {
        vm.startPrank(admin);
        
        token = new ClimateEventToken();
        pool = new LiquidityPool();
        oracle = new ClimateOracle(mockRouter, 1, bytes32(0));
        settlement = new SettlementEngine(
            address(token),
            address(pool),
            address(oracle)
        );
        factory = new ClimateEventFactory(
            address(token),
            address(pool),
            address(settlement)
        );
        
        // Setup roles
        token.grantRole(token.MINTER_ROLE(), address(factory));
        token.grantRole(token.SETTLER_ROLE(), address(settlement));
        pool.grantRole(pool.POOL_MANAGER_ROLE(), address(factory));
        pool.grantRole(pool.POOL_MANAGER_ROLE(), address(settlement));
        factory.grantRole(factory.EVENT_CREATOR_ROLE(), admin);
        settlement.grantRole(settlement.AUTOMATION_ROLE(), admin);
        
        vm.stopPrank();
        
        vm.deal(lp, 100 ether);
        vm.deal(buyer, 10 ether);
    }
    
    function testCreateClimateEvent() public {
        // Provide liquidity first
        vm.prank(lp);
        pool.deposit{value: 10 ether}();
        
        vm.prank(admin);
        uint256 eventId = factory.createClimateEvent(
            -8_050_000, // Recife latitude
            -34_881_000, // Recife longitude
            block.timestamp + 1 hours + 1,
            block.timestamp + 31 days,
            30_000, // 30mm threshold
            0.01 ether, // payout per token
            100 // tokens to create
        );
        
        assertTrue(eventId > 0);
        assertEq(factory.getAvailableTokens(eventId), 100);
    }
    
    function testCannotCreateEventWithPastStartTime() public {
        vm.prank(lp);
        pool.deposit{value: 10 ether}();
        
        vm.prank(admin);
        vm.expectRevert("Start time must be at least 1 hour in future");
        factory.createClimateEvent(
            -8_050_000,
            -34_881_000,
            block.timestamp,
            block.timestamp + 31 days,
            30_000,
            0.01 ether,
            100
        );
    }
    
    function testCannotCreateEventWithInvalidDuration() public {
        vm.prank(lp);
        pool.deposit{value: 10 ether}();
        
        vm.prank(admin);
        vm.expectRevert("Event duration too short");
        factory.createClimateEvent(
            -8_050_000,
            -34_881_000,
            block.timestamp + 1 hours + 1,
            block.timestamp + 2 hours,
            30_000,
            0.01 ether,
            100
        );
    }
    
    function testCannotCreateEventWithLowPayout() public {
        vm.prank(lp);
        pool.deposit{value: 10 ether}();
        
        vm.prank(admin);
        vm.expectRevert("Payout per token too low");
        factory.createClimateEvent(
            -8_050_000,
            -34_881_000,
            block.timestamp + 1 hours + 1,
            block.timestamp + 31 days,
            30_000,
            0.0001 ether,
            100
        );
    }
    
    function testCannotCreateEventWithInvalidLatitude() public {
        vm.prank(lp);
        pool.deposit{value: 10 ether}();
        
        vm.prank(admin);
        vm.expectRevert("Invalid latitude");
        factory.createClimateEvent(
            100_000_000, // Invalid
            -34_881_000,
            block.timestamp + 1 hours + 1,
            block.timestamp + 31 days,
            30_000,
            0.01 ether,
            100
        );
    }
    
    function testCannotCreateEventWithInvalidLongitude() public {
        vm.prank(lp);
        pool.deposit{value: 10 ether}();
        
        vm.prank(admin);
        vm.expectRevert("Invalid longitude");
        factory.createClimateEvent(
            -8_050_000,
            200_000_000, // Invalid
            block.timestamp + 1 hours + 1,
            block.timestamp + 31 days,
            30_000,
            0.01 ether,
            100
        );
    }
    
    function testCannotCreateEventWithInsufficientLiquidity() public {
        vm.prank(admin);
        vm.expectRevert("Insufficient liquidity");
        factory.createClimateEvent(
            -8_050_000,
            -34_881_000,
            block.timestamp + 1 hours + 1,
            block.timestamp + 31 days,
            30_000,
            0.01 ether,
            100
        );
    }
    
    function testBuyClimateTokens() public {
        vm.prank(lp);
        pool.deposit{value: 10 ether}();
        
        vm.prank(admin);
        uint256 eventId = factory.createClimateEvent(
            -8_050_000,
            -34_881_000,
            block.timestamp + 1 hours + 1,
            block.timestamp + 31 days,
            30_000,
            0.01 ether,
            100
        );
        
        uint256 premium = factory.getEventPremium(eventId);
        uint256 tokensToBuy = 10;
        
        vm.prank(buyer);
        factory.buyClimateTokens{value: premium * tokensToBuy}(eventId, tokensToBuy);
        
        assertEq(token.balanceOf(buyer, eventId), tokensToBuy);
        assertEq(factory.getAvailableTokens(eventId), 90);
    }
    
    function testCannotBuyZeroTokens() public {
        vm.prank(lp);
        pool.deposit{value: 10 ether}();
        
        vm.prank(admin);
        uint256 eventId = factory.createClimateEvent(
            -8_050_000,
            -34_881_000,
            block.timestamp + 1 hours + 1,
            block.timestamp + 31 days,
            30_000,
            0.01 ether,
            100
        );
        
        vm.prank(buyer);
        vm.expectRevert("Must buy at least one token");
        factory.buyClimateTokens{value: 1 ether}(eventId, 0);
    }
    
    function testCannotBuyMoreThanAvailable() public {
        vm.prank(lp);
        pool.deposit{value: 10 ether}();
        
        vm.prank(admin);
        uint256 eventId = factory.createClimateEvent(
            -8_050_000,
            -34_881_000,
            block.timestamp + 1 hours + 1,
            block.timestamp + 31 days,
            30_000,
            0.01 ether,
            100
        );
        
        uint256 premium = factory.getEventPremium(eventId);
        
        vm.prank(buyer);
        vm.expectRevert("Insufficient tokens available");
        factory.buyClimateTokens{value: premium * 150}(eventId, 150);
    }
    
    function testCannotBuyWithInsufficientPayment() public {
        vm.prank(lp);
        pool.deposit{value: 10 ether}();
        
        vm.prank(admin);
        uint256 eventId = factory.createClimateEvent(
            -8_050_000,
            -34_881_000,
            block.timestamp + 1 hours + 1,
            block.timestamp + 31 days,
            30_000,
            0.01 ether,
            100
        );
        
        vm.prank(buyer);
        vm.expectRevert("Insufficient payment");
        factory.buyClimateTokens{value: 0.001 ether}(eventId, 10);
    }
    
    function testCannotBuyAfterEventStarts() public {
        vm.prank(lp);
        pool.deposit{value: 10 ether}();
        
        vm.prank(admin);
        uint256 eventId = factory.createClimateEvent(
            -8_050_000,
            -34_881_000,
            block.timestamp + 1 hours + 1,
            block.timestamp + 31 days,
            30_000,
            0.01 ether,
            100
        );
        
        // Warp past start time
        vm.warp(block.timestamp + 2 hours);
        
        uint256 premium = factory.getEventPremium(eventId);
        
        vm.prank(buyer);
        vm.expectRevert("Event already started");
        factory.buyClimateTokens{value: premium * 10}(eventId, 10);
    }
    
    function testRefundExcessPayment() public {
        vm.prank(lp);
        pool.deposit{value: 10 ether}();
        
        vm.prank(admin);
        uint256 eventId = factory.createClimateEvent(
            -8_050_000,
            -34_881_000,
            block.timestamp + 1 hours + 1,
            block.timestamp + 31 days,
            30_000,
            0.01 ether,
            100
        );
        
        uint256 premium = factory.getEventPremium(eventId);
        uint256 excessPayment = 1 ether;
        uint256 buyerBalanceBefore = buyer.balance;
        
        vm.prank(buyer);
        factory.buyClimateTokens{value: (premium * 10) + excessPayment}(eventId, 10);
        
        // Should receive refund minus gas
        assertGt(buyer.balance, buyerBalanceBefore - (premium * 10) - 0.01 ether);
    }
    
    function testCalculatePremium() public {
        uint256 payoutPerToken = 0.01 ether;
        uint256 duration = 30 days;
        
        uint256 premium = factory.calculatePremium(payoutPerToken, duration);
        assertTrue(premium > 0);
        assertTrue(premium < payoutPerToken); // Premium should be less than payout
    }
    
    function testUpdatePremiumParameters() public {
        vm.prank(admin);
        factory.updatePremiumParameters(200, 100);
        
        assertEq(factory.basePremiumRate(), 200);
        assertEq(factory.riskMultiplier(), 100);
    }
    
    function testCannotSetPremiumRateTooHigh() public {
        vm.prank(admin);
        vm.expectRevert("Base premium rate too high");
        factory.updatePremiumParameters(600, 50);
    }
    
    function testCannotSetRiskMultiplierTooHigh() public {
        vm.prank(admin);
        vm.expectRevert("Risk multiplier too high");
        factory.updatePremiumParameters(100, 300);
    }
    
    function testOnERC1155Received() public {
        bytes4 response = factory.onERC1155Received(
            address(this),
            address(this),
            1,
            1,
            ""
        );
        
        assertEq(response, factory.onERC1155Received.selector);
    }
}