import { InputNode } from "./input-node"
import { LLMNode } from "./llm-node"
import { HTTPNode } from "./http-node"
import { OutputNode } from "./output-node"

export const nodeTypes = {
  input: InputNode,
  llm: LLMNode,
  http: HTTPNode,
  output: OutputNode,
}
