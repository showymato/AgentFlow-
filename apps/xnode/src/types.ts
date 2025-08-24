export interface TaskEnvelope {
  id: string
  agentId: number
  flow: any
  inputs: Record<string, any>
  priority: number
  maxExecutionTime: number
  requiredResources: {
    cpu: number
    memory: number
    gpu?: boolean
  }
  signature: string
  timestamp: number
  coordinatorId: string
}

export interface ExecutionResult {
  taskId: string
  success: boolean
  outputs: Record<string, any>
  logs: Array<{
    nodeId: string
    message: string
    timestamp: number
    level: "info" | "warn" | "error"
  }>
  metrics: {
    executionTime: number
    cpuUsage: number
    memoryUsage: number
    computeUnits: number
  }
  artifacts: Record<string, string>
  error?: string
}

export interface NodeCapabilities {
  nodeId: string
  version: string
  maxConcurrentTasks: number
  supportedProviders: string[]
  resources: {
    cpu: {
      cores: number
      usage: number
    }
    memory: {
      total: number
      available: number
    }
    gpu?: {
      model: string
      memory: number
      available: boolean
    }
  }
  location: {
    region: string
    country: string
  }
  reputation: number
  uptime: number
}

export interface TaskStatus {
  taskId: string
  status: "pending" | "assigned" | "running" | "completed" | "failed"
  nodeId?: string
  startTime?: number
  endTime?: number
  progress?: number
  logs: string[]
}
