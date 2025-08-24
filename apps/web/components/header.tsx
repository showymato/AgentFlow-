"use client"

import { Button } from "@agentflow/ui"
import { Play, Save, FolderOpen, Zap } from "lucide-react"

interface HeaderProps {
  onRun: () => void
  onSave: () => void
  onLoad: () => void
  isRunning: boolean
}

export function Header({ onRun, onSave, onLoad, isRunning }: HeaderProps) {
  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">AgentFlow</h1>
        </div>
        <div className="text-sm text-muted-foreground">Decentralized AI Agent Builder</div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onLoad}>
          <FolderOpen className="h-4 w-4 mr-2" />
          Load
        </Button>
        <Button variant="outline" size="sm" onClick={onSave}>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
        <Button size="sm" onClick={onRun} disabled={isRunning} className="bg-primary hover:bg-primary/90">
          <Play className="h-4 w-4 mr-2" />
          {isRunning ? "Running..." : "Run"}
        </Button>
      </div>
    </header>
  )
}
