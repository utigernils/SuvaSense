import { useState, useRef, useCallback, useEffect } from "react"
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
  const autoHookRef = useRef(autoHook)
  const autoHookIntervalRef = useRef<number | null>(null)
  const autoHookTimeoutRef = useRef<number | null>(null)
  const countdownIntervalRef = useRef<number | null>(null)
  const autoHookDeadlineRef = useRef(0)

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

  const stopAutoHookAttempt = useCallback((resetConnectionState = true) => {
    if (autoHookIntervalRef.current !== null) {
      window.clearInterval(autoHookIntervalRef.current)
      autoHookIntervalRef.current = null
    }

    if (autoHookTimeoutRef.current !== null) {
      window.clearTimeout(autoHookTimeoutRef.current)
      autoHookTimeoutRef.current = null
    }

    if (countdownIntervalRef.current !== null) {
      window.clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }

    autoHookDeadlineRef.current = 0
    setCountdown(0)

    if (resetConnectionState) {
      setConnectionState((prev) => (prev === "hooking_bootloader" ? "connected" : prev))
    }
  }, [])

  const sendRawCommand = useCallback(async (raw: string) => {
    addMessage("tx", raw)

    if (!connRef.current) return

    try {
      await connRef.current.send(raw)
    } catch {
      setConnectionState("disconnected")
      stopAutoHookAttempt(false)
    }
  }, [addMessage, stopAutoHookAttempt])

  const startAutoHookAttempt = useCallback(() => {
    if (!autoHookRef.current || !connRef.current) return

    stopAutoHookAttempt(false)

    const durationMs = 5000
    const intervalMs = 180
    autoHookDeadlineRef.current = Date.now() + durationMs
    setConnectionState("hooking_bootloader")
    setCountdown(durationMs / 1000)

    void sendRawCommand('{"action":"bootloader"}')

    autoHookIntervalRef.current = window.setInterval(() => {
      if (!connRef.current) {
        stopAutoHookAttempt(false)
        return
      }

      if (Date.now() >= autoHookDeadlineRef.current) {
        stopAutoHookAttempt(true)
        return
      }

      void sendRawCommand('{"action":"bootloader"}')
    }, intervalMs)

    countdownIntervalRef.current = window.setInterval(() => {
      const remainingMs = Math.max(0, autoHookDeadlineRef.current - Date.now())
      setCountdown(remainingMs / 1000)
    }, 100)

    autoHookTimeoutRef.current = window.setTimeout(() => {
      stopAutoHookAttempt(true)
    }, durationMs + 50)
  }, [sendRawCommand, stopAutoHookAttempt])

  const resetTransientState = useCallback(() => {
    setPayload({})
    setSelftest({})
    setCountdown(0)
  }, [])

  const processIncoming = useCallback((line: string) => {
    const parsed = addMessage("rx", line)

    if (parsed.type === "log" && parsed.message) {
      if (parsed.message.includes("Waiting 5s for bootloader trigger")) {
        startAutoHookAttempt()
      } else if (parsed.message.includes("Bootloader mode active")) {
        stopAutoHookAttempt(true)
        setDeviceState(DeviceState.BOOTLOADER)
      } else if (parsed.message.includes("Runtime started")) {
        stopAutoHookAttempt(true)
        setDeviceState(DeviceState.RUNNING)
      } else if (parsed.message.includes("Factory mode")) {
        stopAutoHookAttempt(true)
        setDeviceState(DeviceState.FACTORY)
      } else if (parsed.message.includes("Rebooting")) {
        resetTransientState()
        setDeviceState(DeviceState.RUNNING)
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
  }, [addMessage, resetTransientState, startAutoHookAttempt, stopAutoHookAttempt])

  const connect = useCallback(async () => {
    try {
      setConnectionState("connecting")

      if (connRef.current) {
        await connRef.current.disconnect()
      }

      const conn = new SerialConnection()
      conn.onMessage = processIncoming

      conn.onDisconnect = () => {
        stopAutoHookAttempt(false)
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
      stopAutoHookAttempt(false)
    }
  }, [processIncoming, stopAutoHookAttempt])

  const disconnect = useCallback(async () => {
    stopAutoHookAttempt(false)
    if (connRef.current) {
      await connRef.current.disconnect()
      connRef.current = null
    }
    setConnectionState("disconnected")
  }, [stopAutoHookAttempt])

  const sendCommand = useCallback(async (raw: string) => {
    if (raw.includes('"action":"bootloader"')) {
      stopAutoHookAttempt(true)
    }
    await sendRawCommand(raw)
  }, [sendRawCommand, stopAutoHookAttempt])

  useEffect(() => {
    autoHookRef.current = autoHook
  }, [autoHook])

  useEffect(() => {
    if (!connRef.current) return
    connRef.current.onMessage = processIncoming
    connRef.current.onDisconnect = () => {
      stopAutoHookAttempt(false)
      setConnectionState("disconnected")
      setDeviceState(DeviceState.RUNNING)
    }
  }, [processIncoming, stopAutoHookAttempt])

  useEffect(() => {
    if (!autoHook) {
      stopAutoHookAttempt(true)
    }
  }, [autoHook, stopAutoHookAttempt])

  useEffect(() => {
    return () => {
      stopAutoHookAttempt(false)
    }
  }, [stopAutoHookAttempt])

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
    resetTransientState,
  }
}
