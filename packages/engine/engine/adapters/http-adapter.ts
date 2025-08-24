import type { AgentNode, ExecutionContext } from "../../types/execution"
import { interpolateTemplate } from "../template"

export async function httpAdapter(
  node: AgentNode,
  context: ExecutionContext,
): Promise<{ status: number; headers: Record<string, string>; body: any }> {
  const { url, method = "GET", headers = {}, body } = node.data

  // Interpolate URL and body with context
  const interpolatedUrl = interpolateTemplate(url, context)
  const interpolatedBody = body ? interpolateTemplate(body, context) : undefined

  // Prepare request options
  const requestOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  }

  if (interpolatedBody && method !== "GET") {
    requestOptions.body = interpolatedBody
  }

  try {
    const response = await fetch(interpolatedUrl, requestOptions)
    const responseBody = await response.text()

    let parsedBody: any
    try {
      parsedBody = JSON.parse(responseBody)
    } catch {
      parsedBody = responseBody
    }

    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: parsedBody,
    }
  } catch (error) {
    throw new Error(`HTTP request failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}
