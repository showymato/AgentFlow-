import * as si from "systeminformation"

export class ResourceMonitor {
  async getCurrentResources() {
    try {
      const [cpu, mem, graphics] = await Promise.all([si.cpu(), si.mem(), si.graphics()])

      const cpuLoad = await si.currentLoad()

      return {
        cpu: {
          cores: cpu.cores,
          usage: cpuLoad.currentLoad,
        },
        memory: {
          total: Math.round(mem.total / 1024 / 1024), // MB
          available: Math.round(mem.available / 1024 / 1024), // MB
        },
        gpu:
          graphics.controllers.length > 0
            ? {
                model: graphics.controllers[0].model || "Unknown",
                memory: graphics.controllers[0].memoryTotal || 0,
                available: true,
              }
            : undefined,
      }
    } catch (error) {
      console.error("[ResourceMonitor] Error getting system resources:", error)

      // Fallback to basic Node.js info
      const memUsage = process.memoryUsage()
      return {
        cpu: {
          cores: require("os").cpus().length,
          usage: 0,
        },
        memory: {
          total: Math.round(memUsage.heapTotal / 1024 / 1024),
          available: Math.round((memUsage.heapTotal - memUsage.heapUsed) / 1024 / 1024),
        },
      }
    }
  }

  async getSystemInfo() {
    try {
      const [system, osInfo, cpu] = await Promise.all([si.system(), si.osInfo(), si.cpu()])

      return {
        manufacturer: system.manufacturer,
        model: system.model,
        os: `${osInfo.distro} ${osInfo.release}`,
        arch: osInfo.arch,
        cpu: `${cpu.manufacturer} ${cpu.brand}`,
        cores: cpu.cores,
      }
    } catch (error) {
      console.error("[ResourceMonitor] Error getting system info:", error)
      return {
        manufacturer: "Unknown",
        model: "Unknown",
        os: process.platform,
        arch: process.arch,
        cpu: "Unknown",
        cores: require("os").cpus().length,
      }
    }
  }
}
