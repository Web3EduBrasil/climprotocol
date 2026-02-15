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
        // Allow factory to add events to settlement engine
        settlement.grantRole(settlement.AUTOMATION_ROLE(), address(factory));
        
        vm.stopPrank();
        
        vm.deal(lp, 100 ether);
        vm.deal(buyer, 10 ether);
    }
    
    function testCreateClimateEvent() public {
        // Provide liquidity first
        vm.prank(lp);
        pool.deposit{value: 100 ether}();
        
        vm.prank(admin);
        uint256 eventId = factory.createClimateEvent(
            -8_285_000, // Sertão de Pernambuco latitude
            -37_975_000, // Sertão de Pernambuco longitude
            block.timestamp + 1 hours + 1,
            block.timestamp + 90 days,  // 90 dias
            150_000, // 150mm threshold (seca)
            0.05 ether, // payout per token
            1000 // tokens to create
        );
        
        assertTrue(eventId > 0);
        assertEq(factory.getAvailableTokens(eventId), 1000);
    }
    
    function testCannotCreateEventWithPastStartTime() public {
        vm.prank(lp);
        pool.deposit{value: 100 ether}();
        
        vm.prank(admin);
        vm.expectRevert("Start time must be at least 1 hour in future");
        factory.createClimateEvent(
            -8_285_000,
            -37_975_000,
            block.timestamp,
            block.timestamp + 90 days,
            150_000,
            0.05 ether,
            1000
        );
    }
    
    function testCannotCreateEventWithInvalidDuration() public {
        vm.prank(lp);
        pool.deposit{value: 100 ether}();
        
        vm.prank(admin);
        vm.expectRevert("Event duration too short");
        factory.createClimateEvent(
            -8_285_000,
            -37_975_000,
            block.timestamp + 1 hours + 1,
            block.timestamp + 2 hours,
            150_000,
            0.05 ether,
            1000
        );
    }
    
    function testCannotCreateEventWithLowPayout() public {
        vm.prank(lp);
        pool.deposit{value: 100 ether}();
        
        vm.prank(admin);
        vm.expectRevert("Payout per token too low");
        factory.createClimateEvent(
            -8_285_000,
            -37_975_000,
            block.timestamp + 1 hours + 1,
            block.timestamp + 90 days,
            150_000,
            0.0001 ether,
            1000
        );
    }
    
    function testCannotCreateEventWithInvalidLatitude() public {
        vm.prank(lp);
        pool.deposit{value: 100 ether}();
        
        vm.prank(admin);
        vm.expectRevert("Invalid latitude");
        factory.createClimateEvent(
            100_000_000, // Invalid
            -37_975_000,
            block.timestamp + 1 hours + 1,
            block.timestamp + 90 days,
            150_000,
            0.05 ether,
            1000
        );
    }
    
    function testCannotCreateEventWithInvalidLongitude() public {
        vm.prank(lp);
        pool.deposit{value: 100 ether}();
        
        vm.prank(admin);
        vm.expectRevert("Invalid longitude");
        factory.createClimateEvent(
            -8_285_000,
            200_000_000, // Invalid
            block.timestamp + 1 hours + 1,
            block.timestamp + 90 days,
            150_000,
            0.05 ether,
            1000
        );
    }
    
    function testCannotCreateEventWithInsufficientLiquidity() public {
        vm.prank(admin);
        vm.expectRevert("Insufficient liquidity");
        factory.createClimateEvent(
            -8_285_000,
            -37_975_000,
            block.timestamp + 1 hours + 1,
            block.timestamp + 90 days,
            150_000,
            0.05 ether,
            1000
        );
    }
    
    function testBuyClimateTokens() public {
        vm.prank(lp);
        pool.deposit{value: 100 ether}();
        
        vm.prank(admin);
        uint256 eventId = factory.createClimateEvent(
            -8_285_000,
            -37_975_000,
            block.timestamp + 1 hours + 1,
            block.timestamp + 90 days,
            150_000,
            0.05 ether,
            1000
        );
        
        uint256 premium = factory.getEventPremium(eventId);
        uint256 tokensToBuy = 10;
        
        vm.prank(buyer);
        factory.buyClimateTokens{value: premium * tokensToBuy}(eventId, tokensToBuy);
        
        assertEq(token.balanceOf(buyer, eventId), tokensToBuy);
        assertEq(factory.getAvailableTokens(eventId), 990);
    }
    
    function testCannotBuyZeroTokens() public {
        vm.prank(lp);
        pool.deposit{value: 100 ether}();
        
        vm.prank(admin);
        uint256 eventId = factory.createClimateEvent(
            -8_285_000,
            -37_975_000,
            block.timestamp + 1 hours + 1,
            block.timestamp + 90 days,
            150_000,
            0.05 ether,
            1000
        );
        
        vm.prank(buyer);
        vm.expectRevert("Must buy at least one token");
        factory.buyClimateTokens{value: 1 ether}(eventId, 0);
    }
    
    function testCannotBuyMoreThanAvailable() public {
        vm.prank(lp);
        pool.deposit{value: 100 ether}();
        
        vm.prank(admin);
        uint256 eventId = factory.createClimateEvent(
            -8_285_000,
            -37_975_000,
            block.timestamp + 1 hours + 1,
            block.timestamp + 90 days,
            150_000,
            0.05 ether,
            1000
        );
        
        uint256 premium = factory.getEventPremium(eventId);
        
        // Ensure buyer has enough ETH to send the large payment, otherwise the call
        // will fail at the EVM level with OutOfFunds before the contract can revert.
        vm.deal(buyer, premium * 1500);
        vm.prank(buyer);
        vm.expectRevert("Insufficient tokens available");
        factory.buyClimateTokens{value: premium * 1500}(eventId, 1500);
    }
    
    function testCannotBuyWithInsufficientPayment() public {
        vm.prank(lp);
        pool.deposit{value: 100 ether}();
        
        vm.prank(admin);
        uint256 eventId = factory.createClimateEvent(
            -8_285_000,
            -37_975_000,
            block.timestamp + 1 hours + 1,
            block.timestamp + 90 days,
            150_000,
            0.05 ether,
            1000
        );
        
        vm.prank(buyer);
        vm.expectRevert("Insufficient payment");
        factory.buyClimateTokens{value: 0.001 ether}(eventId, 10);
    }
    
    function testCannotBuyAfterEventStarts() public {
        vm.prank(lp);
        pool.deposit{value: 100 ether}();
        
        vm.prank(admin);
        uint256 eventId = factory.createClimateEvent(
            -8_285_000,
            -37_975_000,
            block.timestamp + 1 hours + 1,
            block.timestamp + 90 days,
            150_000,
            0.05 ether,
            1000
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
        pool.deposit{value: 100 ether}();
        
        vm.prank(admin);
        uint256 eventId = factory.createClimateEvent(
            -8_285_000,
            -37_975_000,
            block.timestamp + 1 hours + 1,
            block.timestamp + 90 days,
            150_000,
            0.05 ether,
            1000
        );
        
        uint256 premium = factory.getEventPremium(eventId);
        uint256 excessPayment = 1 ether;
        uint256 buyerBalanceBefore = buyer.balance;
        
        vm.prank(buyer);
        factory.buyClimateTokens{value: (premium * 10) + excessPayment}(eventId, 10);
        
        // Should receive refund minus gas
        assertGt(buyer.balance, buyerBalanceBefore - (premium * 10) - 0.01 ether);
    }
    
    function testCalculatePremium() public view {
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
    
    function testOnERC1155Received() public view {
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