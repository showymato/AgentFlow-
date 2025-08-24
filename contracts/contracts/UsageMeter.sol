// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./AgentRegistry.sol";
import "./ZeroLagToken.sol";

/**
 * @title UsageMeter
 * @dev Tracks agent usage and handles billing
 */
contract UsageMeter is Ownable, ReentrancyGuard {
    ZeroLagToken public immutable zlagToken;
    AgentRegistry public immutable agentRegistry;
    
    struct UsageRecord {
        uint256 agentId;
        address user;
        address nodeOperator;
        uint256 timestamp;
        uint256 computeUnits;
        uint256 cost;
        bytes32 runHash;
        bool settled;
    }
    
    struct NodeOperator {
        address operator;
        uint256 totalCompute;
        uint256 totalEarnings;
        uint256 reputation; // 0-1000 scale
        bool isActive;
        uint256 registeredAt;
    }
    
    mapping(bytes32 => UsageRecord) public usageRecords;
    mapping(address => NodeOperator) public nodeOperators;
    mapping(uint256 => uint256) public agentTotalUsage;
    mapping(address => uint256) public userTotalSpent;
    
    address[] public activeOperators;
    
    // Pricing
    uint256 public baseComputePrice = 1e15; // 0.001 ZLAG per compute unit
    uint256 public creatorFeePercent = 70; // 70% to creator
    uint256 public operatorFeePercent = 25; // 25% to node operator
    uint256 public protocolFeePercent = 5; // 5% to protocol
    
    // Events
    event UsageRecorded(
        bytes32 indexed runHash,
        uint256 indexed agentId,
        address indexed user,
        address nodeOperator,
        uint256 computeUnits,
        uint256 cost
    );
    event UsageSettled(bytes32 indexed runHash, uint256 totalCost);
    event NodeOperatorRegistered(address indexed operator);
    event NodeOperatorStatusChanged(address indexed operator, bool isActive);
    
    constructor(
        address _zlagToken,
        address _agentRegistry,
        address initialOwner
    ) Ownable(initialOwner) {
        zlagToken = ZeroLagToken(_zlagToken);
        agentRegistry = AgentRegistry(_agentRegistry);
    }
    
    /**
     * @dev Register as a node operator
     */
    function registerNodeOperator() external {
        require(nodeOperators[msg.sender].operator == address(0), "Already registered");
        
        nodeOperators[msg.sender] = NodeOperator({
            operator: msg.sender,
            totalCompute: 0,
            totalEarnings: 0,
            reputation: 500, // Start with neutral reputation
            isActive: true,
            registeredAt: block.timestamp
        });
        
        activeOperators.push(msg.sender);
        
        emit NodeOperatorRegistered(msg.sender);
    }
    
    /**
     * @dev Record agent usage
     */
    function recordUsage(
        uint256 agentId,
        address user,
        address nodeOperator,
        uint256 computeUnits,
        bytes32 runHash
    ) external nonReentrant {
        require(agentRegistry.isAgentActive(agentId), "Agent not active");
        require(nodeOperators[nodeOperator].isActive, "Node operator not active");
        require(usageRecords[runHash].timestamp == 0, "Usage already recorded");
        
        uint256 cost = computeUnits * baseComputePrice;
        
        // Record usage
        usageRecords[runHash] = UsageRecord({
            agentId: agentId,
            user: user,
            nodeOperator: nodeOperator,
            timestamp: block.timestamp,
            computeUnits: computeUnits,
            cost: cost,
            runHash: runHash,
            settled: false
        });
        
        // Update statistics
        agentTotalUsage[agentId] += computeUnits;
        nodeOperators[nodeOperator].totalCompute += computeUnits;
        
        emit UsageRecorded(runHash, agentId, user, nodeOperator, computeUnits, cost);
    }
    
    /**
     * @dev Settle usage payment
     */
    function settleUsage(bytes32 runHash) external nonReentrant {
        UsageRecord storage record = usageRecords[runHash];
        require(record.timestamp > 0, "Usage record not found");
        require(!record.settled, "Already settled");
        require(record.user == msg.sender, "Not authorized");
        
        uint256 totalCost = record.cost;
        require(zlagToken.balanceOf(msg.sender) >= totalCost, "Insufficient balance");
        
        // Calculate fee distribution
        uint256 creatorFee = (totalCost * creatorFeePercent) / 100;
        uint256 operatorFee = (totalCost * operatorFeePercent) / 100;
        uint256 protocolFee = totalCost - creatorFee - operatorFee;
        
        // Get agent creator
        address creator = agentRegistry.ownerOf(record.agentId);
        
        // Transfer payments
        require(zlagToken.transferFrom(msg.sender, creator, creatorFee), "Creator payment failed");
        require(zlagToken.transferFrom(msg.sender, record.nodeOperator, operatorFee), "Operator payment failed");
        require(zlagToken.transferFrom(msg.sender, owner(), protocolFee), "Protocol payment failed");
        
        // Update records
        record.settled = true;
        userTotalSpent[msg.sender] += totalCost;
        nodeOperators[record.nodeOperator].totalEarnings += operatorFee;
        
        // Update agent registry
        agentRegistry.recordExecution(record.agentId, creatorFee);
        
        emit UsageSettled(runHash, totalCost);
    }
    
    /**
     * @dev Get usage record
     */
    function getUsageRecord(bytes32 runHash) external view returns (UsageRecord memory) {
        return usageRecords[runHash];
    }
    
    /**
     * @dev Get node operator info
     */
    function getNodeOperator(address operator) external view returns (NodeOperator memory) {
        return nodeOperators[operator];
    }
    
    /**
     * @dev Update pricing (only owner)
     */
    function updatePricing(
        uint256 newBasePrice,
        uint256 newCreatorPercent,
        uint256 newOperatorPercent,
        uint256 newProtocolPercent
    ) external onlyOwner {
        require(newCreatorPercent + newOperatorPercent + newProtocolPercent == 100, "Percentages must sum to 100");
        
        baseComputePrice = newBasePrice;
        creatorFeePercent = newCreatorPercent;
        operatorFeePercent = newOperatorPercent;
        protocolFeePercent = newProtocolPercent;
    }
    
    /**
     * @dev Set node operator status (only owner)
     */
    function setNodeOperatorStatus(address operator, bool isActive) external onlyOwner {
        require(nodeOperators[operator].operator != address(0), "Operator not registered");
        nodeOperators[operator].isActive = isActive;
        
        emit NodeOperatorStatusChanged(operator, isActive);
    }
    
    /**
     * @dev Get active operators count
     */
    function getActiveOperatorsCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < activeOperators.length; i++) {
            if (nodeOperators[activeOperators[i]].isActive) {
                count++;
            }
        }
        return count;
    }
}
