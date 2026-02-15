// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import "../src/core/ClimateEventToken.sol";
import "../src/interfaces/IClimProtocol.sol";

contract ClimateEventTokenTest is Test {
    ClimateEventToken public token;
    
    address public admin = address(0x1);
    address public minter = address(0x2);
    address public settler = address(0x3);
    address public user1 = address(0x4);
    address public user2 = address(0x5);
    
    uint256 public constant EVENT_ID = 1;
    
    function setUp() public {
        vm.startPrank(admin);
        token = new ClimateEventToken();
        
        token.grantRole(token.MINTER_ROLE(), minter);
        token.grantRole(token.SETTLER_ROLE(), settler);
        vm.stopPrank();
        
        // Fund addresses
        vm.deal(admin, 100 ether);
        vm.deal(address(token), 100 ether);
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }
    
    function testInitialRoles() public view {
        assertTrue(token.hasRole(token.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(token.hasRole(token.MINTER_ROLE(), minter));
        assertTrue(token.hasRole(token.SETTLER_ROLE(), settler));
    }
    
    function testCreateEvent() public {
        IClimateEvent.ClimateEventData memory eventData = IClimateEvent.ClimateEventData({
            latitude: -8_050_000,
            longitude: -34_881_000,
            startTime: block.timestamp + 1 days,
            endTime: block.timestamp + 31 days,
            thresholdMm: 30_000,
            payoutPerToken: 0.01 ether,
            totalSupply: 100,
            actualMm: 0,
            status: IClimateEvent.EventStatus.ACTIVE
        });
        
        vm.prank(minter);
        token.createEvent(EVENT_ID, eventData, user1, 100);
        
        IClimateEvent.ClimateEventData memory storedEvent = token.getEventData(EVENT_ID);
        assertEq(storedEvent.latitude, eventData.latitude);
        assertEq(storedEvent.totalSupply, 100);
        assertEq(token.balanceOf(user1, EVENT_ID), 100);
    }
    
    function testCannotCreateDuplicateEvent() public {
        IClimateEvent.ClimateEventData memory eventData = IClimateEvent.ClimateEventData({
            latitude: -8_050_000,
            longitude: -34_881_000,
            startTime: block.timestamp + 1 days,
            endTime: block.timestamp + 31 days,
            thresholdMm: 30_000,
            payoutPerToken: 0.01 ether,
            totalSupply: 100,
            actualMm: 0,
            status: IClimateEvent.EventStatus.ACTIVE
        });
        
        vm.startPrank(minter);
        token.createEvent(EVENT_ID, eventData, user1, 100);
        
        vm.expectRevert("Event already exists");
        token.createEvent(EVENT_ID, eventData, user1, 100);
        vm.stopPrank();
    }
    
    function testCannotCreateEventWithPastStartTime() public {
        IClimateEvent.ClimateEventData memory eventData = IClimateEvent.ClimateEventData({
            latitude: -8_050_000,
            longitude: -34_881_000,
            startTime: 0,
            endTime: block.timestamp + 31 days,
            thresholdMm: 30_000,
            payoutPerToken: 0.01 ether,
            totalSupply: 100,
            actualMm: 0,
            status: IClimateEvent.EventStatus.ACTIVE
        });
        
        vm.prank(minter);
        vm.expectRevert("Start time must be in future");
        token.createEvent(EVENT_ID, eventData, user1, 100);
    }
    
    function testCannotCreateEventWithInvalidTimeRange() public {
        IClimateEvent.ClimateEventData memory eventData = IClimateEvent.ClimateEventData({
            latitude: -8_050_000,
            longitude: -34_881_000,
            startTime: block.timestamp + 31 days,
            endTime: block.timestamp + 1 days,
            thresholdMm: 30_000,
            payoutPerToken: 0.01 ether,
            totalSupply: 100,
            actualMm: 0,
            status: IClimateEvent.EventStatus.ACTIVE
        });
        
        vm.prank(minter);
        vm.expectRevert("End time must be after start time");
        token.createEvent(EVENT_ID, eventData, user1, 100);
    }
    
    function testCannotCreateEventWithZeroPayout() public {
        IClimateEvent.ClimateEventData memory eventData = IClimateEvent.ClimateEventData({
            latitude: -8_050_000,
            longitude: -34_881_000,
            startTime: block.timestamp + 1 days,
            endTime: block.timestamp + 31 days,
            thresholdMm: 30_000,
            payoutPerToken: 0,
            totalSupply: 100,
            actualMm: 0,
            status: IClimateEvent.EventStatus.ACTIVE
        });
        
        vm.prank(minter);
        vm.expectRevert("Payout must be greater than 0");
        token.createEvent(EVENT_ID, eventData, user1, 100);
    }
    
    function testSettleEvent() public {
        _createTestEvent();
        
        // Warp past event end time
        vm.warp(block.timestamp + 32 days);
        
        vm.prank(settler);
        token.settleEvent(EVENT_ID, 25_000); // Below threshold
        
        IClimateEvent.ClimateEventData memory eventData = token.getEventData(EVENT_ID);
        assertEq(eventData.actualMm, 25_000);
        assertTrue(eventData.status == IClimateEvent.EventStatus.SETTLED);
    }
    
    function testCannotSettleBeforeEventEnds() public {
        _createTestEvent();
        
        vm.prank(settler);
        vm.expectRevert("Event period not ended");
        token.settleEvent(EVENT_ID, 25_000);
    }
    
    function testCannotSettleNonActiveEvent() public {
        _createTestEvent();
        
        vm.warp(block.timestamp + 32 days);
        
        vm.startPrank(settler);
        token.settleEvent(EVENT_ID, 25_000);
        
        vm.expectRevert("Event not active");
        token.settleEvent(EVENT_ID, 30_000);
        vm.stopPrank();
    }
    
    function testRedeemTokensWithPayout() public {
        _createTestEvent();
        
        // Transfer some tokens to user2
        vm.prank(user1);
        token.safeTransferFrom(user1, user2, EVENT_ID, 50, "");
        
        // Settle event with precipitation below threshold
        vm.warp(block.timestamp + 32 days);
        vm.prank(settler);
        token.settleEvent(EVENT_ID, 20_000); // Below 30_000 threshold
        
        uint256 user2BalanceBefore = user2.balance;
        uint256 expectedPayout = 50 * 0.01 ether;
        
        vm.prank(user2);
        token.redeemTokens(EVENT_ID);
        
        assertEq(user2.balance, user2BalanceBefore + expectedPayout);
        assertEq(token.balanceOf(user2, EVENT_ID), 0);
        assertTrue(token.hasRedeemed(EVENT_ID, user2));
    }
    
    function testRedeemTokensWithoutPayout() public {
        _createTestEvent();
        
        vm.prank(user1);
        token.safeTransferFrom(user1, user2, EVENT_ID, 50, "");
        
        // Settle event with precipitation above threshold
        vm.warp(block.timestamp + 32 days);
        vm.prank(settler);
        token.settleEvent(EVENT_ID, 35_000); // Above 30_000 threshold
        
        uint256 user2BalanceBefore = user2.balance;
        
        vm.prank(user2);
        token.redeemTokens(EVENT_ID);
        
        assertEq(user2.balance, user2BalanceBefore); // No payout
        assertEq(token.balanceOf(user2, EVENT_ID), 0);
    }
    
    function testCannotRedeemWithoutTokens() public {
        _createTestEvent();
        
        vm.warp(block.timestamp + 32 days);
        vm.prank(settler);
        token.settleEvent(EVENT_ID, 25_000);
        
        vm.prank(user2);
        vm.expectRevert("No tokens to redeem");
        token.redeemTokens(EVENT_ID);
    }
    
    function testCannotRedeemUnsettledEvent() public {
        _createTestEvent();
        
        vm.prank(user1);
        vm.expectRevert("Event not settled");
        token.redeemTokens(EVENT_ID);
    }
    
    function testCannotRedeemTwice() public {
        _createTestEvent();
        
        vm.warp(block.timestamp + 32 days);
        vm.prank(settler);
        token.settleEvent(EVENT_ID, 25_000);
        
        vm.startPrank(user1);
        token.redeemTokens(EVENT_ID);
        
        vm.expectRevert("Already redeemed");
        token.redeemTokens(EVENT_ID);
        vm.stopPrank();
    }
    
    function testIsEventTriggered() public {
        _createTestEvent();
        
        vm.warp(block.timestamp + 32 days);
        vm.prank(settler);
        token.settleEvent(EVENT_ID, 25_000);
        
        assertTrue(token.isEventTriggered(EVENT_ID));
    }
    
    function testIsEventNotTriggered() public {
        _createTestEvent();
        
        vm.warp(block.timestamp + 32 days);
        vm.prank(settler);
        token.settleEvent(EVENT_ID, 35_000);
        
        assertFalse(token.isEventTriggered(EVENT_ID));
    }
    
    function testSupportsInterface() public view {
        // ERC1155
        assertTrue(token.supportsInterface(0xd9b67a26));
        // AccessControl
        assertTrue(token.supportsInterface(0x7965db0b));
    }
    
    function testUnauthorizedCannotMint() public {
        IClimateEvent.ClimateEventData memory eventData = IClimateEvent.ClimateEventData({
            latitude: -8_050_000,
            longitude: -34_881_000,
            startTime: block.timestamp + 1 days,
            endTime: block.timestamp + 31 days,
            thresholdMm: 30_000,
            payoutPerToken: 0.01 ether,
            totalSupply: 100,
            actualMm: 0,
            status: IClimateEvent.EventStatus.ACTIVE
        });
        
        vm.prank(user1);
        vm.expectRevert();
        token.createEvent(EVENT_ID, eventData, user1, 100);
    }
    
    function testUnauthorizedCannotSettle() public {
        _createTestEvent();
        
        vm.warp(block.timestamp + 32 days);
        vm.prank(user1);
        vm.expectRevert();
        token.settleEvent(EVENT_ID, 25_000);
    }
    
    // Helper function
    function _createTestEvent() internal {
        IClimateEvent.ClimateEventData memory eventData = IClimateEvent.ClimateEventData({
            latitude: -8_050_000,
            longitude: -34_881_000,
            startTime: block.timestamp + 1 days,
            endTime: block.timestamp + 31 days,
            thresholdMm: 30_000,
            payoutPerToken: 0.01 ether,
            totalSupply: 100,
            actualMm: 0,
            status: IClimateEvent.EventStatus.ACTIVE
        });
        
        vm.prank(minter);
        token.createEvent(EVENT_ID, eventData, user1, 100);
    }
}