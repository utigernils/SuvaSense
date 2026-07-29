import {
  type DeviceSettings,
  type MPU6050Data,
  type VEML7700Data,
  type BME680Data,
  type SystemTelemetry,
  type SelftestResult,
  type SerialMessage,
  type SensorPayload,
} from "./types"

export const mockMPU6050: MPU6050Data = {
  acc: { x: 0.12, y: -0.03, z: 9.81 },
  gyro: { x: 0.1, y: 0.2, z: -0.1 },
  ang: { x: 1.5, y: -0.8, z: 0.3 },
}

export const mockVEML7700: VEML7700Data = {
  lux: 245.3,
  white: 198.7,
}

export const mockBME680: BME680Data = {
  temp: 23.5,
  hum: 54.2,
  press: 1013.2,
  gas: 145.6,
}

export const mockSystem: SystemTelemetry = {
  uptime: 120,
  cpu_temp: 42.1,
  free_heap: 215000,
  rssi: -55,
}

export const mockPayload: SensorPayload = {
  mpu6050: mockMPU6050,
  veml7700: mockVEML7700,
  bme680: mockBME680,
  system: mockSystem,
}

export const mockSelftestBME680: SelftestResult = {
  ok: true,
  sensor: "BME680",
  message: "OK - T=23.5°C H=54.2% P=1013.2hPa",
}

export const mockSelftestMPU6050: SelftestResult = {
  ok: true,
  sensor: "MPU6050",
  message: "OK - acc OK, gyro OK",
}

export const mockSelftestVEML7700: SelftestResult = {
  ok: true,
  sensor: "VEML7700",
  message: "OK - lux=245.3",
}

export const mockSelftestESP32: SelftestResult = {
  ok: true,
  sensor: "ESP32System",
  message: "OK - heap=215000, flash=16MB, temp=42.1°C",
}

export const mockSelftestLED: SelftestResult = {
  ok: true,
  sensor: "LED",
  message: "OK - both LEDs responding",
}

export const mockSettings: DeviceSettings = {
  wifi: {
    ssid: "MyWiFi",
    wifi_password: "secret123",
    hostname: "suva-SN12345",
  },
  mqtt: {
    broker: "192.168.1.100",
    port: 1883,
    client_id: "SN12345",
    mqtt_username: "",
    mqtt_password: "",
    topic_prefix: "suva/SN12345/",
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
    serial_num: "SN12345",
    boot_count: 42,
    factory_done: true,
  },
}

export const mockSerialLogs: SerialMessage[] = [
  {
    id: "1",
    timestamp: Date.now() - 120000,
    direction: "rx",
    raw: '{"type":"log","level":"info","message":"Setup complete"}',
    parsed: { type: "log", level: "info", message: "Setup complete" },
  },
  {
    id: "2",
    timestamp: Date.now() - 119000,
    direction: "rx",
    raw: '{"type":"log","level":"info","message":"Bootloader mode active"}',
    parsed: { type: "log", level: "info", message: "Bootloader mode active" },
  },
  {
    id: "3",
    timestamp: Date.now() - 100000,
    direction: "tx",
    raw: '{"action":"get","target":"ssid"}',
    parsed: { type: "unknown", action: "get", target: "ssid" },
  },
  {
    id: "4",
    timestamp: Date.now() - 99000,
    direction: "rx",
    raw: '{"type":"response","action":"get","target":"ssid","value":"MyWiFi"}',
    parsed: { type: "response", action: "get", target: "ssid", value: "MyWiFi" },
  },
  {
    id: "5",
    timestamp: Date.now() - 50000,
    direction: "tx",
    raw: '{"action":"selftest","target":"bme680"}',
    parsed: { type: "unknown", action: "selftest", target: "bme680" },
  },
  {
    id: "6",
    timestamp: Date.now() - 49000,
    direction: "rx",
    raw: '{"type":"log","level":"info","message":"Selftest triggered for: bme680"}',
    parsed: { type: "log", level: "info", message: "Selftest triggered for: bme680" },
  },
  {
    id: "7",
    timestamp: Date.now() - 48000,
    direction: "rx",
    raw: '{"type":"selftest_result","ok":true,"sensor":"BME680","message":"OK - T=23.5°C H=54.2% P=1013.2hPa"}',
    parsed: { type: "selftest_result", ok: true, sensor: "BME680", message: "OK - T=23.5°C H=54.2% P=1013.2hPa" },
  },
  {
    id: "8",
    timestamp: Date.now() - 30000,
    direction: "tx",
    raw: '{"action":"stream","target":"start"}',
    parsed: { type: "unknown", action: "stream", target: "start" },
  },
  {
    id: "9",
    timestamp: Date.now() - 29000,
    direction: "rx",
    raw: '{"type":"log","level":"info","message":"Streaming started"}',
    parsed: { type: "log", level: "info", message: "Streaming started" },
  },
  {
    id: "10",
    timestamp: Date.now() - 25000,
    direction: "rx",
    raw: '{"mpu6050":{"acc":{"x":0.12,"y":-0.03,"z":9.81},"gyro":{"x":0.1,"y":0.2,"z":-0.1},"ang":{"x":1.5,"y":-0.8,"z":0.3}},"veml7700":{"lux":245.3,"white":198.7},"bme680":{"temp":23.5,"hum":54.2,"press":1013.2,"gas":145.6},"system":{"uptime":120,"cpu_temp":42.1,"free_heap":215000,"rssi":-55}}',
    parsed: { type: "sensor_data", data: mockPayload },
  },
  {
    id: "11",
    timestamp: Date.now() - 15000,
    direction: "rx",
    raw: '{"mpu6050":{"acc":{"x":0.11,"y":-0.04,"z":9.82},"gyro":{"x":0.1,"y":0.1,"z":-0.1},"ang":{"x":1.4,"y":-0.7,"z":0.4}},"veml7700":{"lux":243.8,"white":197.2},"bme680":{"temp":23.6,"hum":54.1,"press":1013.1,"gas":144.9},"system":{"uptime":130,"cpu_temp":42.3,"free_heap":214500,"rssi":-56}}',
    parsed: { type: "sensor_data" },
  },
  {
    id: "12",
    timestamp: Date.now() - 5000,
    direction: "tx",
    raw: '{"action":"ping"}',
    parsed: { type: "unknown", action: "ping" },
  },
  {
    id: "13",
    timestamp: Date.now() - 4000,
    direction: "rx",
    raw: '{"type":"pong"}',
    parsed: { type: "pong" },
  },
]

export const mockStreamData: SensorPayload[] = [
  mockPayload,
  {
    mpu6050: { acc: { x: 0.11, y: -0.04, z: 9.82 }, gyro: { x: 0.1, y: 0.1, z: -0.1 }, ang: { x: 1.4, y: -0.7, z: 0.4 } },
    veml7700: { lux: 243.8, white: 197.2 },
    bme680: { temp: 23.6, hum: 54.1, press: 1013.1, gas: 144.9 },
    system: { uptime: 130, cpu_temp: 42.3, free_heap: 214500, rssi: -56 },
  },
  {
    mpu6050: { acc: { x: 0.13, y: -0.02, z: 9.80 }, gyro: { x: 0.2, y: 0.1, z: -0.2 }, ang: { x: 1.6, y: -0.9, z: 0.2 } },
    veml7700: { lux: 246.1, white: 199.0 },
    bme680: { temp: 23.7, hum: 53.9, press: 1013.0, gas: 146.1 },
    system: { uptime: 140, cpu_temp: 42.5, free_heap: 214000, rssi: -54 },
  },
]
