// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title AgentRegistry
 * @dev NFT-based registry for AI agents with on-chain metadata
 * Each agent is represented as an NFT with IPFS metadata
 */
contract AgentRegistry is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _agentIds;
    
    struct AgentInfo {
        string name;
        string description;
        string category;
        address creator;
        uint256 createdAt;
        uint256 updatedAt;
        string metadataCID; // IPFS content hash
        bool isActive;
        uint256 totalRuns;
        uint256 totalRevenue;
    }
    
    mapping(uint256 => AgentInfo) public agents;
    mapping(address => uint256[]) public creatorAgents;
    mapping(string => bool) public cidExists;
    
    // Events
    event AgentRegistered(
        uint256 indexed agentId,
        address indexed creator,
        string name,
        string metadataCID
    );
    event AgentUpdated(uint256 indexed agentId, string newMetadataCID);
    event AgentStatusChanged(uint256 indexed agentId, bool isActive);
    event AgentExecuted(uint256 indexed agentId, address indexed user);
    
    constructor(address initialOwner) 
        ERC721("AgentFlow Agents", "AGENT") 
        Ownable(initialOwner) 
    {}
    
    /**
     * @dev Register a new agent
     */
    function registerAgent(
        string memory name,
        string memory description,
        string memory category,
        string memory metadataCID
    ) external returns (uint256) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(metadataCID).length > 0, "Metadata CID cannot be empty");
        require(!cidExists[metadataCID], "Agent with this CID already exists");
        
        _agentIds.increment();
        uint256 agentId = _agentIds.current();
        
        // Mint NFT to creator
        _safeMint(msg.sender, agentId);
        _setTokenURI(agentId, metadataCID);
        
        // Store agent info
        agents[agentId] = AgentInfo({
            name: name,
            description: description,
            category: category,
            creator: msg.sender,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            metadataCID: metadataCID,
            isActive: true,
            totalRuns: 0,
            totalRevenue: 0
        });
        
        creatorAgents[msg.sender].push(agentId);
        cidExists[metadataCID] = true;
        
        emit AgentRegistered(agentId, msg.sender, name, metadataCID);
        return agentId;
    }
    
    /**
     * @dev Update agent metadata (only owner)
     */
    function updateAgent(
        uint256 agentId,
        string memory newMetadataCID
    ) external {
        require(_exists(agentId), "Agent does not exist");
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        require(bytes(newMetadataCID).length > 0, "Metadata CID cannot be empty");
        require(!cidExists[newMetadataCID], "CID already in use");
        
        // Remove old CID from existence check
        cidExists[agents[agentId].metadataCID] = false;
        
        // Update agent
        agents[agentId].metadataCID = newMetadataCID;
        agents[agentId].updatedAt = block.timestamp;
        cidExists[newMetadataCID] = true;
        
        _setTokenURI(agentId, newMetadataCID);
        
        emit AgentUpdated(agentId, newMetadataCID);
    }
    
    /**
     * @dev Toggle agent active status (only owner)
     */
    function setAgentStatus(uint256 agentId, bool isActive) external {
        require(_exists(agentId), "Agent does not exist");
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        
        agents[agentId].isActive = isActive;
        agents[agentId].updatedAt = block.timestamp;
        
        emit AgentStatusChanged(agentId, isActive);
    }
    
    /**
     * @dev Record agent execution (called by usage meter)
     */
    function recordExecution(uint256 agentId, uint256 revenue) external {
        require(_exists(agentId), "Agent does not exist");
        // In production, this should be restricted to authorized contracts
        
        agents[agentId].totalRuns += 1;
        agents[agentId].totalRevenue += revenue;
        
        emit AgentExecuted(agentId, tx.origin);
    }
    
    /**
     * @dev Get agent info
     */
    function getAgent(uint256 agentId) external view returns (AgentInfo memory) {
        require(_exists(agentId), "Agent does not exist");
        return agents[agentId];
    }
    
    /**
     * @dev Get agents created by an address
     */
    function getCreatorAgents(address creator) external view returns (uint256[] memory) {
        return creatorAgents[creator];
    }
    
    /**
     * @dev Get total number of agents
     */
    function totalAgents() external view returns (uint256) {
        return _agentIds.current();
    }
    
    /**
     * @dev Check if agent exists and is active
     */
    function isAgentActive(uint256 agentId) external view returns (bool) {
        return _exists(agentId) && agents[agentId].isActive;
    }
    
    // Override required functions
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
