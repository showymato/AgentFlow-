import { z } from "zod"

export const BaseNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.record(z.any()),
})

export const InputNodeSchema = BaseNodeSchema.extend({
  type: z.literal("input.text"),
  data: z.object({
    label: z.string().default("Input"),
    placeholder: z.string().optional(),
    defaultValue: z.string().optional(),
  }),
})

export const LLMNodeSchema = BaseNodeSchema.extend({
  type: z.literal("agent.llm"),
  data: z.object({
    provider: z.enum(["ollama", "openai", "anthropic"]),
    model: z.string(),
    prompt: z.string(),
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().positive().optional(),
  }),
})

export const HTTPNodeSchema = BaseNodeSchema.extend({
  type: z.literal("http.request"),
  data: z.object({
    url: z.string().url(),
    method: z.enum(["GET", "POST", "PUT", "DELETE"]).default("GET"),
    headers: z.record(z.string()).optional(),
    body: z.string().optional(),
  }),
})

export const OutputNodeSchema = BaseNodeSchema.extend({
  type: z.literal("output.text"),
  data: z.object({
    template: z.string().default("{{input}}"),
  }),
})

export const NodeSchema = z.discriminatedUnion("type", [
  InputNodeSchema,
  LLMNodeSchema,
  HTTPNodeSchema,
  OutputNodeSchema,
])

export type BaseNode = z.infer<typeof BaseNodeSchema>
export type InputNode = z.infer<typeof InputNodeSchema>
export type LLMNode = z.infer<typeof LLMNodeSchema>
export type HTTPNode = z.infer<typeof HTTPNodeSchema>
export type OutputNode = z.infer<typeof OutputNodeSchema>
export type AgentNode = z.infer<typeof NodeSchema>
