import type { ExecutionContext } from "../types/execution"

export function interpolateTemplate(template: string, context: ExecutionContext): string {
  if (!template) return ""

  // Replace {{variable}} patterns with values from context
  return template.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
    const trimmedVar = variable.trim()

    // Handle nested property access like {{outputs.node1.text}}
    const value = getNestedValue(context, trimmedVar)

    if (value === undefined || value === null) {
      return match // Keep original if not found
    }

    return typeof value === "string" ? value : JSON.stringify(value)
  })
}

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined
  }, obj)
}
