import { FlowExecutor } from "@agentflow/engine"
import type { TaskEnvelope, ExecutionResult } from "./types"

export class TaskExecutor {
  private flowExecutor = new FlowExecutor()

  async execute(taskEnvelope: TaskEnvelope): Promise<ExecutionResult> {
    const startTime = Date.now()

    try {
      console.log(`[TaskExecutor] Executing task ${taskEnvelope.id}`)

      // Execute the flow using the engine
      const result = await this.flowExecutor.execute(taskEnvelope.flow, taskEnvelope.inputs)

      const executionTime = Date.now() - startTime

      // Convert engine result to xNode result format
      const xNodeResult: ExecutionResult = {
        taskId: taskEnvelope.id,
        success: result.success,
        outputs: result.outputs,
        logs: result.logs.map((log) => ({
          nodeId: log.nodeId,
          message: log.message,
          timestamp: log.startTime,
          level: log.status === "error" ? "error" : "info",
        })),
        metrics: {
          executionTime,
          cpuUsage: await this.getCpuUsage(),
          memoryUsage: await this.getMemoryUsage(),
          computeUnits: this.calculateComputeUnits(executionTime, taskEnvelope),
        },
        artifacts: result.artifacts,
      }

      if (!result.success) {
        xNodeResult.error = "Flow execution failed"
      }

      return xNodeResult
    } catch (error) {
      const executionTime = Date.now() - startTime

      return {
        taskId: taskEnvelope.id,
        success: false,
        outputs: {},
        logs: [
          {
            nodeId: "executor",
            message: `Execution failed: ${error instanceof Error ? error.message : String(error)}`,
            timestamp: Date.now(),
            level: "error",
          },
        ],
        metrics: {
          executionTime,
          cpuUsage: 0,
          memoryUsage: 0,
          computeUnits: 0,
        },
        artifacts: {},
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  private async getCpuUsage(): Promise<number> {
    // Simplified CPU usage calculation
    // In production, would use proper system monitoring
    return Math.random() * 100
  }

  private async getMemoryUsage(): Promise<number> {
    // Simplified memory usage calculation
    const used = process.memoryUsage()
    return used.heapUsed / 1024 / 1024 // MB
  }

  private calculateComputeUnits(executionTime: number, taskEnvelope: TaskEnvelope): number {
    // Simple compute unit calculation based on execution time and resources
    const baseUnits = Math.ceil(executionTime / 1000) // 1 unit per second
    const resourceMultiplier = taskEnvelope.requiredResources.cpu * (taskEnvelope.requiredResources.memory / 1024)

    return Math.ceil(baseUnits * resourceMultiplier)
  }
}
