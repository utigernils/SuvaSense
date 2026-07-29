import { useState, useCallback } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Header } from "@/components/Header";
import { SubHeader } from "@/components/SubHeader";
import { Overview } from "@/components/Overview";
import { Settings } from "@/components/Settings";
import {
  DeviceState,
  type ConnectionState,
  type SensorPayload,
  type SelftestState,
  type SerialMessage,
  type DeviceSettings,
} from "@/lib/types";
import {
  mockPayload,
  mockSelftestBME680,
  mockSelftestMPU6050,
  mockSelftestVEML7700,
  mockSelftestESP32,
  mockSelftestLED,
  mockSettings,
  mockSerialLogs,
  mockStreamData,
} from "@/lib/mock";
import "./App.css";

function App() {
  const [deviceState, setDeviceState] = useState<DeviceState>(
    DeviceState.BOOTLOADER,
  );
  const [connectionState] = useState<ConnectionState>("connected");
  const [autoHook, setAutoHook] = useState(true);
  const [countdown] = useState(0);
  const [page, setPage] = useState<"overview" | "settings">("overview");
  const [streaming, setStreaming] = useState(false);
  const [payload] = useState<SensorPayload>(mockPayload);
  const [selftest, setSelftest] = useState<SelftestState>({});
  const [serialLogs, setSerialLogs] = useState<SerialMessage[]>(mockSerialLogs);
  const [streamData] = useState<SensorPayload[]>(mockStreamData);
  const [settings, setSettings] = useState<DeviceSettings>(mockSettings);

  const handleSendBootloader = useCallback(() => {
    setSerialLogs((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        direction: "tx",
        raw: '{"action":"bootloader"}',
        parsed: { type: "unknown", action: "bootloader" },
      },
    ]);
    setTimeout(() => {
      setDeviceState(DeviceState.BOOTLOADER);
      setSerialLogs((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          direction: "rx",
          raw: '{"type":"log","level":"info","message":"Bootloader mode active"}',
          parsed: {
            type: "log",
            level: "info",
            message: "Bootloader mode active",
          },
        },
      ]);
    }, 300);
  }, []);

  const handleReboot = useCallback(() => {
    setSerialLogs((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        direction: "tx",
        raw: '{"action":"reboot"}',
        parsed: { type: "unknown", action: "reboot" },
      },
    ]);
  }, []);

  const handleSetSerial = useCallback((serial: string) => {
    setSerialLogs((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        direction: "tx",
        raw: JSON.stringify({ action: "set_serial", value: serial }),
        parsed: { type: "unknown", action: "set_serial" },
      },
    ]);
    setSettings((prev) => ({
      ...prev,
      system: { ...prev.system, serial_num: serial, factory_done: true },
    }));
    setDeviceState(DeviceState.BOOTLOADER);
  }, []);

  const handleSelftest = useCallback((sensor: string) => {
    const selftestMap: Record<string, { id: string; result: () => void }> = {
      bme680: {
        id: crypto.randomUUID(),
        result: () =>
          setSelftest((prev) => ({ ...prev, bme680: mockSelftestBME680 })),
      },
      mpu6050: {
        id: crypto.randomUUID(),
        result: () =>
          setSelftest((prev) => ({ ...prev, mpu6050: mockSelftestMPU6050 })),
      },
      veml7700: {
        id: crypto.randomUUID(),
        result: () =>
          setSelftest((prev) => ({ ...prev, veml7700: mockSelftestVEML7700 })),
      },
      esp32: {
        id: crypto.randomUUID(),
        result: () =>
          setSelftest((prev) => ({ ...prev, esp32: mockSelftestESP32 })),
      },
      led: {
        id: crypto.randomUUID(),
        result: () =>
          setSelftest((prev) => ({ ...prev, led: mockSelftestLED })),
      },
    };

    const entry = selftestMap[sensor];
    if (!entry) return;

    setSerialLogs((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        direction: "tx",
        raw: JSON.stringify({ action: "selftest", target: sensor }),
        parsed: { type: "unknown", action: "selftest", target: sensor },
      },
    ]);

    setTimeout(() => {
      setSerialLogs((prev) => [
        ...prev,
        {
          id: entry.id,
          timestamp: Date.now(),
          direction: "rx",
          raw: JSON.stringify({
            type: "log",
            level: "info",
            message: `Selftest triggered for: ${sensor}`,
          }),
          parsed: {
            type: "log",
            level: "info",
            message: `Selftest triggered for: ${sensor}`,
          },
        },
      ]);
      entry.result();
    }, 500);
  }, []);

  const handleSerialSend = useCallback((msg: string) => {
    let parsed = undefined;
    try {
      const obj = JSON.parse(msg);
      parsed = { type: "unknown" as const, ...obj };
    } catch {
      parsed = undefined;
    }

    setSerialLogs((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        direction: "tx",
        raw: msg,
        parsed,
      },
    ]);
  }, []);

  const handleStreamingChange = useCallback((v: boolean) => {
    setStreaming(v);
    if (v) {
      setSerialLogs((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          direction: "tx",
          raw: '{"action":"stream","target":"start"}',
          parsed: { type: "unknown", action: "stream", target: "start" },
        },
      ]);
      setTimeout(() => {
        setSerialLogs((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            direction: "rx",
            raw: '{"type":"log","level":"info","message":"Streaming started"}',
            parsed: {
              type: "log",
              level: "info",
              message: "Streaming started",
            },
          },
        ]);
      }, 300);
    } else {
      setSerialLogs((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          direction: "tx",
          raw: '{"action":"stream","target":"stop"}',
          parsed: { type: "unknown", action: "stream", target: "stop" },
        },
      ]);
      setTimeout(() => {
        setSerialLogs((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            direction: "rx",
            raw: '{"type":"log","level":"info","message":"Streaming stopped"}',
            parsed: {
              type: "log",
              level: "info",
              message: "Streaming stopped",
            },
          },
        ]);
      }, 300);
    }
  }, []);

  const handleSettingChange = useCallback(
    (
      section: keyof DeviceSettings,
      key: string,
      value: string | number | boolean,
    ) => {
      setSettings((prev) => {
        const sectionData = { ...prev[section] } as Record<string, unknown>;
        sectionData[key] = value;
        return { ...prev, [section]: sectionData };
      });

      const target = key;
      setSerialLogs((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          direction: "tx",
          raw: JSON.stringify({ action: "set", target, value: String(value) }),
          parsed: { type: "unknown", action: "set", target },
        },
      ]);

      setTimeout(() => {
        const responseValue = target.includes("password")
          ? "***"
          : String(value);
        setSerialLogs((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            direction: "rx",
            raw: JSON.stringify({
              type: "response",
              action: "set",
              target,
              value: responseValue,
            }),
            parsed: {
              type: "response",
              action: "set",
              target,
              value: responseValue,
            },
          },
        ]);
      }, 200);
    },
    [],
  );

  const handleFactoryReset = useCallback(() => {
    setSerialLogs((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        direction: "tx",
        raw: '{"action":"factory_reset"}',
        parsed: { type: "unknown", action: "factory_reset" },
      },
    ]);
    setTimeout(() => {
      setSerialLogs((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          direction: "rx",
          raw: '{"type":"log","level":"info","message":"Factory reset complete. Rebooting..."}',
          parsed: {
            type: "log",
            level: "info",
            message: "Factory reset complete. Rebooting...",
          },
        },
      ]);
    }, 500);
  }, []);

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
              deviceState={deviceState}
              streaming={streaming}
              onStreamingChange={handleStreamingChange}
              payload={payload}
              selftest={selftest}
              onSelftest={handleSelftest}
              serialLogs={serialLogs}
              onSerialSend={handleSerialSend}
              streamData={streamData}
            />
          </TabsContent>
          <TabsContent
            value="settings"
            className="flex-1 overflow-auto m-0 p-0"
          >
            <Settings
              settings={settings}
              deviceState={deviceState}
              onSettingChange={handleSettingChange}
              onFactoryReset={handleFactoryReset}
            />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

export default App;
