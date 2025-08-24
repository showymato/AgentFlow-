import * as nacl from "tweetnacl"
import * as naclUtil from "tweetnacl-util"
import type { TaskEnvelope } from "./types"

export class SecurityManager {
  private keyPair: nacl.SignKeyPair

  constructor() {
    // In production, this would load from secure storage
    this.keyPair = nacl.sign.keyPair()
  }

  signTask(task: TaskEnvelope): string {
    const taskData = {
      id: task.id,
      agentId: task.agentId,
      timestamp: task.timestamp,
      coordinatorId: task.coordinatorId,
    }

    const message = naclUtil.decodeUTF8(JSON.stringify(taskData))
    const signature = nacl.sign(message, this.keyPair.secretKey)

    return naclUtil.encodeBase64(signature)
  }

  verifyTaskSignature(task: TaskEnvelope): boolean {
    try {
      const taskData = {
        id: task.id,
        agentId: task.agentId,
        timestamp: task.timestamp,
        coordinatorId: task.coordinatorId,
      }

      const message = naclUtil.decodeUTF8(JSON.stringify(taskData))
      const signature = naclUtil.decodeBase64(task.signature)

      // In production, would verify against coordinator's public key
      const opened = nacl.sign.open(signature, this.keyPair.publicKey)

      return opened !== null
    } catch (error) {
      console.error("[SecurityManager] Error verifying signature:", error)
      return false
    }
  }

  getPublicKey(): string {
    return naclUtil.encodeBase64(this.keyPair.publicKey)
  }
}
