import type { AgentNode } from "./node"

export interface ExecutionContext {
  inputs: Record<string, any>
  outputs: Record<string, any>
  artifacts: Record<string, any>
  secrets: Record<string, any>
  logs: StepLog[]
}

export interface StepLog {
  nodeId: string
  type: string
  status: "running" | "success" | "error" | "info"
  startTime: number
  endTime?: number
  message: string
  result?: any
  error?: string
}

export interface ExecutionResult {
  success: boolean
  outputs: Record<string, any>
  logs: StepLog[]
  artifacts: Record<string, any>
}

export type { AgentNode }
