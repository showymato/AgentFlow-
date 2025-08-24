import type { Flow } from "../types/flow"
import { FlowSchema, NodeSchema } from "../types/node"

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateFlow(flow: Flow): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Validate basic flow structure
    FlowSchema.parse(flow)
  } catch (error) {
    errors.push(`Invalid flow structure: ${error}`)
    return { valid: false, errors, warnings }
  }

  // Validate individual nodes
  for (const node of flow.nodes) {
    try {
      NodeSchema.parse(node)
    } catch (error) {
      errors.push(`Invalid node ${node.id}: ${error}`)
    }
  }

  // Validate edges reference existing nodes
  const nodeIds = new Set(flow.nodes.map((n) => n.id))
  for (const edge of flow.edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge references non-existent source node: ${edge.source}`)
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge references non-existent target node: ${edge.target}`)
    }
  }

  // Check for isolated nodes (warning)
  const connectedNodes = new Set<string>()
  for (const edge of flow.edges) {
    connectedNodes.add(edge.source)
    connectedNodes.add(edge.target)
  }
  for (const node of flow.nodes) {
    if (!connectedNodes.has(node.id) && flow.nodes.length > 1) {
      warnings.push(`Node ${node.id} is not connected to any other nodes`)
    }
  }

  // Validate specific node requirements
  for (const node of flow.nodes) {
    switch (node.type) {
      case "agent.llm":
        if (!node.data.model || !node.data.prompt) {
          errors.push(`LLM node ${node.id} missing required model or prompt`)
        }
        break
      case "http.request":
        if (!node.data.url) {
          errors.push(`HTTP node ${node.id} missing required URL`)
        }
        try {
          new URL(node.data.url)
        } catch {
          errors.push(`HTTP node ${node.id} has invalid URL`)
        }
        break
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
