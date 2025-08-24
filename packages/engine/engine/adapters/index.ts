import type { AgentNode, ExecutionContext } from "../../types/execution"
import { inputAdapter } from "./input-adapter"
import { llmAdapter } from "./llm-adapter"
import { httpAdapter } from "./http-adapter"
import { outputAdapter } from "./output-adapter"
import { transformAdapter } from "./transform-adapter"
import { logicAdapter } from "./logic-adapter"

export type NodeAdapter = (node: AgentNode, context: ExecutionContext) => Promise<any>

export function createNodeAdapters(): Record<string, NodeAdapter> {
  return {
    "input.text": inputAdapter,
    "agent.llm": llmAdapter,
    "http.request": httpAdapter,
    "output.text": outputAdapter,
    "transform.js": transformAdapter,
    "logic.if": logicAdapter,
  }
}
