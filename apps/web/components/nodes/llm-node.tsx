"use client"

import { Handle, Position } from "reactflow"
import { Brain } from "lucide-react"

export function LLMNode({ data }: { data: any }) {
  return (
    <div className="bg-card border-2 border-blue-500/50 rounded-lg p-3 min-w-[150px] shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <Brain className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-medium">LLM Agent</span>
      </div>
      <div className="text-xs text-muted-foreground">
        {data.provider || "ollama"} • {data.model || "llama3"}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500" />
    </div>
  )
}
