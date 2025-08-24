import { ethers } from "hardhat"

async function main() {
  const [deployer] = await ethers.getSigners()

  console.log("Deploying contracts with the account:", deployer.address)
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString())

  // Deploy ZeroLag Token
  const ZeroLagToken = await ethers.getContractFactory("ZeroLagToken")
  const zlagToken = await ZeroLagToken.deploy(deployer.address)
  await zlagToken.waitForDeployment()
  console.log("ZeroLagToken deployed to:", await zlagToken.getAddress())

  // Deploy Agent Registry
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry")
  const agentRegistry = await AgentRegistry.deploy(deployer.address)
  await agentRegistry.waitForDeployment()
  console.log("AgentRegistry deployed to:", await agentRegistry.getAddress())

  // Deploy Usage Meter
  const UsageMeter = await ethers.getContractFactory("UsageMeter")
  const usageMeter = await UsageMeter.deploy(
    await zlagToken.getAddress(),
    await agentRegistry.getAddress(),
    deployer.address,
  )
  await usageMeter.waitForDeployment()
  console.log("UsageMeter deployed to:", await usageMeter.getAddress())

  // Deploy Payments
  const Payments = await ethers.getContractFactory("Payments")
  const payments = await Payments.deploy(await zlagToken.getAddress(), deployer.address)
  await payments.waitForDeployment()
  console.log("Payments deployed to:", await payments.getAddress())

  // Save deployment addresses
  const deploymentInfo = {
    network: await ethers.provider.getNetwork(),
    deployer: deployer.address,
    contracts: {
      ZeroLagToken: await zlagToken.getAddress(),
      AgentRegistry: await agentRegistry.getAddress(),
      UsageMeter: await usageMeter.getAddress(),
      Payments: await payments.getAddress(),
    },
    timestamp: new Date().toISOString(),
  }

  console.log("\nDeployment Summary:")
  console.log(JSON.stringify(deploymentInfo, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
