import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { SensorCard } from "@/components/SensorCard"
import { SerialLog } from "@/components/SerialLog"
import { DataDrawer } from "@/components/DataDrawer"
import type {
  DeviceState,
  SensorPayload,
  SelftestState,
  SerialMessage,
  MPU6050Data,
  VEML7700Data,
  BME680Data,
  SystemTelemetry,
} from "@/lib/types"
import {
  Thermometer,
  Gauge,
  Sun,
  Cpu,
  Table2,
} from "lucide-react"

interface OverviewProps {
  deviceState: DeviceState
  streaming: boolean
  onStreamingChange: (v: boolean) => void
  payload: SensorPayload
  selftest: SelftestState
  onSelftest: (sensor: string) => void
  serialLogs: SerialMessage[]
  onSerialSend: (msg: string) => void
  streamData: SensorPayload[]
}

function formatBME680(data: BME680Data) {
  return [
    { label: "Temp", value: data.temp.toFixed(1), unit: "°C" },
    { label: "Humidity", value: data.hum.toFixed(1), unit: "%" },
    { label: "Pressure", value: data.press.toFixed(1), unit: "hPa" },
    { label: "Gas", value: data.gas.toFixed(1), unit: "kΩ" },
  ]
}

function formatMPU6050(data: MPU6050Data) {
  return [
    { label: "Acc X", value: data.acc.x.toFixed(2), unit: "m/s²" },
    { label: "Acc Y", value: data.acc.y.toFixed(2), unit: "m/s²" },
    { label: "Acc Z", value: data.acc.z.toFixed(2), unit: "m/s²" },
    { label: "Gyro X", value: data.gyro.x.toFixed(1), unit: "°/s" },
    { label: "Gyro Y", value: data.gyro.y.toFixed(1), unit: "°/s" },
    { label: "Gyro Z", value: data.gyro.z.toFixed(1), unit: "°/s" },
    { label: "Ang X", value: data.ang.x.toFixed(1), unit: "°" },
    { label: "Ang Y", value: data.ang.y.toFixed(1), unit: "°" },
    { label: "Ang Z", value: data.ang.z.toFixed(1), unit: "°" },
  ]
}

function formatVEML7700(data: VEML7700Data) {
  return [
    { label: "Lux", value: data.lux.toFixed(1), unit: "lx" },
    { label: "White", value: data.white.toFixed(1), unit: "raw" },
  ]
}

function formatSystem(data: SystemTelemetry) {
  return [
    { label: "Uptime", value: String(data.uptime), unit: "s" },
    { label: "CPU Temp", value: data.cpu_temp.toFixed(1), unit: "°C" },
    { label: "Free Heap", value: String(data.free_heap), unit: "B" },
    { label: "RSSI", value: data.rssi?.toString() ?? "—", unit: "dBm" },
  ]
}

export function Overview({
  deviceState,
  streaming,
  onStreamingChange,
  payload,
  selftest,
  onSelftest,
  serialLogs,
  onSerialSend,
  streamData,
}: OverviewProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const bootloaderActive = deviceState === "bootloader"
  const controlsDisabled = !bootloaderActive || streaming

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex gap-4 p-4 min-h-0">
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="streaming"
                  checked={streaming}
                  onCheckedChange={onStreamingChange}
                  disabled={!bootloaderActive}
                />
                <Label htmlFor="streaming" className="text-xs font-medium cursor-pointer">
                  Streaming
                </Label>
              </div>
              {streaming && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDrawerOpen(true)}
                  className="text-xs gap-1.5 h-7"
                >
                  <Table2 className="h-3.5 w-3.5" />
                  Data Table
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SensorCard
              title="BME680"
              icon={<Thermometer className="h-4 w-4 text-orange-400" />}
              i2cAddress="0x77"
              description="Temperature, humidity, pressure, and gas sensor. Connected via I2C at address 0x77."
              values={payload.bme680 ? formatBME680(payload.bme680) : []}
              selftestResult={selftest.bme680}
              onSelftest={() => onSelftest("bme680")}
              disabled={controlsDisabled}
            />
            <SensorCard
              title="MPU6050"
              icon={<Gauge className="h-4 w-4 text-purple-400" />}
              i2cAddress="0x68"
              description="6-axis accelerometer and gyroscope. Connected via I2C at address 0x68."
              values={payload.mpu6050 ? formatMPU6050(payload.mpu6050) : []}
              selftestResult={selftest.mpu6050}
              onSelftest={() => onSelftest("mpu6050")}
              disabled={controlsDisabled}
            />
            <SensorCard
              title="VEML7700"
              icon={<Sun className="h-4 w-4 text-yellow-400" />}
              i2cAddress="0x10"
              description="Ambient light sensor. Connected via I2C at address 0x10."
              values={payload.veml7700 ? formatVEML7700(payload.veml7700) : []}
              selftestResult={selftest.veml7700}
              onSelftest={() => onSelftest("veml7700")}
              disabled={controlsDisabled}
            />
            <SensorCard
              title="System"
              icon={<Cpu className="h-4 w-4 text-blue-400" />}
              description="ESP32 system telemetry: uptime, CPU temperature, free heap memory, and WiFi signal strength."
              values={payload.system ? formatSystem(payload.system) : []}
              selftestResult={selftest.esp32}
              onSelftest={() => onSelftest("esp32")}
              disabled={controlsDisabled}
            />
          </div>
        </div>

        <div className="w-[420px] shrink-0 flex flex-col min-h-0">
          <SerialLog
            messages={serialLogs}
            disabled={streaming}
            onSend={onSerialSend}
          />
        </div>
      </div>

      <DataDrawer open={drawerOpen} onOpenChange={setDrawerOpen} data={streamData} />
    </div>
  )
}
