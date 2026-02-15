// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IClimProtocol.sol";

/**
 * @title LiquidityPool
 * @dev Manages liquidity for climate events payouts
 */
contract LiquidityPool is ILiquidityPool, AccessControl, ReentrancyGuard {
    bytes32 public constant POOL_MANAGER_ROLE = keccak256("POOL_MANAGER_ROLE");
    
    // Liquidity provider balances
    mapping(address => uint256) public lpBalances;
    
    // Locked collateral per event
    mapping(uint256 => uint256) public lockedCollateral;
    
    // Total liquidity provided
    uint256 public totalLiquidity;
    
    // Total locked collateral across all events
    uint256 public totalLockedCollateral;
    
    // Overcollateralization ratio (150% = 1500)
    uint256 public overcollateralizationRatio = 1500; // 150%
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(POOL_MANAGER_ROLE, msg.sender);
    }
    
    /**
     * @dev Allows users to provide liquidity to the pool
     */
    function deposit() external payable override {
        require(msg.value > 0, "Must deposit positive amount");
        
        lpBalances[msg.sender] += msg.value;
        totalLiquidity += msg.value;
        
        emit LiquidityProvided(msg.sender, msg.value);
    }
    
    /**
     * @dev Allows liquidity providers to withdraw their funds
     * @param amount Amount to withdraw in wei
     */
    function withdraw(uint256 amount) external override nonReentrant {
        require(lpBalances[msg.sender] >= amount, "Insufficient balance");
        require(availableLiquidity() >= amount, "Insufficient available liquidity");
        
        lpBalances[msg.sender] -= amount;
        totalLiquidity -= amount;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdrawal failed");
        
        emit LiquidityWithdrawn(msg.sender, amount);
    }
    
    /**
     * @dev Locks collateral for a specific climate event
     * @param eventId The event ID
     * @param amount Amount to lock (should include overcollateralization)
     */
    function lockCollateral(uint256 eventId, uint256 amount) 
        external 
        override 
        onlyRole(POOL_MANAGER_ROLE) 
    {
        require(availableLiquidity() >= amount, "Insufficient liquidity");
        require(lockedCollateral[eventId] == 0, "Collateral already locked for event");
        
        lockedCollateral[eventId] = amount;
        totalLockedCollateral += amount;
        
        emit CollateralLocked(eventId, amount);
    }
    
    /**
     * @dev Releases collateral after event settlement
     * @param eventId The event ID
     * @param payoutAmount Amount to pay out (0 if event not triggered)
     */
    function releaseCollateral(uint256 eventId, uint256 payoutAmount) 
        external 
        override 
        onlyRole(POOL_MANAGER_ROLE) 
        nonReentrant
    {
        uint256 locked = lockedCollateral[eventId];
        require(locked > 0, "No collateral locked for this event");
        require(payoutAmount <= locked, "Payout exceeds locked collateral");
        
        // Update totals
        totalLockedCollateral -= locked;
        lockedCollateral[eventId] = 0;
        
        if (payoutAmount > 0) {
            // Reduce total liquidity by payout amount
            totalLiquidity -= payoutAmount;
        }
        
        emit CollateralReleased(eventId, payoutAmount);
    }
    
    /**
     * @dev Transfers payout to event settlement contract
     * @param recipient Address to receive the payout
     * @param amount Amount to transfer
     */
    function transferPayout(address recipient, uint256 amount) 
        external 
        onlyRole(POOL_MANAGER_ROLE) 
        nonReentrant 
    {
        require(totalLiquidity >= amount, "Insufficient total liquidity");
        (bool success, ) = payable(recipient).call{value: amount}("");
        require(success, "Payout transfer failed");
    }
    
    /**
     * @dev Returns available liquidity (total - locked)
     */
    function availableLiquidity() public view override returns (uint256) {
        return totalLiquidity > totalLockedCollateral 
            ? totalLiquidity - totalLockedCollateral 
            : 0;
    }
    
    /**
     * @dev Calculates required collateral including overcollateralization
     * @param payoutAmount The maximum payout amount
     */
    function calculateRequiredCollateral(uint256 payoutAmount) 
        external 
        view 
        returns (uint256) 
    {
        return (payoutAmount * overcollateralizationRatio) / 1000;
    }
    
    /**
     * @dev Updates overcollateralization ratio (only admin)
     * @param newRatio New ratio (1500 = 150%)
     */
    function setOvercollateralizationRatio(uint256 newRatio) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(newRatio >= 1000, "Ratio must be at least 100%");
        require(newRatio <= 3000, "Ratio cannot exceed 300%");
        
        overcollateralizationRatio = newRatio;
    }
    
    /**
     * @dev Emergency function to recover stuck funds (only admin)
     */
    function emergencyWithdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        (bool success, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(success, "Emergency withdraw failed");
    }
    
    /**
     * @dev Returns the LP balance for a given address
     */
    function getLPBalance(address provider) external view returns (uint256) {
        return lpBalances[provider];
    }
    
    receive() external payable {
        // Allow direct ETH deposits: credit the original sender
        require(msg.value > 0, "Must deposit positive amount");

        lpBalances[msg.sender] += msg.value;
        totalLiquidity += msg.value;

        emit LiquidityProvided(msg.sender, msg.value);
    }
}