import type { AgentNode, ExecutionContext } from "../../types/execution"

export async function transformAdapter(node: AgentNode, context: ExecutionContext): Promise<any> {
  const { code } = node.data

  if (!code) {
    throw new Error("Transform node missing code")
  }

  try {
    // Create a safe execution context
    const safeContext = {
      inputs: context.inputs,
      outputs: context.outputs,
      // Add utility functions
      JSON,
      Math,
      Date,
      console: {
        log: (...args: any[]) => {
          context.logs.push({
            nodeId: node.id,
            type: "transform.js",
            status: "info",
            startTime: Date.now(),
            message: args.join(" "),
          })
        },
      },
    }

    // Execute code in isolated context (simplified - real implementation would use vm2 or similar)
    const func = new Function(
      "context",
      `
      const { inputs, outputs, JSON, Math, Date, console } = context;
      ${code}
    `,
    )

    const result = func(safeContext)
    return result || {}
  } catch (error) {
    throw new Error(`Transform execution failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}
