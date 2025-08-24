import type { AgentNode, ExecutionContext } from "../../types/execution"
import { interpolateTemplate } from "../template"

export async function outputAdapter(node: AgentNode, context: ExecutionContext): Promise<{ text: string }> {
  const { template = "{{input}}" } = node.data

  // Interpolate template with all available context
  const interpolatedText = interpolateTemplate(template, context)

  return { text: interpolatedText }
}
