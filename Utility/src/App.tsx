import { useState, useCallback, useEffect } from "react"
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

  useEffect(() => {
    if (streaming && connectionState === "connected") {
      setStreamData((prev) => [...prev, payload].slice(-100))
    }
  }, [payload, streaming, connectionState])

  const handleConnect = useCallback(() => {
    setMessages([])
    connect()
  }, [connect, setMessages])

  const handleDisconnect = useCallback(() => {
    setStreaming(false)
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
