import { type NextRequest, NextResponse } from "next/server"
import { validateFlow } from "@agentflow/engine"

export async function POST(request: NextRequest) {
  try {
    const flow = await request.json()
    const validation = validateFlow(flow)

    return NextResponse.json(validation)
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request", message: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    )
  }
}
