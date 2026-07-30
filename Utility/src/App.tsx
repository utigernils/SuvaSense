import { useState, useCallback, useEffect, useRef } from "react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Header } from "@/components/Header"
import { SubHeader } from "@/components/SubHeader"
import { Overview } from "@/components/Overview"
import { Settings } from "@/components/Settings"
import { useSerial } from "@/hooks/useSerial"
import { Commands } from "@/lib/protocol"
import { type DeviceSettings, type SensorPayload } from "@/lib/types"
import "./App.css"

type SettingValueKind = "string" | "number" | "boolean"

interface SettingTarget {
  target: string
  section: keyof DeviceSettings
  key: string
  kind: SettingValueKind
}

const initialSettings: DeviceSettings = {
  wifi: {
    ssid: "",
    wifi_password: "",
    hostname: "",
  },
  mqtt: {
    broker: "",
    port: 1883,
    client_id: "",
    mqtt_username: "",
    mqtt_password: "",
    topic_prefix: "",
    keep_alive: 60,
  },
  sensors: {
    publish_interval: 10000,
    mpu_en: true,
    veml_en: true,
    bme_en: true,
    sys_telem: true,
  },
  led: {
    brightness: 32,
    user_led: true,
    sys_led: true,
  },
  system: {
    serial_num: "",
    boot_count: 0,
    factory_done: false,
  },
}

const SETTING_TARGETS: SettingTarget[] = [
  { target: "ssid", section: "wifi", key: "ssid", kind: "string" },
  { target: "wifi_password", section: "wifi", key: "wifi_password", kind: "string" },
  { target: "hostname", section: "wifi", key: "hostname", kind: "string" },

  { target: "broker", section: "mqtt", key: "broker", kind: "string" },
  { target: "port", section: "mqtt", key: "port", kind: "number" },
  { target: "client_id", section: "mqtt", key: "client_id", kind: "string" },
  { target: "mqtt_username", section: "mqtt", key: "mqtt_username", kind: "string" },
  { target: "mqtt_password", section: "mqtt", key: "mqtt_password", kind: "string" },
  { target: "topic_prefix", section: "mqtt", key: "topic_prefix", kind: "string" },
  { target: "keep_alive", section: "mqtt", key: "keep_alive", kind: "number" },

  { target: "publish_interval", section: "sensors", key: "publish_interval", kind: "number" },
  { target: "mpu_en", section: "sensors", key: "mpu_en", kind: "boolean" },
  { target: "veml_en", section: "sensors", key: "veml_en", kind: "boolean" },
  { target: "bme_en", section: "sensors", key: "bme_en", kind: "boolean" },
  { target: "sys_telem", section: "sensors", key: "sys_telem", kind: "boolean" },

  { target: "brightness", section: "led", key: "brightness", kind: "number" },
  { target: "user_led", section: "led", key: "user_led", kind: "boolean" },
  { target: "sys_led", section: "led", key: "sys_led", kind: "boolean" },

  { target: "serial_num", section: "system", key: "serial_num", kind: "string" },
  { target: "boot_count", section: "system", key: "boot_count", kind: "number" },
  { target: "factory_done", section: "system", key: "factory_done", kind: "boolean" },
]

const TARGET_TO_SETTING = new Map(SETTING_TARGETS.map((t) => [t.target, t]))

