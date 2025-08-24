import { EventEmitter } from "events"
import WebSocket from "ws"
import type { TaskEnvelope, ExecutionResult, NodeCapabilities, TaskStatus } from "./types"
import { ResourceMonitor } from "./resource-monitor"
import { TaskExecutor } from "./task-executor"
import { SecurityManager } from "./security-manager"

export class XNodeDaemon extends EventEmitter {
  private nodeId: string
  private coordinatorUrl: string
  private ws: WebSocket | null = null
  private isRunning = false
  private currentTasks = new Map<string, TaskStatus>()
  private resourceMonitor: ResourceMonitor
  private taskExecutor: TaskExecutor
  private securityManager: SecurityManager
  private capabilities: NodeCapabilities
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor(nodeId: string, coordinatorUrl: string) {
    super()
    this.nodeId = nodeId
    this.coordinatorUrl = coordinatorUrl
    this.resourceMonitor = new ResourceMonitor()
    this.taskExecutor = new TaskExecutor()
    this.securityManager = new SecurityManager()
    this.capabilities = this.initializeCapabilities()
  }

  async start(): Promise<void> {
    console.log(`[xNode] Starting daemon ${this.nodeId}`)

    this.isRunning = true
    await this.connectToCoordinator()
    await this.registerWithCoordinator()
    this.startHeartbeat()
    this.startTaskPolling()

    console.log(`[xNode] Daemon ${this.nodeId} started successfully`)
  }

  async stop(): Promise<void> {
    console.log(`[xNode] Stopping daemon ${this.nodeId}`)

    this.isRunning = false

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    if (this.ws) {
      this.ws.close()
    }

    // Wait for current tasks to complete
    await this.waitForTasksToComplete()

    console.log(`[xNode] Daemon ${this.nodeId} stopped`)
  }

  private async connectToCoordinator(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.coordinatorUrl)

      this.ws.on("open", () => {
        console.log(`[xNode] Connected to coordinator at ${this.coordinatorUrl}`)
        resolve()
      })

      this.ws.on("error", (error) => {
        console.error(`[xNode] WebSocket error:`, error)
        reject(error)
      })

      this.ws.on("message", (data) => {
        this.handleCoordinatorMessage(JSON.parse(data.toString()))
      })

