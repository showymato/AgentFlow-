import { z } from "zod"

export const FlowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  nodes: z.array(z.any()), // Will be refined with specific node schemas
  edges: z.array(
    z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
      sourceHandle: z.string().optional(),
      targetHandle: z.string().optional(),
    }),
  ),
  version: z.string().default("0.1.0"),
  metadata: z.record(z.any()).optional(),
})

export type Flow = z.infer<typeof FlowSchema>
