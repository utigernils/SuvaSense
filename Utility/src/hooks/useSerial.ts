import { useState, useRef, useCallback } from "react"
import { SerialConnection } from "@/lib/serial"
import { parseMessage, parseSelftestResult } from "@/lib/protocol"
import { DeviceState, type ConnectionState, type SerialMessage, type SensorPayload, type SelftestState } from "@/lib/types"

export function useSerial() {
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected")
  const [deviceState, setDeviceState] = useState<DeviceState>(DeviceState.RUNNING)
  const [messages, setMessages] = useState<SerialMessage[]>([])
  const [payload, setPayload] = useState<SensorPayload>({})
  const [selftest, setSelftest] = useState<SelftestState>({})
  const [autoHook, setAutoHook] = useState(true)
  const [countdown, setCountdown] = useState(0)

  const connRef = useRef<SerialConnection | null>(null)

  const addMessage = useCallback((direction: "tx" | "rx", raw: string) => {
    const parsed = direction === "rx" ? parseMessage(raw) : (() => {
      try {
        const obj = JSON.parse(raw)
        return { type: "unknown" as const, ...obj }
      } catch {
        return { type: "unknown" as const }
      }
    })()

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        direction,
        raw,
        parsed,
      },
    ])

    return parsed
  }, [])

  const processIncoming = useCallback((line: string) => {
    const parsed = addMessage("rx", line)

    if (parsed.type === "log" && parsed.message) {
      if (parsed.message.includes("Bootloader mode active")) {
        setDeviceState(DeviceState.BOOTLOADER)
      } else if (parsed.message.includes("Runtime started")) {
        setDeviceState(DeviceState.RUNNING)
      } else if (parsed.message.includes("Factory mode")) {
        setDeviceState(DeviceState.FACTORY)
      }
    }

    if (parsed.type === "sensor_data" && parsed.data) {
      setPayload(parsed.data)
    }

    if (parsed.type === "selftest_result") {
      const result = parseSelftestResult(parsed)
      if (result) {
        setSelftest((prev) => {
          const sensorKey = result.sensor.toLowerCase()
          const keyMap: Record<string, keyof SelftestState> = {
            bme680: "bme680",
            mpu6050: "mpu6050",
            veml7700: "veml7700",
            esp32system: "esp32",
            led: "led",
          }
          const key = keyMap[sensorKey] ?? (sensorKey as keyof SelftestState)
          return { ...prev, [key]: result }
        })
      }
    }

    if (parsed.type === "pong") {
      setDeviceState((prev) => prev)
    }
  }, [addMessage])

  const connect = useCallback(async () => {
    try {
      setConnectionState("connecting")

      if (connRef.current) {
        await connRef.current.disconnect()
      }

      const conn = new SerialConnection()
      conn.onMessage = processIncoming

      conn.onDisconnect = () => {
        setConnectionState("disconnected")
        setDeviceState(DeviceState.RUNNING)
      }

      await conn.connect(115200)
      connRef.current = conn
      setConnectionState("connected")
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Serial connection failed:", err)
      }
      setConnectionState("disconnected")
    }
  }, [processIncoming])

  const disconnect = useCallback(async () => {
    if (connRef.current) {
      await connRef.current.disconnect()
      connRef.current = null
    }
    setConnectionState("disconnected")
  }, [])

  const sendCommand = useCallback(async (raw: string) => {
    addMessage("tx", raw)
    if (connRef.current && connectionState === "connected") {
      try {
        await connRef.current.send(raw)
      } catch {
        setConnectionState("disconnected")
      }
    }
  }, [addMessage, connectionState])

  const isConnected = connectionState === "connected"

  return {
    connectionState,
    deviceState,
    messages,
    payload,
    selftest,
    autoHook,
    countdown,
    isConnected,
    connect,
    disconnect,
    sendCommand,
    setAutoHook,
    setCountdown,
    setDeviceState,
    setMessages,
  }
}
