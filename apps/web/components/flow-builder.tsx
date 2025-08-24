"use client"

import type React from "react"

import { useCallback, useState } from "react"
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
} from "reactflow"
import "reactflow/dist/style.css"

import { Header } from "./header"
import { NodePalette } from "./node-palette"
import { Inspector } from "./inspector"
import { Console } from "./console"
import { nodeTypes } from "./nodes"

const initialNodes: Node[] = []
const initialEdges: Edge[] = []

export function FlowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState<Array<{ id: string; message: string; type: "info" | "error" | "success" }>>([])

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges])

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const addNode = useCallback(
    (type: string) => {
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position: { x: Math.random() * 400, y: Math.random() * 400 },
        data: getDefaultNodeData(type),
      }
      setNodes((nds) => [...nds, newNode])
    },
    [setNodes],
  )

  const updateNodeData = useCallback(
    (nodeId: string, data: any) => {
      setNodes((nds) => nds.map((node) => (node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node)))
    },
    [setNodes],
  )

  const runFlow = useCallback(async () => {
    setIsRunning(true)
    setLogs([])

    try {
      // First validate the flow
      const validateResponse = await fetch("/api/flow/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
      })

      const validation = await validateResponse.json()
      if (!validation.valid) {
        setLogs([{ id: "validation", message: `Validation failed: ${validation.errors.join(", ")}`, type: "error" }])
        setIsRunning(false)
        return
      }

      // Run the flow
      const runResponse = await fetch("/api/flow/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flow: { id: "current", name: "Current Flow", nodes, edges },
          inputs: {},
          mode: "local",
        }),
      })

      const runResult = await runResponse.json()
      if (runResult.error) {
        setLogs([{ id: "execution", message: `Execution failed: ${runResult.message}`, type: "error" }])
      } else {
        // Convert execution logs to console logs
        const executionLogs = runResult.result.logs.map((log: any) => ({
          id: `${log.nodeId}-${log.startTime}`,
          message: log.message,
          type: log.status === "error" ? "error" : log.status === "success" ? "success" : "info",
        }))
        setLogs(executionLogs)
      }
    } catch (error) {
      setLogs([
        {
          id: "error",
          message: `Network error: ${error instanceof Error ? error.message : String(error)}`,
          type: "error",
        },
      ])
    } finally {
      setIsRunning(false)
    }
  }, [nodes, edges])

  const saveFlow = useCallback(() => {
    const flow = { nodes, edges }
    localStorage.setItem("agentflow-current", JSON.stringify(flow))
    setLogs((prev) => [...prev, { id: Date.now().toString(), message: "Flow saved to localStorage", type: "success" }])
  }, [nodes, edges])

  const loadFlow = useCallback(() => {
    const saved = localStorage.getItem("agentflow-current")
    if (saved) {
      const flow = JSON.parse(saved)
      setNodes(flow.nodes || [])
      setEdges(flow.edges || [])
      setLogs((prev) => [
        ...prev,
        { id: Date.now().toString(), message: "Flow loaded from localStorage", type: "success" },
      ])
    }
  }, [setNodes, setEdges])

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header onRun={runFlow} onSave={saveFlow} onLoad={loadFlow} isRunning={isRunning} />

      <div className="flex-1 flex">
        <NodePalette onAddNode={addNode} />

        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-background"
          >
            <Background color="#333" size={1} />
            <Controls className="bg-card border-border" />
            <MiniMap className="bg-card border-border" nodeColor="#666" maskColor="rgba(0,0,0,0.2)" />
          </ReactFlow>
        </div>

        <Inspector selectedNode={selectedNode} onUpdateNode={updateNodeData} />
      </div>

      <Console logs={logs} />
    </div>
  )
}

function getDefaultNodeData(type: string) {
  switch (type) {
    case "input":
      return { label: "Input", placeholder: "Enter text..." }
    case "llm":
      return { provider: "ollama", model: "llama3", prompt: "You are a helpful assistant.", temperature: 0.7 }
    case "http":
      return { url: "https://api.example.com", method: "GET" }
    case "output":
      return { template: "{{input}}" }
    default:
      return {}
  }
}
