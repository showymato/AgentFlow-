// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title ZeroLagToken ($ZLAG)
 * @dev The utility token for the AgentFlow ecosystem
 * Features:
 * - Fixed supply with deflationary burns
 * - Governance capabilities
 * - Staking rewards
 * - Compute payment utility
 */
contract ZeroLagToken is ERC20, ERC20Burnable, Ownable, Pausable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10**18; // 100 million initial
    
    // Staking and rewards
    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public stakingTimestamp;
    mapping(address => uint256) public pendingRewards;
    
    uint256 public stakingRewardRate = 100; // 1% per year (100 basis points)
    uint256 public constant SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
    
    // Events
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event TokensBurned(uint256 amount);

    constructor(address initialOwner) ERC20("ZeroLag", "ZLAG") Ownable(initialOwner) {
        _mint(initialOwner, INITIAL_SUPPLY);
    }

    /**
     * @dev Mint new tokens (only owner, up to max supply)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }

    /**
     * @dev Stake tokens to earn rewards
     */
    function stake(uint256 amount) external whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        // Calculate and update pending rewards before staking more
        _updateRewards(msg.sender);

        // Transfer tokens to contract
        _transfer(msg.sender, address(this), amount);
        
        stakedBalance[msg.sender] += amount;
        stakingTimestamp[msg.sender] = block.timestamp;

        emit Staked(msg.sender, amount);
    }

    /**
     * @dev Unstake tokens and claim rewards
     */
    function unstake(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(stakedBalance[msg.sender] >= amount, "Insufficient staked balance");

        // Calculate and update rewards
        _updateRewards(msg.sender);

        stakedBalance[msg.sender] -= amount;
        
        // Transfer tokens back to user
        _transfer(address(this), msg.sender, amount);

        emit Unstaked(msg.sender, amount);
    }

    /**
     * @dev Claim staking rewards
     */
    function claimRewards() external {
        _updateRewards(msg.sender);
        
        uint256 rewards = pendingRewards[msg.sender];
        require(rewards > 0, "No rewards to claim");

        pendingRewards[msg.sender] = 0;
        
        // Mint rewards (if within max supply)
        if (totalSupply() + rewards <= MAX_SUPPLY) {
            _mint(msg.sender, rewards);
        }

        emit RewardsClaimed(msg.sender, rewards);
    }

    /**
     * @dev Calculate current rewards for a user
     */
    function calculateRewards(address user) external view returns (uint256) {
        if (stakedBalance[user] == 0) return pendingRewards[user];

        uint256 stakingDuration = block.timestamp - stakingTimestamp[user];
        uint256 newRewards = (stakedBalance[user] * stakingRewardRate * stakingDuration) / 
                            (10000 * SECONDS_PER_YEAR);
        
        return pendingRewards[user] + newRewards;
    }

    /**
     * @dev Update rewards for a user
     */
    function _updateRewards(address user) internal {
        if (stakedBalance[user] > 0) {
            uint256 stakingDuration = block.timestamp - stakingTimestamp[user];
            uint256 newRewards = (stakedBalance[user] * stakingRewardRate * stakingDuration) / 
                                (10000 * SECONDS_PER_YEAR);
            
            pendingRewards[user] += newRewards;
            stakingTimestamp[user] = block.timestamp;
        }
    }

    /**
     * @dev Burn tokens from circulation (deflationary mechanism)
     */
    function burnFromCirculation(uint256 amount) external onlyOwner {
        require(balanceOf(address(this)) >= amount, "Insufficient contract balance");
        _burn(address(this), amount);
        emit TokensBurned(amount);
    }

    /**
     * @dev Set staking reward rate (only owner)
     */
    function setStakingRewardRate(uint256 newRate) external onlyOwner {
        require(newRate <= 1000, "Rate too high"); // Max 10%
        stakingRewardRate = newRate;
    }

    /**
     * @dev Pause contract (emergency)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Override transfer to respect pause
     */
    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        super._update(from, to, value);
    }
}
