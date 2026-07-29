import { useState } from "react"
import { SettingsGroup } from "@/components/SettingsGroup"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { DeviceSettings } from "@/lib/types"
import {
  Wifi,
  Radio,
  Thermometer,
  Lightbulb,
  Trash2,
} from "lucide-react"

interface SettingsProps {
  settings: DeviceSettings
  deviceState: string
  onSettingChange: (section: keyof DeviceSettings, key: string, value: string | number | boolean) => void
  onFactoryReset: () => void
}

export function Settings({
  settings,
  deviceState,
  onSettingChange,
  onFactoryReset,
}: SettingsProps) {
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const editable = deviceState === "bootloader"

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-4">
        <SettingsGroup
          title="WiFi"
          icon={<Wifi className="h-4 w-4 text-blue-400" />}
          disabled={!editable}
          fields={[
            {
              key: "ssid",
              label: "SSID",
              type: "text",
              value: settings.wifi.ssid,
              description: "WiFi network name the device connects to.",
            },
            {
              key: "wifi_password",
              label: "Password",
              type: "password",
              value: settings.wifi.wifi_password,
              description: "WiFi password. Stored in plaintext on device. Returned unmasked on GET.",
            },
            {
              key: "hostname",
              label: "Hostname",
              type: "text",
              value: settings.wifi.hostname,
              description: "DHCP hostname. Defaults to suva-<serial> if not set.",
            },
          ]}
          onChange={(key, value) => onSettingChange("wifi", key, value)}
        />

        <SettingsGroup
          title="MQTT"
          icon={<Radio className="h-4 w-4 text-green-400" />}
          disabled={!editable}
          fields={[
            {
              key: "broker",
              label: "Broker",
              type: "text",
              value: settings.mqtt.broker,
              description: "MQTT broker IP address or hostname.",
            },
            {
              key: "port",
              label: "Port",
              type: "number",
              value: settings.mqtt.port,
              description: "MQTT broker port. Default: 1883.",
            },
            {
              key: "client_id",
              label: "Client ID",
              type: "text",
              value: settings.mqtt.client_id,
              description: "MQTT client identifier. Defaults to serial number.",
            },
            {
              key: "mqtt_username",
              label: "Username",
              type: "text",
              value: settings.mqtt.mqtt_username,
              description: "MQTT username. Optional — leave blank if unused.",
            },
            {
              key: "mqtt_password",
              label: "Password",
              type: "password",
              value: settings.mqtt.mqtt_password,
              description: "MQTT password. Optional. Stored in plaintext on device.",
            },
            {
              key: "topic_prefix",
              label: "Topic Prefix",
              type: "text",
              value: settings.mqtt.topic_prefix,
              description: "MQTT topic prefix. Defaults to suva/<serial>/.",
            },
            {
              key: "keep_alive",
              label: "Keep Alive",
              type: "number",
              value: settings.mqtt.keep_alive,
              unit: "s",
              description: "MQTT keepalive interval in seconds. Default: 60.",
            },
          ]}
          onChange={(key, value) => onSettingChange("mqtt", key, value)}
        />

        <SettingsGroup
          title="Sensors"
          icon={<Thermometer className="h-4 w-4 text-orange-400" />}
          disabled={!editable}
          fields={[
            {
              key: "publish_interval",
              label: "Publish Interval",
              type: "number",
              value: settings.sensors.publish_interval,
              unit: "ms",
              description: "How often sensor data is published via MQTT. Default: 10000.",
            },
            {
              key: "mpu_en",
              label: "MPU6050",
              type: "boolean",
              value: settings.sensors.mpu_en,
              description: "Enable accelerometer/gyroscope sensor.",
            },
            {
              key: "veml_en",
              label: "VEML7700",
              type: "boolean",
              value: settings.sensors.veml_en,
              description: "Enable ambient light sensor.",
            },
            {
              key: "bme_en",
              label: "BME680",
              type: "boolean",
              value: settings.sensors.bme_en,
              description: "Enable temperature/humidity/pressure/gas sensor.",
            },
            {
              key: "sys_telem",
              label: "System Telemetry",
              type: "boolean",
              value: settings.sensors.sys_telem,
              description: "Include system telemetry in MQTT payloads.",
            },
          ]}
          onChange={(key, value) => onSettingChange("sensors", key, value)}
        />

        <SettingsGroup
          title="LED"
          icon={<Lightbulb className="h-4 w-4 text-yellow-400" />}
          disabled={!editable}
          fields={[
            {
              key: "brightness",
              label: "Brightness",
              type: "number",
              value: settings.led.brightness,
              description: "LED brightness level, range 0–255. Default: 32. Note: not applied at runtime yet.",
            },
            {
              key: "user_led",
              label: "User LED",
              type: "boolean",
              value: settings.led.user_led,
              description: "Enable the user LED (LED 1) for connection and activity indicators.",
            },
            {
              key: "sys_led",
              label: "System LED",
              type: "boolean",
              value: settings.led.sys_led,
              description: "Enable the system LED (LED 0) for state heartbeat.",
            },
          ]}
          onChange={(key, value) => onSettingChange("led", key, value)}
        />

        <div className="col-span-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setResetConfirmOpen(true)}
            disabled={!editable}
            className="text-xs gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Factory Reset
          </Button>
          <span className="text-[11px] text-muted-foreground ml-3">
            Wipes all settings but preserves serial number and factory flag.
          </span>
        </div>
      </div>

      <Dialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Factory Reset</DialogTitle>
            <DialogDescription>
              This will reset all WiFi, MQTT, sensor, and LED settings to their defaults.
              The serial number and factory flag will be preserved. The device will reboot after the reset.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onFactoryReset()
                setResetConfirmOpen(false)
              }}
            >
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
