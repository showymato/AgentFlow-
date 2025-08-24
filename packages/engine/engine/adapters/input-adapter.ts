import type { AgentNode, ExecutionContext } from "../../types/execution"

export async function inputAdapter(node: AgentNode, context: ExecutionContext): Promise<{ text: string }> {
  // For input nodes, we either use provided input or default value
  const inputKey = node.data.inputKey || node.id
  const text = context.inputs[inputKey] || node.data.defaultValue || ""

  return { text }
}
