import { SensorCard } from "@/components/SensorCard";
import { SerialLog } from "@/components/SerialLog";
import { DataDrawer } from "@/components/DataDrawer";
import type {
  ConnectionState,
  DeviceState,
  SensorPayload,
  SelftestState,
  SerialMessage,
  MPU6050Data,
  VEML7700Data,
  BME680Data,
  SystemTelemetry,
} from "@/lib/types";
import { Wind, Rotate3d, Sun, Cpu } from "lucide-react";

interface OverviewProps {
  connectionState: ConnectionState;
  deviceState: DeviceState;
  streaming: boolean;
  onStreamingChange: (v: boolean) => void;
  payload: SensorPayload;
  selftest: SelftestState;
  onSelftest: (sensor: string) => void;
  serialLogs: SerialMessage[];
  onSerialSend: (msg: string) => void;
  onSerialClear: () => void;
  streamData: SensorPayload[];
  onStreamDataClear: () => void;
}

function formatBME680(data: BME680Data) {
  return [
    { label: "Temp", value: data.temp.toFixed(1), unit: "°C" },
    { label: "Humidity", value: data.hum.toFixed(1), unit: "%" },
    { label: "Pressure", value: data.press.toFixed(1), unit: "hPa" },
    { label: "Gas", value: data.gas.toFixed(1), unit: "kΩ" },
  ];
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
  ];
}

function formatVEML7700(data: VEML7700Data) {
  return [
    { label: "Lux", value: data.lux.toFixed(1), unit: "lx" },
    { label: "White", value: data.white.toFixed(1), unit: "raw" },
  ];
}

function formatSystem(data: SystemTelemetry) {
  return [
    { label: "Uptime", value: String(data.uptime), unit: "s" },
    { label: "CPU Temp", value: data.cpu_temp.toFixed(1), unit: "°C" },
    { label: "Free Heap", value: String(data.free_heap), unit: "B" },
    { label: "RSSI", value: data.rssi?.toString() ?? "—", unit: "dBm" },
  ];
}

export function Overview({
  connectionState,
  deviceState,
  streaming,
  onStreamingChange,
  payload,
  selftest,
  onSelftest,
  serialLogs,
  onSerialSend,
  onSerialClear,
  streamData,
  onStreamDataClear,
}: OverviewProps) {
  const bootloaderActive = deviceState === "bootloader";
  const controlsDisabled = !bootloaderActive || streaming;

  const noDataReason =
    connectionState !== "connected"
      ? "No device connected over serial."
      : !bootloaderActive
        ? "Telemetry is only available in bootloader stream mode."
        : !streaming
          ? "Streaming is stopped. Start stream in the Data Stream panel."
          : "Waiting for the first sensor frame from the device.";

  return (
    <div className="flex h-full flex-1 min-h-0 flex-col">
      <div className="flex-1 min-h-0 p-4 pb-3">
        <div className="grid h-full min-h-0 grid-cols-2 grid-rows-2 gap-5">
          <SensorCard
            title="System"
            icon={<Cpu className="h-4 w-4" />}
            description="ESP32 system telemetry: uptime, CPU temperature, free heap memory, and WiFi signal strength."
            values={payload.system ? formatSystem(payload.system) : []}
            noDataReason={noDataReason}
            selftestResult={selftest.esp32}
            onSelftest={() => onSelftest("esp32")}
            disabled={controlsDisabled}
          />
          <SensorCard
            title="BME680"
            icon={<Wind className="h-4 w-4" />}
            i2cAddress="0x77"
            description="Temperature, humidity, pressure, and gas sensor. Connected via I2C at address 0x77."
            values={payload.bme680 ? formatBME680(payload.bme680) : []}
            noDataReason={noDataReason}
            selftestResult={selftest.bme680}
            onSelftest={() => onSelftest("bme680")}
            disabled={controlsDisabled}
          />
          <SensorCard
            title="VEML7700"
            icon={<Sun className="h-4 w-4" />}
            i2cAddress="0x10"
            description="Ambient light sensor. Connected via I2C at address 0x10."
            values={payload.veml7700 ? formatVEML7700(payload.veml7700) : []}
            noDataReason={noDataReason}
            selftestResult={selftest.veml7700}
            onSelftest={() => onSelftest("veml7700")}
            disabled={controlsDisabled}
          />
          <SensorCard
            title="MPU6050"
            icon={<Rotate3d className="h-4 w-4" />}
            i2cAddress="0x68"
            description="6-axis accelerometer and gyroscope. Connected via I2C at address 0x68."
            values={payload.mpu6050 ? formatMPU6050(payload.mpu6050) : []}
            noDataReason={noDataReason}
            selftestResult={selftest.mpu6050}
            onSelftest={() => onSelftest("mpu6050")}
            disabled={controlsDisabled}
          />
        </div>
      </div>

      <div className="mt-auto shrink-0 h-[34vh] min-h-[240px] max-h-[360px] px-4 pb-4 pt-1 grid grid-cols-2 gap-4 min-h-0">
        <div className="min-h-0">
          <SerialLog
            messages={serialLogs}
            disabled={streaming}
            onSend={onSerialSend}
            onClear={onSerialClear}
          />
        </div>
        <div className="min-h-0">
          <DataDrawer
            data={streamData}
            streaming={streaming}
            onStreamingChange={onStreamingChange}
            streamingDisabled={!bootloaderActive}
            onClear={onStreamDataClear}
          />
        </div>
      </div>
    </div>
  );
}
