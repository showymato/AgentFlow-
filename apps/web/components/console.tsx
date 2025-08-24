"use client"
import { Terminal, Info, AlertCircle, CheckCircle } from "lucide-react"

interface ConsoleProps {
  logs: Array<{ id: string; message: string; type: "info" | "error" | "success" }>
}

export function Console({ logs }: ConsoleProps) {
  return (
    <div className="h-48 border-t border-border bg-card/30 backdrop-blur-sm">
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 p-3 border-b border-border">
          <Terminal className="h-4 w-4" />
          <span className="text-sm font-medium">Console</span>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {logs.length === 0 ? (
            <div className="text-sm text-muted-foreground">Console output will appear here during execution...</div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 text-sm">
                  {log.type === "info" && <Info className="h-4 w-4 text-blue-500 mt-0.5" />}
                  {log.type === "error" && <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />}
                  {log.type === "success" && <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />}
                  <span
                    className={
                      log.type === "error"
                        ? "text-red-400"
                        : log.type === "success"
                          ? "text-green-400"
                          : "text-foreground"
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
