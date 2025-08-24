import { TaskCoordinator } from "./coordinator"

async function main() {
  const port = Number.parseInt(process.env.PORT || "8080")

  console.log(`Starting Task Coordinator on port ${port}`)

  const coordinator = new TaskCoordinator(port)

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\nReceived SIGINT, shutting down gracefully...")
    process.exit(0)
  })

  try {
    await coordinator.start()
  } catch (error) {
    console.error("Failed to start coordinator:", error)
    process.exit(1)
  }
}

main().catch(console.error)
