export const DeviceState = {
  FACTORY: "factory",
  BOOTLOADER: "bootloader",
  RUNNING: "runtime",
} as const

export type DeviceState = (typeof DeviceState)[keyof typeof DeviceState]

export interface MPU6050Data {
  acc: { x: number; y: number; z: number }
  gyro: { x: number; y: number; z: number }
  ang: { x: number; y: number; z: number }
}

export interface VEML7700Data {
  lux: number
  white: number
}

export interface BME680Data {
  temp: number
  hum: number
  press: number
  gas: number
}

export interface SystemTelemetry {
  uptime: number
  cpu_temp: number
  free_heap: number
  rssi?: number
}

export interface SensorPayload {
  mpu6050?: MPU6050Data
  veml7700?: VEML7700Data
  bme680?: BME680Data
  system?: SystemTelemetry
}

export interface SelftestResult {
  ok: boolean
  sensor: string
  message?: string
  error?: string
}

export interface SelftestState {
  bme680?: SelftestResult
  mpu6050?: SelftestResult
  veml7700?: SelftestResult
  esp32?: SelftestResult
  led?: SelftestResult
}

export type ConnectionState = "disconnected" | "connecting" | "hooking_bootloader" | "connected"

export type LogLevel = "info" | "warn" | "error"

export interface SerialMessage {
  id: string
  timestamp: number
  direction: "tx" | "rx"
  raw: string
  parsed?: ParsedMessage
}

export interface ParsedMessage {
  type: "log" | "pong" | "response" | "selftest_result" | "sensor_data" | "unknown"
  level?: LogLevel
  message?: string
  action?: string
  target?: string
  value?: string
  error?: string
  ok?: boolean
  sensor?: string
  data?: SensorPayload
}

export interface WiFiSettings {
  ssid: string
  wifi_password: string
  hostname: string
}

export interface MQTTSettings {
  broker: string
  port: number
  client_id: string
  mqtt_username: string
  mqtt_password: string
  topic_prefix: string
  keep_alive: number
}

export interface SensorSettings {
  publish_interval: number
  mpu_en: boolean
  veml_en: boolean
  bme_en: boolean
  sys_telem: boolean
}

export interface LEDSettings {
  brightness: number
  user_led: boolean
  sys_led: boolean
}

export interface SystemInfo {
  serial_num: string
  boot_count: number
  factory_done: boolean
}

export interface DeviceSettings {
  wifi: WiFiSettings
  mqtt: MQTTSettings
  sensors: SensorSettings
  led: LEDSettings
  system: SystemInfo
}
