"use client"

import { Button } from "@agentflow/ui"
import { Type, Brain, Globe, FileOutput, GitBranch, Code } from "lucide-react"

interface NodePaletteProps {
  onAddNode: (type: string) => void
}

const nodeCategories = [
  {
    title: "Input/Output",
    nodes: [
      { type: "input", label: "Text Input", icon: Type, color: "text-orange-500" },
      { type: "output", label: "Output", icon: FileOutput, color: "text-purple-500" },
    ],
  },
  {
    title: "AI & Logic",
    nodes: [
      { type: "llm", label: "LLM Agent", icon: Brain, color: "text-blue-500" },
      { type: "logic", label: "Condition", icon: GitBranch, color: "text-yellow-500" },
    ],
  },
  {
    title: "External",
    nodes: [
      { type: "http", label: "HTTP Request", icon: Globe, color: "text-green-500" },
      { type: "transform", label: "Transform", icon: Code, color: "text-gray-500" },
    ],
  },
]

export function NodePalette({ onAddNode }: NodePaletteProps) {
  return (
    <div className="w-64 border-r border-border bg-card/30 backdrop-blur-sm p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Node Palette</h2>

      <div className="space-y-6">
        {nodeCategories.map((category) => (
          <div key={category.title}>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">{category.title}</h3>
            <div className="space-y-2">
              {category.nodes.map((node) => (
                <Button
                  key={node.type}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-auto p-3 hover:bg-accent/50"
                  onClick={() => onAddNode(node.type)}
                >
                  <node.icon className={`h-4 w-4 mr-3 ${node.color}`} />
                  <span className="text-sm">{node.label}</span>
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-3 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground">Drag nodes onto the canvas to build your AI agent workflow.</p>
      </div>
    </div>
  )
}
