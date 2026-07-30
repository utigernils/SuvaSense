import type { ParsedMessage, SensorPayload, SelftestResult } from "./types"

export function parseMessage(raw: string): ParsedMessage {
  try {
    const obj = JSON.parse(raw)

    if (typeof obj !== "object" || obj === null) {
      return { type: "unknown" }
    }

    if (obj.type === "log") {
      return {
        type: "log",
        level: obj.level ?? "info",
        message: obj.message ?? "",
      }
    }

    if (obj.type === "pong") {
      return { type: "pong" }
    }

    if (obj.type === "response") {
      return {
        type: "response",
        action: obj.action,
        target: obj.target,
        value: obj.value,
        error: obj.error,
      }
    }

    if (obj.type === "selftest_result") {
      return {
        type: "selftest_result",
        ok: obj.ok,
        sensor: obj.sensor,
        message: obj.message,
        error: obj.error,
      }
    }

    if (
      obj.mpu6050 !== undefined ||
      obj.veml7700 !== undefined ||
      obj.bme680 !== undefined ||
      obj.system !== undefined
    ) {
      return {
        type: "sensor_data",
        data: obj as SensorPayload,
      }
    }

    return {
      type: "unknown",
      action: obj.action,
      target: obj.target,
      value: obj.value,
    }
  } catch {
    return { type: "unknown" }
  }
}

export function parseSelftestResult(parsed: ParsedMessage): SelftestResult | null {
  if (parsed.type !== "selftest_result" || !parsed.sensor) return null
  return {
    ok: parsed.ok ?? false,
    sensor: parsed.sensor,
    message: parsed.message,
    error: parsed.error,
  }
}

export function buildCommand(action: string, target?: string, value?: string): string {
  const cmd: Record<string, string> = { action }
  if (target !== undefined) cmd.target = target
  if (value !== undefined) cmd.value = value
  return JSON.stringify(cmd)
}

export const Commands = {
  ping: () => buildCommand("ping"),
  reboot: () => buildCommand("reboot"),
  bootloader: () => buildCommand("bootloader"),
  factoryReset: () => buildCommand("factory_reset"),
  setSerial: (serial: string) => buildCommand("set_serial", undefined, serial),
  get: (target: string) => buildCommand("get", target),
  set: (target: string, value: string) => buildCommand("set", target, value),
  selftest: (target: string) => buildCommand("selftest", target),
  streamStart: () => buildCommand("stream", "start"),
  streamStop: () => buildCommand("stream", "stop"),
} as const
