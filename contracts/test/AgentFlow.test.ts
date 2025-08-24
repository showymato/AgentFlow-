import { expect } from "chai"
import { ethers } from "hardhat"
import type { ZeroLagToken, AgentRegistry, UsageMeter, Payments } from "../typechain-types"

describe("AgentFlow Contracts", () => {
  let zlagToken: ZeroLagToken
  let agentRegistry: AgentRegistry
  let usageMeter: UsageMeter
  let payments: Payments
  let owner: any
  let creator: any
  let user: any
  let operator: any

  beforeEach(async () => {
    ;[owner, creator, user, operator] = await ethers.getSigners()

    // Deploy contracts
    const ZeroLagToken = await ethers.getContractFactory("ZeroLagToken")
    zlagToken = await ZeroLagToken.deploy(owner.address)

    const AgentRegistry = await ethers.getContractFactory("AgentRegistry")
    agentRegistry = await AgentRegistry.deploy(owner.address)

    const UsageMeter = await ethers.getContractFactory("UsageMeter")
    usageMeter = await UsageMeter.deploy(await zlagToken.getAddress(), await agentRegistry.getAddress(), owner.address)

    const Payments = await ethers.getContractFactory("Payments")
    payments = await Payments.deploy(await zlagToken.getAddress(), owner.address)

    // Setup initial state
    await zlagToken.transfer(creator.address, ethers.parseEther("1000"))
    await zlagToken.transfer(user.address, ethers.parseEther("1000"))
  })

  describe("ZeroLagToken", () => {
    it("Should have correct initial supply", async () => {
      expect(await zlagToken.totalSupply()).to.equal(ethers.parseEther("100000000"))
    })

    it("Should allow staking and reward calculation", async () => {
      const stakeAmount = ethers.parseEther("100")

      await zlagToken.connect(user).stake(stakeAmount)
      expect(await zlagToken.stakedBalance(user.address)).to.equal(stakeAmount)

      // Fast forward time and check rewards
      await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]) // 1 year
      await ethers.provider.send("evm_mine", [])

      const rewards = await zlagToken.calculateRewards(user.address)
      expect(rewards).to.be.gt(0)
    })
  })

  describe("AgentRegistry", () => {
    it("Should register an agent", async () => {
      const tx = await agentRegistry
        .connect(creator)
        .registerAgent("Test Agent", "A test AI agent", "chatbot", "QmTestCID123")

      expect(tx).to.emit(agentRegistry, "AgentRegistered")

      const agent = await agentRegistry.getAgent(1)
      expect(agent.name).to.equal("Test Agent")
      expect(agent.creator).to.equal(creator.address)
    })

    it("Should prevent duplicate CIDs", async () => {
      await agentRegistry.connect(creator).registerAgent("Test Agent 1", "First agent", "chatbot", "QmTestCID123")

      await expect(
        agentRegistry.connect(creator).registerAgent("Test Agent 2", "Second agent", "chatbot", "QmTestCID123"),
      ).to.be.revertedWith("Agent with this CID already exists")
    })
  })

  describe("UsageMeter", () => {
    beforeEach(async () => {
      // Register agent and node operator
      await agentRegistry.connect(creator).registerAgent("Test Agent", "A test AI agent", "chatbot", "QmTestCID123")
      await usageMeter.connect(operator).registerNodeOperator()
    })

    it("Should record and settle usage", async () => {
      const runHash = ethers.keccak256(ethers.toUtf8Bytes("test-run-123"))
      const computeUnits = 100

      // Record usage
      await usageMeter.recordUsage(1, user.address, operator.address, computeUnits, runHash)

      const record = await usageMeter.getUsageRecord(runHash)
      expect(record.agentId).to.equal(1)
      expect(record.computeUnits).to.equal(computeUnits)

      // Approve and settle
      const cost = computeUnits * (await usageMeter.baseComputePrice())
      await zlagToken.connect(user).approve(await usageMeter.getAddress(), cost)

      await usageMeter.connect(user).settleUsage(runHash)

      const settledRecord = await usageMeter.getUsageRecord(runHash)
      expect(settledRecord.settled).to.be.true
    })
  })

  describe("Integration", () => {
    it("Should handle complete agent lifecycle", async () => {
      // 1. Register agent
      await agentRegistry
        .connect(creator)
        .registerAgent("Integration Test Agent", "Full lifecycle test", "automation", "QmIntegrationCID")

      // 2. Register node operator
      await usageMeter.connect(operator).registerNodeOperator()

      // 3. User deposits escrow
      const escrowAmount = ethers.parseEther("10")
      await zlagToken.connect(user).approve(await payments.getAddress(), escrowAmount)
      await payments.connect(user).depositEscrow(escrowAmount)

      // 4. Record and settle usage
      const runHash = ethers.keccak256(ethers.toUtf8Bytes("integration-test"))
      await usageMeter.recordUsage(1, user.address, operator.address, 50, runHash)

      const cost = 50n * (await usageMeter.baseComputePrice())
      await zlagToken.connect(user).approve(await usageMeter.getAddress(), cost)
      await usageMeter.connect(user).settleUsage(runHash)

      // 5. Verify balances and statistics
      const agent = await agentRegistry.getAgent(1)
      expect(agent.totalRuns).to.equal(1)
      expect(agent.totalRevenue).to.be.gt(0)
    })
  })
})
