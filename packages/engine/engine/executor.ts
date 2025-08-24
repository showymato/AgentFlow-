import type { Flow, AgentNode } from "../types/flow"
import type { ExecutionContext, ExecutionResult, StepLog } from "../types/execution"
import { validateFlow } from "./validator"
import { createNodeAdapters } from "./adapters"

export class FlowExecutor {
  private adapters = createNodeAdapters()

  async execute(flow: Flow, inputs: Record<string, any> = {}): Promise<ExecutionResult> {
    // Validate flow structure
    const validation = validateFlow(flow)
    if (!validation.valid) {
      throw new Error(`Flow validation failed: ${validation.errors.join(", ")}`)
    }

    // Initialize execution context
    const context: ExecutionContext = {
      inputs,
      outputs: {},
      artifacts: {},
      secrets: {},
      logs: [],
    }

    // Get execution order using topological sort
    const executionOrder = this.getExecutionOrder(flow.nodes, flow.edges)

    // Execute nodes in order
    for (const node of executionOrder) {
      try {
        const stepLog: StepLog = {
          nodeId: node.id,
          type: node.type,
          status: "running",
          startTime: Date.now(),
          message: `Executing ${node.type} node`,
        }
        context.logs.push(stepLog)

        // Get the appropriate adapter for this node type
        const adapter = this.adapters[node.type]
        if (!adapter) {
          throw new Error(`No adapter found for node type: ${node.type}`)
        }

        // Execute the node
        const result = await adapter(node, context)
        context.outputs[node.id] = result

        // Update log with success
        stepLog.status = "success"
        stepLog.endTime = Date.now()
        stepLog.result = result
        stepLog.message = `Completed ${node.type} node successfully`
      } catch (error) {
        // Update log with error
        const errorLog: StepLog = {
          nodeId: node.id,
          type: node.type,
          status: "error",
          startTime: Date.now(),
          endTime: Date.now(),
          message: `Error in ${node.type} node: ${error instanceof Error ? error.message : String(error)}`,
          error: error instanceof Error ? error.message : String(error),
        }
        context.logs.push(errorLog)

        // Stop execution on error (could be configurable per node)
        break
      }
    }

    return {
      success: context.logs.every((log) => log.status !== "error"),
      outputs: context.outputs,
      logs: context.logs,
      artifacts: context.artifacts,
    }
  }

  private getExecutionOrder(nodes: AgentNode[], edges: Array<{ source: string; target: string }>): AgentNode[] {
    // Build adjacency list
    const graph = new Map<string, string[]>()
    const inDegree = new Map<string, number>()

    // Initialize
    for (const node of nodes) {
      graph.set(node.id, [])
      inDegree.set(node.id, 0)
    }

    // Build graph
    for (const edge of edges) {
      graph.get(edge.source)?.push(edge.target)
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
    }

    // Topological sort using Kahn's algorithm
    const queue: string[] = []
    const result: AgentNode[] = []

    // Find nodes with no incoming edges
    for (const [nodeId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(nodeId)
      }
    }

    while (queue.length > 0) {
      const nodeId = queue.shift()!
      const node = nodes.find((n) => n.id === nodeId)
      if (node) {
        result.push(node)
      }

      // Reduce in-degree of neighbors
      const neighbors = graph.get(nodeId) || []
      for (const neighbor of neighbors) {
        const newDegree = (inDegree.get(neighbor) || 0) - 1
        inDegree.set(neighbor, newDegree)
        if (newDegree === 0) {
          queue.push(neighbor)
        }
      }
    }

    // Check for cycles
    if (result.length !== nodes.length) {
      throw new Error("Flow contains cycles - cannot execute")
    }

    return result
  }
}
