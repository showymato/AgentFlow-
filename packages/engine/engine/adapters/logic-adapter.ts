import type { AgentNode, ExecutionContext } from "../../types/execution"
import { interpolateTemplate } from "../template"

export async function logicAdapter(
  node: AgentNode,
  context: ExecutionContext,
): Promise<{ result: boolean; path: string }> {
  const { condition } = node.data

  if (!condition) {
    throw new Error("Logic node missing condition")
  }

  try {
    // Interpolate condition with context
    const interpolatedCondition = interpolateTemplate(condition, context)

    // Simple expression evaluation (real implementation would use a safe evaluator)
    const result = evaluateCondition(interpolatedCondition, context)

    return {
      result,
      path: result ? "true" : "false",
    }
  } catch (error) {
    throw new Error(`Logic evaluation failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function evaluateCondition(condition: string, context: ExecutionContext): boolean {
  // Simplified condition evaluation - real implementation would be more robust
  try {
    const func = new Function(
      "context",
      `
      const { inputs, outputs } = context;
      return ${condition};
    `,
    )
    return Boolean(func(context))
  } catch {
    return false
  }
}
