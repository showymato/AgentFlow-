import { type NextRequest, NextResponse } from "next/server"
import { FlowExecutor } from "@agentflow/engine"

export async function POST(request: NextRequest) {
  try {
    const { flow, inputs = {}, mode = "local" } = await request.json()

    if (!flow) {
      return NextResponse.json({ error: "Flow is required" }, { status: 400 })
    }

    const executor = new FlowExecutor()
    const result = await executor.execute(flow, inputs)

    return NextResponse.json({
      runId: `run_${Date.now()}`,
      result,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Execution failed", message: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
