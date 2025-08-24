// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./ZeroLagToken.sol";

/**
 * @title Payments
 * @dev Handles escrow and micropayments for agent usage
 */
contract Payments is Ownable, ReentrancyGuard {
    ZeroLagToken public immutable zlagToken;
    
    struct Escrow {
        address user;
        uint256 amount;
        uint256 lockedAt;
        bool isActive;
    }
    
    mapping(address => Escrow) public userEscrows;
    mapping(address => uint256) public pendingWithdrawals;
    
    uint256 public constant ESCROW_LOCK_PERIOD = 7 days;
    uint256 public totalEscrowed;
    
    // Events
    event EscrowDeposited(address indexed user, uint256 amount);
    event EscrowWithdrawn(address indexed user, uint256 amount);
    event PaymentProcessed(address indexed from, address indexed to, uint256 amount);
    event WithdrawalQueued(address indexed user, uint256 amount);
    
    constructor(address _zlagToken, address initialOwner) Ownable(initialOwner) {
        zlagToken = ZeroLagToken(_zlagToken);
    }
    
    /**
     * @dev Deposit tokens into escrow for future payments
     */
    function depositEscrow(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(zlagToken.balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Transfer tokens to contract
        require(zlagToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Update or create escrow
        if (userEscrows[msg.sender].isActive) {
            userEscrows[msg.sender].amount += amount;
        } else {
            userEscrows[msg.sender] = Escrow({
                user: msg.sender,
                amount: amount,
                lockedAt: block.timestamp,
                isActive: true
            });
        }
        
        totalEscrowed += amount;
        
        emit EscrowDeposited(msg.sender, amount);
    }
    
    /**
     * @dev Withdraw from escrow (after lock period)
     */
    function withdrawEscrow(uint256 amount) external nonReentrant {
        Escrow storage escrow = userEscrows[msg.sender];
        require(escrow.isActive, "No active escrow");
        require(escrow.amount >= amount, "Insufficient escrow balance");
        require(block.timestamp >= escrow.lockedAt + ESCROW_LOCK_PERIOD, "Escrow still locked");
        
        escrow.amount -= amount;
        if (escrow.amount == 0) {
            escrow.isActive = false;
        }
        
        totalEscrowed -= amount;
        
        // Transfer tokens back to user
        require(zlagToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit EscrowWithdrawn(msg.sender, amount);
    }
    
    /**
     * @dev Process payment from escrow
     */
    function processPayment(
        address from,
        address to,
        uint256 amount
    ) external onlyOwner nonReentrant {
        Escrow storage escrow = userEscrows[from];
        require(escrow.isActive, "No active escrow");
        require(escrow.amount >= amount, "Insufficient escrow balance");
        
        escrow.amount -= amount;
        if (escrow.amount == 0) {
            escrow.isActive = false;
        }
        
        totalEscrowed -= amount;
        
        // Queue withdrawal for recipient
        pendingWithdrawals[to] += amount;
        
        emit PaymentProcessed(from, to, amount);
    }
    
    /**
     * @dev Withdraw pending payments
     */
    function withdrawPending() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No pending withdrawals");
        
        pendingWithdrawals[msg.sender] = 0;
        
        require(zlagToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit WithdrawalQueued(msg.sender, amount);
    }
    
    /**
     * @dev Get user escrow info
     */
    function getUserEscrow(address user) external view returns (Escrow memory) {
        return userEscrows[user];
    }
    
    /**
     * @dev Get pending withdrawal amount
     */
    function getPendingWithdrawal(address user) external view returns (uint256) {
        return pendingWithdrawals[user];
    }
    
    /**
     * @dev Check if user can withdraw escrow
     */
    function canWithdrawEscrow(address user) external view returns (bool) {
        Escrow memory escrow = userEscrows[user];
        return escrow.isActive && block.timestamp >= escrow.lockedAt + ESCROW_LOCK_PERIOD;
    }
    
    /**
     * @dev Emergency withdrawal (only owner)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(ZeroLagToken(token).transfer(owner(), amount), "Emergency withdrawal failed");
    }
}
