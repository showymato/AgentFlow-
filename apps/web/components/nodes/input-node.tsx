"use client"

import { Handle, Position } from "reactflow"
import { Type } from "lucide-react"

export function InputNode({ data }: { data: any }) {
  return (
    <div className="bg-card border-2 border-orange-500/50 rounded-lg p-3 min-w-[150px] shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <Type className="h-4 w-4 text-orange-500" />
        <span className="text-sm font-medium">Input</span>
      </div>
      <div className="text-xs text-muted-foreground">{data.label || "Text Input"}</div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-orange-500" />
    </div>
  )
}
