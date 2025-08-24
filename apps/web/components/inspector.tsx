"use client"

import { useState } from "react"
import { Button, Input, Card } from "@agentflow/ui"
import { Settings, Eye, Terminal } from "lucide-react"
import type { Node } from "reactflow"

interface InspectorProps {
  selectedNode: Node | null
  onUpdateNode: (nodeId: string, data: any) => void
}

export function Inspector({ selectedNode, onUpdateNode }: InspectorProps) {
  const [activeTab, setActiveTab] = useState<"config" | "preview" | "logs">("config")

  if (!selectedNode) {
    return (
      <div className="w-80 border-l border-border bg-card/30 backdrop-blur-sm p-4">
        <div className="text-center text-muted-foreground mt-8">
          <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select a node to configure</p>
        </div>
      </div>
    )
  }

  const updateField = (field: string, value: any) => {
    onUpdateNode(selectedNode.id, { [field]: value })
  }

  return (
    <div className="w-80 border-l border-border bg-card/30 backdrop-blur-sm flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold mb-2">Inspector</h2>
        <div className="flex gap-1">
          {[
            { id: "config", label: "Config", icon: Settings },
            { id: "preview", label: "Preview", icon: Eye },
            { id: "logs", label: "Logs", icon: Terminal },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id as any)}
              className="flex-1"
            >
              <tab.icon className="h-4 w-4 mr-1" />
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === "config" && <NodeConfig node={selectedNode} onUpdate={updateField} />}
        {activeTab === "preview" && (
          <div className="text-sm text-muted-foreground">Preview functionality coming soon...</div>
        )}
        {activeTab === "logs" && (
          <div className="text-sm text-muted-foreground">Node-specific logs will appear here during execution.</div>
        )}
      </div>
    </div>
  )
}

function NodeConfig({ node, onUpdate }: { node: Node; onUpdate: (field: string, value: any) => void }) {
  const { type, data } = node

  return (
    <div className="space-y-4">
      <Card className="p-3">
        <div className="text-sm font-medium mb-2">Node: {type}</div>
        <div className="text-xs text-muted-foreground">ID: {node.id}</div>
      </Card>

      {type === "input" && (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Label</label>
            <Input
              value={data.label || ""}
              onChange={(e) => onUpdate("label", e.target.value)}
              placeholder="Input label"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Placeholder</label>
            <Input
              value={data.placeholder || ""}
              onChange={(e) => onUpdate("placeholder", e.target.value)}
              placeholder="Placeholder text"
            />
          </div>
        </div>
      )}

      {type === "llm" && (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Provider</label>
            <select
              value={data.provider || "ollama"}
              onChange={(e) => onUpdate("provider", e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-background"
            >
              <option value="ollama">Ollama</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Model</label>
            <Input
              value={data.model || ""}
              onChange={(e) => onUpdate("model", e.target.value)}
              placeholder="Model name"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Prompt</label>
            <textarea
              value={data.prompt || ""}
              onChange={(e) => onUpdate("prompt", e.target.value)}
              placeholder="System prompt"
              className="w-full p-2 border border-border rounded-md bg-background min-h-[100px]"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Temperature</label>
            <Input
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={data.temperature || 0.7}
              onChange={(e) => onUpdate("temperature", Number.parseFloat(e.target.value))}
            />
          </div>
        </div>
      )}

      {type === "http" && (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">URL</label>
            <Input
              value={data.url || ""}
              onChange={(e) => onUpdate("url", e.target.value)}
              placeholder="https://api.example.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Method</label>
            <select
              value={data.method || "GET"}
              onChange={(e) => onUpdate("method", e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-background"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
        </div>
      )}

      {type === "output" && (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Template</label>
            <textarea
              value={data.template || ""}
              onChange={(e) => onUpdate("template", e.target.value)}
              placeholder="Output template with {{variables}}"
              className="w-full p-2 border border-border rounded-md bg-background min-h-[80px]"
            />
          </div>
        </div>
      )}
    </div>
  )
}
