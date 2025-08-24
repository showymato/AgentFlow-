import { XNodeDaemon } from "./xnode-daemon"

async function main() {
  const nodeId = process.env.NODE_ID || `xnode_${Math.random().toString(36).substr(2, 9)}`
  const coordinatorUrl = process.env.COORDINATOR_URL || "ws://localhost:8080"

  console.log(`Starting xNode daemon with ID: ${nodeId}`)

  const daemon = new XNodeDaemon(nodeId, coordinatorUrl)

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\nReceived SIGINT, shutting down gracefully...")
    await daemon.stop()
    process.exit(0)
  })

  process.on("SIGTERM", async () => {
    console.log("\nReceived SIGTERM, shutting down gracefully...")
    await daemon.stop()
    process.exit(0)
  })

  try {
    await daemon.start()
  } catch (error) {
    console.error("Failed to start xNode daemon:", error)
    process.exit(1)
  }
}

main().catch(console.error)