function coerceSettingValue(raw: unknown, kind: SettingValueKind): string | number | boolean | undefined {
  if (kind === "string") {
    return raw == null ? "" : String(raw)
  }

  if (kind === "number") {
    if (typeof raw === "number" && Number.isFinite(raw)) return raw
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  if (typeof raw === "boolean") return raw
  if (typeof raw === "number") {
    if (raw === 1) return true
    if (raw === 0) return false
    return undefined
  }

  const normalized = String(raw).trim().toLowerCase()
  if (normalized === "true" || normalized === "1") return true
  if (normalized === "false" || normalized === "0") return false
  return undefined
}

function App() {
  const {
    connectionState,
    deviceState,
    messages,
    payload,
    selftest,
    autoHook,
    countdown,
    connect,
    disconnect,
    sendCommand,
    setAutoHook,
    setDeviceState,
    setMessages,
  } = useSerial()

  const [page, setPage] = useState<"overview" | "settings">("overview")
  const [streaming, setStreaming] = useState(false)
  const [settings, setSettings] = useState<DeviceSettings>(initialSettings)
  const [streamData, setStreamData] = useState<SensorPayload[]>([])
  const processedMessageIndexRef = useRef(0)

  useEffect(() => {
    if (streaming && connectionState === "connected") {
      setStreamData((prev) => [...prev, payload].slice(-100))
    }
  }, [payload, streaming, connectionState])

  const handleConnect = useCallback(() => {
    processedMessageIndexRef.current = 0
    setMessages([])
    setSettings(initialSettings)
    connect()
  }, [connect, setMessages])

  const handleDisconnect = useCallback(() => {
    setStreaming(false)
    processedMessageIndexRef.current = 0
    setSettings(initialSettings)
    disconnect()
  }, [disconnect])

  const handleSendBootloader = useCallback(() => {
    sendCommand(Commands.bootloader())
  }, [sendCommand])

  const handleReboot = useCallback(() => {
    sendCommand(Commands.reboot())
  }, [sendCommand])

  const handleSetSerial = useCallback(
    (serial: string) => {
      sendCommand(Commands.setSerial(serial))
      setSettings((prev) => ({
        ...prev,
        system: { ...prev.system, serial_num: serial, factory_done: true },
      }))
      setTimeout(() => setDeviceState("bootloader"), 1500)
    },
    [sendCommand, setDeviceState]
  )

  const handleSelftest = useCallback(
    (sensor: string) => {
      sendCommand(Commands.selftest(sensor))
    },
    [sendCommand]
  )

  const handleSerialSend = useCallback(
    (msg: string) => {
      sendCommand(msg)
    },
    [sendCommand]
  )

  const handleStreamingChange = useCallback(
    (v: boolean) => {
      setStreaming(v)
      if (v) {
        setStreamData([])
        sendCommand(Commands.streamStart())
      } else {
        sendCommand(Commands.streamStop())
      }
    },
    [sendCommand]
  )

  const handleSettingChange = useCallback(
    (section: keyof DeviceSettings, key: string, value: string | number | boolean) => {
      setSettings((prev) => {
        const sectionData = { ...prev[section] } as Record<string, unknown>
        sectionData[key] = value
        return { ...prev, [section]: sectionData }
      })
      sendCommand(Commands.set(key, String(value)))
    },
    [sendCommand]
  )

  const handleFactoryReset = useCallback(() => {
    sendCommand(Commands.factoryReset())
  }, [sendCommand])

  const requestSettingsFromDevice = useCallback(() => {
    if (connectionState !== "connected") return
    for (const { target } of SETTING_TARGETS) {
      sendCommand(Commands.get(target))
    }
  }, [connectionState, sendCommand])

  useEffect(() => {
    if (page === "settings") {
      requestSettingsFromDevice()
    }
  }, [page, requestSettingsFromDevice])

  useEffect(() => {
    requestSettingsFromDevice()
  }, [connectionState, deviceState, requestSettingsFromDevice])

  useEffect(() => {
    if (messages.length < processedMessageIndexRef.current) {
      processedMessageIndexRef.current = 0
    }

    for (let i = processedMessageIndexRef.current; i < messages.length; i += 1) {
      const msg = messages[i]
      if (msg.direction !== "rx") continue

      const parsed = msg.parsed
      if (
        parsed?.type !== "response" ||
        parsed.action !== "get" ||
        !parsed.target ||
        parsed.value === undefined
      ) {
        continue
      }

      const target = TARGET_TO_SETTING.get(parsed.target)
      if (!target) continue

      const coercedValue = coerceSettingValue(parsed.value, target.kind)
      if (coercedValue === undefined) continue

      setSettings((prev) => {
        const sectionData = { ...prev[target.section] } as Record<string, unknown>
        sectionData[target.key] = coercedValue
        return { ...prev, [target.section]: sectionData }
      })
    }

    processedMessageIndexRef.current = messages.length
  }, [messages])

  return (
    <TooltipProvider delay={0}>
      <div className="h-screen overflow-hidden flex flex-col">
        <Header
          deviceState={deviceState}
          connectionState={connectionState}
          autoHook={autoHook}
          onAutoHookChange={setAutoHook}
          onSendBootloader={handleSendBootloader}
          onReboot={handleReboot}
          onSetSerial={handleSetSerial}
          countdown={countdown}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />
        <Tabs
          value={page}
          onValueChange={(v) => setPage(v as "overview" | "settings")}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          <SubHeader systemInfo={settings.system} page={page} />
          <TabsContent
            value="overview"
            className="flex-1 min-h-0 data-[state=active]:flex data-[state=active]:flex-col m-0 p-0"
          >
            <Overview
              connectionState={connectionState}
              deviceState={deviceState}
              streaming={streaming}
              onStreamingChange={handleStreamingChange}
              payload={payload}
              selftest={selftest}
              onSelftest={handleSelftest}
              serialLogs={messages}
              onSerialSend={handleSerialSend}
              streamData={streamData}
            />
          </TabsContent>
          <TabsContent value="settings" className="flex-1 overflow-auto m-0 p-0">
            <Settings
              settings={settings}
              connectionState={connectionState}
              deviceState={deviceState}
              onSettingChange={handleSettingChange}
              onFactoryReset={handleFactoryReset}
            />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  )
}

export default App
