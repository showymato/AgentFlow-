"use client"

import { Handle, Position } from "reactflow"
import { FileOutput } from "lucide-react"

export function OutputNode({ data }: { data: any }) {
  return (
    <div className="bg-card border-2 border-purple-500/50 rounded-lg p-3 min-w-[150px] shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <FileOutput className="h-4 w-4 text-purple-500" />
        <span className="text-sm font-medium">Output</span>
      </div>
      <div className="text-xs text-muted-foreground">{data.template ? "Custom template" : "Default output"}</div>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-purple-500" />
    </div>
  )
}
