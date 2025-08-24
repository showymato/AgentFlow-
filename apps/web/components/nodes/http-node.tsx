"use client"

import { Handle, Position } from "reactflow"
import { Globe } from "lucide-react"

export function HTTPNode({ data }: { data: any }) {
  return (
    <div className="bg-card border-2 border-green-500/50 rounded-lg p-3 min-w-[150px] shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <Globe className="h-4 w-4 text-green-500" />
        <span className="text-sm font-medium">HTTP Request</span>
      </div>
      <div className="text-xs text-muted-foreground">
        {data.method || "GET"} • {data.url ? new URL(data.url).hostname : "No URL"}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-green-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-green-500" />
    </div>
  )
}
