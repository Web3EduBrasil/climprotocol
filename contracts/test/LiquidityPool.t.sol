// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import "../src/core/LiquidityPool.sol";

contract LiquidityPoolTest is Test {
    LiquidityPool public pool;
    
    address public admin = address(0x1);
    address public manager = address(0x2);
    address public lp1 = address(0x3);
    address public lp2 = address(0x4);
    
    function setUp() public {
        vm.startPrank(admin);
        pool = new LiquidityPool();
        pool.grantRole(pool.POOL_MANAGER_ROLE(), manager);
        vm.stopPrank();
        
        vm.deal(lp1, 100 ether);
        vm.deal(lp2, 100 ether);
    }
    
    function testDeposit() public {
        vm.prank(lp1);
        pool.deposit{value: 10 ether}();
        
        assertEq(pool.getLPBalance(lp1), 10 ether);
        assertEq(pool.totalLiquidity(), 10 ether);
    }
    
    function testCannotDepositZero() public {
        vm.prank(lp1);
        vm.expectRevert("Must deposit positive amount");
        pool.deposit{value: 0}();
    }
    
    function testMultipleDeposits() public {
        vm.prank(lp1);
        pool.deposit{value: 10 ether}();
        
        vm.prank(lp2);
        pool.deposit{value: 5 ether}();
        
        assertEq(pool.getLPBalance(lp1), 10 ether);
        assertEq(pool.getLPBalance(lp2), 5 ether);
        assertEq(pool.totalLiquidity(), 15 ether);
    }
    
    function testWithdraw() public {
        vm.startPrank(lp1);
        pool.deposit{value: 10 ether}();
        
        uint256 balanceBefore = lp1.balance;
        pool.withdraw(5 ether);
        
        assertEq(pool.getLPBalance(lp1), 5 ether);
        assertEq(lp1.balance, balanceBefore + 5 ether);
        assertEq(pool.totalLiquidity(), 5 ether);
        vm.stopPrank();
    }
    
    function testCannotWithdrawMoreThanBalance() public {
        vm.startPrank(lp1);
        pool.deposit{value: 10 ether}();
        
        vm.expectRevert("Insufficient balance");
        pool.withdraw(15 ether);
        vm.stopPrank();
    }
    
    function testCannotWithdrawMoreThanAvailable() public {
        vm.startPrank(lp1);
        pool.deposit{value: 10 ether}();
        vm.stopPrank();
        
        // Lock some collateral
        vm.prank(manager);
        pool.lockCollateral(1, 8 ether);
        
        vm.prank(lp1);
        vm.expectRevert("Insufficient available liquidity");
        pool.withdraw(5 ether);
    }
    
    function testLockCollateral() public {
        vm.prank(lp1);
        pool.deposit{value: 10 ether}();
        
        vm.prank(manager);
        pool.lockCollateral(1, 5 ether);
        
        assertEq(pool.lockedCollateral(1), 5 ether);
    }
    
    function testCannotLockMoreThanAvailable() public {
        vm.prank(lp1);
        pool.deposit{value: 10 ether}();
        
        vm.prank(manager);
        vm.expectRevert("Insufficient liquidity");
        pool.lockCollateral(1, 15 ether);
    }
    
    function testReleaseCollateral() public {
        vm.prank(lp1);
        pool.deposit{value: 10 ether}();
        
        vm.startPrank(manager);
        pool.lockCollateral(1, 5 ether);
        pool.releaseCollateral(1, 0);
        vm.stopPrank();
        
        assertEq(pool.lockedCollateral(1), 0);
        assertEq(pool.totalLiquidity(), 10 ether);
    }
    
    function testReleaseCollateralWithPayout() public {
        vm.prank(lp1);
        pool.deposit{value: 10 ether}();
        
        vm.startPrank(manager);
        pool.lockCollateral(1, 5 ether);
        pool.releaseCollateral(1, 3 ether);
        vm.stopPrank();
        
        assertEq(pool.lockedCollateral(1), 0);
        assertEq(pool.totalLiquidity(), 7 ether);
    }
    
    function testCannotReleaseWithoutLock() public {
        vm.prank(manager);
        vm.expectRevert("No collateral locked for this event");
        pool.releaseCollateral(1, 0);
    }
    
    function testCannotReleaseMoreThanLocked() public {
        vm.prank(lp1);
        pool.deposit{value: 10 ether}();
        
        vm.startPrank(manager);
        pool.lockCollateral(1, 5 ether);
        
        vm.expectRevert("Payout exceeds locked collateral");
        pool.releaseCollateral(1, 6 ether);
        vm.stopPrank();
    }
    
    function testCalculateRequiredCollateral() public view {
        uint256 payoutAmount = 10 ether;
        uint256 required = pool.calculateRequiredCollateral(payoutAmount);
        
        // Default ratio is 150% (1500/1000)
        assertEq(required, 15 ether);
    }
    
    function testSetOvercollateralizationRatio() public {
        vm.prank(admin);
        pool.setOvercollateralizationRatio(2000); // 200%
        
        assertEq(pool.overcollateralizationRatio(), 2000);
        
        uint256 required = pool.calculateRequiredCollateral(10 ether);
        assertEq(required, 20 ether);
    }
    
    function testCannotSetRatioTooLow() public {
        vm.prank(admin);
        vm.expectRevert("Ratio must be at least 100%");
        pool.setOvercollateralizationRatio(900);
    }
    
    function testCannotSetRatioTooHigh() public {
        vm.prank(admin);
        vm.expectRevert("Ratio cannot exceed 300%");
        pool.setOvercollateralizationRatio(3500);
    }
    
    function testTransferPayout() public {
        vm.prank(lp1);
        pool.deposit{value: 10 ether}();
        
        address recipient = address(0x999);
        uint256 recipientBalanceBefore = recipient.balance;
        
        vm.prank(manager);
        pool.transferPayout(recipient, 3 ether);
        
        assertEq(recipient.balance, recipientBalanceBefore + 3 ether);
    }
    
    function testCannotTransferPayoutWithoutLiquidity() public {
        vm.prank(manager);
        vm.expectRevert("Insufficient total liquidity");
        pool.transferPayout(address(0x999), 1 ether);
    }
    
    function testReceiveFunction() public {
        vm.deal(address(0x999), 10 ether);
        
        vm.prank(address(0x999));
        (bool success, ) = address(pool).call{value: 5 ether}("");
        
        assertTrue(success);
        assertEq(pool.getLPBalance(address(0x999)), 5 ether);
    }
    
    function testUnauthorizedCannotManagePool() public {
        vm.prank(lp1);
        pool.deposit{value: 10 ether}();
        
        vm.prank(lp2);
        vm.expectRevert();
        pool.lockCollateral(1, 5 ether);
    }
    
    function testAvailableLiquidity() public {
        vm.prank(lp1);
        pool.deposit{value: 10 ether}();
        
        assertEq(pool.availableLiquidity(), 10 ether);
    }
    
    function testEmergencyWithdraw() public {
        vm.prank(lp1);
        pool.deposit{value: 10 ether}();
        
        uint256 adminBalanceBefore = admin.balance;
        
        vm.startPrank(admin);
        // emergencyWithdraw should transfer contract balance to admin
        pool.emergencyWithdraw();
        vm.stopPrank();
        
        assertGt(admin.balance, adminBalanceBefore);
    }
}