      this.ws.on("close", () => {
        console.log(`[xNode] Disconnected from coordinator`)
        if (this.isRunning) {
          // Attempt to reconnect
          setTimeout(() => this.connectToCoordinator(), 5000)
        }
      })
    })
  }

  private async registerWithCoordinator(): Promise<void> {
    const registrationMessage = {
      type: "register",
      nodeId: this.nodeId,
      capabilities: await this.getUpdatedCapabilities(),
      timestamp: Date.now(),
    }

    this.sendToCoordinator(registrationMessage)
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      const heartbeat = {
        type: "heartbeat",
        nodeId: this.nodeId,
        capabilities: await this.getUpdatedCapabilities(),
        activeTasks: Array.from(this.currentTasks.keys()),
        timestamp: Date.now(),
      }

      this.sendToCoordinator(heartbeat)
    }, 30000) // Every 30 seconds
  }

  private startTaskPolling(): void {
    setInterval(async () => {
      if (this.canAcceptMoreTasks()) {
        this.requestTask()
      }
    }, 5000) // Poll every 5 seconds
  }

  private handleCoordinatorMessage(message: any): void {
    switch (message.type) {
      case "task_assigned":
        this.handleTaskAssignment(message.task)
        break
      case "task_cancelled":
        this.handleTaskCancellation(message.taskId)
        break
      case "shutdown":
        this.stop()
        break
      default:
        console.warn(`[xNode] Unknown message type: ${message.type}`)
    }
  }

  private async handleTaskAssignment(taskEnvelope: TaskEnvelope): Promise<void> {
    console.log(`[xNode] Received task assignment: ${taskEnvelope.id}`)

    // Verify task signature
    if (!this.securityManager.verifyTaskSignature(taskEnvelope)) {
      console.error(`[xNode] Invalid task signature for task ${taskEnvelope.id}`)
      return
    }

    // Check if we can handle this task
    if (!this.canExecuteTask(taskEnvelope)) {
      console.error(`[xNode] Cannot execute task ${taskEnvelope.id} - insufficient resources`)
      this.rejectTask(taskEnvelope.id, "Insufficient resources")
      return
    }

    // Add to current tasks
    this.currentTasks.set(taskEnvelope.id, {
      taskId: taskEnvelope.id,
      status: "assigned",
      logs: [],
    })

    // Execute task
    this.executeTask(taskEnvelope)
  }

  private async executeTask(taskEnvelope: TaskEnvelope): Promise<void> {
    const taskStatus = this.currentTasks.get(taskEnvelope.id)!
    taskStatus.status = "running"
    taskStatus.startTime = Date.now()

    try {
      console.log(`[xNode] Starting execution of task ${taskEnvelope.id}`)

      const result = await this.taskExecutor.execute(taskEnvelope)

      taskStatus.status = "completed"
      taskStatus.endTime = Date.now()

      // Send result back to coordinator
      this.sendTaskResult(taskEnvelope.id, result)

      console.log(`[xNode] Completed task ${taskEnvelope.id}`)
    } catch (error) {
      console.error(`[xNode] Task ${taskEnvelope.id} failed:`, error)

      taskStatus.status = "failed"
      taskStatus.endTime = Date.now()

      const errorResult: ExecutionResult = {
        taskId: taskEnvelope.id,
        success: false,
        outputs: {},
        logs: [],
        metrics: {
          executionTime: Date.now() - taskStatus.startTime!,
          cpuUsage: 0,
          memoryUsage: 0,
          computeUnits: 0,
        },
        artifacts: {},
        error: error instanceof Error ? error.message : String(error),
      }

      this.sendTaskResult(taskEnvelope.id, errorResult)
    } finally {
      // Clean up
      setTimeout(() => {
        this.currentTasks.delete(taskEnvelope.id)
      }, 60000) // Keep for 1 minute for debugging
    }
  }

  private canAcceptMoreTasks(): boolean {
    const maxConcurrent = this.capabilities.maxConcurrentTasks
    const currentCount = Array.from(this.currentTasks.values()).filter(
      (task) => task.status === "running" || task.status === "assigned",
    ).length

    return currentCount < maxConcurrent
  }

  private canExecuteTask(taskEnvelope: TaskEnvelope): boolean {
    const required = taskEnvelope.requiredResources
    const available = this.capabilities.resources

    return (
      available.cpu.cores >= required.cpu &&
      available.memory.available >= required.memory &&
      (!required.gpu || (available.gpu?.available ?? false))
    )
  }

  private requestTask(): void {
    const request = {
      type: "request_task",
      nodeId: this.nodeId,
      availableResources: this.capabilities.resources,
      timestamp: Date.now(),
    }

    this.sendToCoordinator(request)
  }

  private rejectTask(taskId: string, reason: string): void {
    const rejection = {
      type: "task_rejected",
      taskId,
      nodeId: this.nodeId,
      reason,
      timestamp: Date.now(),
    }

    this.sendToCoordinator(rejection)
  }

  private sendTaskResult(taskId: string, result: ExecutionResult): void {
    const message = {
      type: "task_completed",
      taskId,
      nodeId: this.nodeId,
      result,
      timestamp: Date.now(),
    }

    this.sendToCoordinator(message)
  }

  private sendToCoordinator(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn(`[xNode] Cannot send message - not connected to coordinator`)
    }
  }

  private async getUpdatedCapabilities(): Promise<NodeCapabilities> {
    const resources = await this.resourceMonitor.getCurrentResources()

    return {
      ...this.capabilities,
      resources,
    }
  }

  private initializeCapabilities(): NodeCapabilities {
    return {
      nodeId: this.nodeId,
      version: "0.1.0",
      maxConcurrentTasks: 3,
      supportedProviders: ["ollama", "openai", "anthropic"],
      resources: {
        cpu: { cores: 4, usage: 0 },
        memory: { total: 8192, available: 6144 },
      },
      location: {
        region: "us-east-1",
        country: "US",
      },
      reputation: 100,
      uptime: 0,
    }
  }

  private async waitForTasksToComplete(): Promise<void> {
    const runningTasks = Array.from(this.currentTasks.values()).filter((task) => task.status === "running")

    if (runningTasks.length === 0) return

    console.log(`[xNode] Waiting for ${runningTasks.length} tasks to complete...`)

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const stillRunning = Array.from(this.currentTasks.values()).filter((task) => task.status === "running")

        if (stillRunning.length === 0) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 1000)
    })
  }

  private handleTaskCancellation(taskId: string): void {
    const task = this.currentTasks.get(taskId)
    if (task && task.status === "running") {
      // In a real implementation, we'd need to actually cancel the running task
      console.log(`[xNode] Cancelling task ${taskId}`)
      task.status = "failed"
      this.currentTasks.delete(taskId)
    }
  }
}
