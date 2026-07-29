import { useState } from "react"
import { DeviceState, type ConnectionState } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Plug,
  PlugZap,
  RefreshCw,
  Info,
  Circle,
  Wifi,
  WifiOff,
} from "lucide-react"

interface HeaderProps {
  deviceState: DeviceState
  connectionState: ConnectionState
  autoHook: boolean
  onAutoHookChange: (v: boolean) => void
  onSendBootloader: () => void
  onReboot: () => void
  onSetSerial: (serial: string) => void
  countdown: number
}

export function Header({
  deviceState,
  connectionState,
  autoHook,
  onAutoHookChange,
  onSendBootloader,
  onReboot,
  onSetSerial,
  countdown,
}: HeaderProps) {
  const [factoryOpen, setFactoryOpen] = useState(false)
  const [serialInput, setSerialInput] = useState("")

  const connectionLabel: Record<ConnectionState, string> = {
    disconnected: "Disconnected",
    connecting: "Connecting...",
    hooking_bootloader: "Hooking bootloader...",
    connected: "Connected",
  }

  const connectionColor: Record<ConnectionState, string> = {
    disconnected: "text-muted-foreground",
    connecting: "text-yellow-500",
    hooking_bootloader: "text-orange-500",
    connected: "text-green-500",
  }

  const stateLabel: Record<DeviceState, string> = {
    [DeviceState.FACTORY]: "Factory",
    [DeviceState.BOOTLOADER]: "Bootloader",
    [DeviceState.RUNNING]: "Runtime",
  }

  const stateVariant: Record<DeviceState, "destructive" | "secondary" | "default"> = {
    [DeviceState.FACTORY]: "destructive",
    [DeviceState.BOOTLOADER]: "secondary",
    [DeviceState.RUNNING]: "default",
  }

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <img src="/icon.svg" alt="SuvaSense" className="h-8 w-8" />
          <h1 className="text-lg font-semibold tracking-tight">SuvaSense Utility</h1>
          <Badge variant={stateVariant[deviceState]} className="ml-2 text-xs">
            {stateLabel[deviceState]}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 ${connectionColor[connectionState]}`}>
              {connectionState === "disconnected" && <WifiOff className="h-4 w-4" />}
              {connectionState === "connecting" && <RefreshCw className="h-4 w-4 animate-spin" />}
              {connectionState === "hooking_bootloader" && <Plug className="h-4 w-4 animate-pulse" />}
              {connectionState === "connected" && <Wifi className="h-4 w-4" />}
              <span className="text-xs font-medium">{connectionLabel[connectionState]}</span>
            </div>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs max-w-64">
                    Autopings the device every 5s. If a reboot is detected, the 5-second bootloader window is used to
                    hook into bootloader mode automatically.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {countdown > 0 && (
            <span className="text-xs text-orange-500 font-mono tabular-nums">
              {countdown.toFixed(1)}s
            </span>
          )}

          <div className="flex items-center gap-1.5">
            <Switch
              id="auto-hook"
              checked={autoHook}
              onCheckedChange={onAutoHookChange}
              disabled={connectionState === "disconnected"}
            />
            <Label htmlFor="auto-hook" className="text-xs text-muted-foreground cursor-pointer">
              Auto-hook
            </Label>
          </div>

          <Separator />

          <Button
            variant="outline"
            size="sm"
            onClick={onSendBootloader}
            disabled={
              deviceState === DeviceState.BOOTLOADER ||
              deviceState === DeviceState.FACTORY ||
              connectionState === "disconnected"
            }
            className="text-xs gap-1.5"
          >
            <PlugZap className="h-3.5 w-3.5" />
            Hook Bootloader
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onReboot}
            disabled={connectionState === "disconnected"}
            className="text-xs gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reboot
          </Button>
        </div>
      </div>

      <Dialog open={factoryOpen} onOpenChange={setFactoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Factory Setup</DialogTitle>
            <DialogDescription>
              The device is in factory mode. Enter a serial number to initialize it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="serial">Serial Number</Label>
            <Input
              id="serial"
              placeholder="SN12345"
              value={serialInput}
              onChange={(e) => setSerialInput(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFactoryOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!serialInput.trim()}
              onClick={() => {
                onSetSerial(serialInput.trim())
                setSerialInput("")
                setFactoryOpen(false)
              }}
            >
              Set Serial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}

function Separator() {
  return <div className="w-px h-5 bg-border" />
}
