import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { SensorPayload } from "@/lib/types"
import { Table2 } from "lucide-react"

interface DataDrawerProps {
  data: SensorPayload[]
  streaming: boolean
  onStreamingChange: (v: boolean) => void
  streamingDisabled?: boolean
}

export function DataDrawer({
  data,
  streaming,
  onStreamingChange,
  streamingDisabled,
}: DataDrawerProps) {
  return (
    <div className="flex h-full min-h-0 flex-col border rounded-lg bg-card/50 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30">
        <Table2 className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold">Stream Data</span>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          {data.length}
        </Badge>
        <div className="ml-auto flex items-center gap-2">
          <Switch
            id="streaming"
            checked={streaming}
            onCheckedChange={onStreamingChange}
            disabled={streamingDisabled}
          />
          <Label htmlFor="streaming" className="text-xs font-medium cursor-pointer">
            Streaming
          </Label>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto px-3 pb-3 pt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs w-16">#</TableHead>
                <TableHead className="text-xs">Temp °C</TableHead>
                <TableHead className="text-xs">Hum %</TableHead>
                <TableHead className="text-xs">Press hPa</TableHead>
                <TableHead className="text-xs">Gas kΩ</TableHead>
                <TableHead className="text-xs">Lux</TableHead>
                <TableHead className="text-xs">Acc X</TableHead>
                <TableHead className="text-xs">Acc Y</TableHead>
                <TableHead className="text-xs">Acc Z</TableHead>
                <TableHead className="text-xs">Gyro X</TableHead>
                <TableHead className="text-xs">Gyro Y</TableHead>
                <TableHead className="text-xs">Gyro Z</TableHead>
                <TableHead className="text-xs">Ang X</TableHead>
                <TableHead className="text-xs">Ang Y</TableHead>
                <TableHead className="text-xs">Ang Z</TableHead>
                <TableHead className="text-xs">CPU °C</TableHead>
                <TableHead className="text-xs">Heap</TableHead>
                <TableHead className="text-xs">RSSI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="text-xs font-mono tabular-nums">
                    {row.bme680?.temp?.toFixed(1) ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono tabular-nums">
                    {row.bme680?.hum?.toFixed(1) ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono tabular-nums">
                    {row.bme680?.press?.toFixed(1) ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono tabular-nums">
                    {row.bme680?.gas?.toFixed(1) ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono tabular-nums">
                    {row.veml7700?.lux?.toFixed(1) ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono tabular-nums">
                    {row.mpu6050?.acc.x?.toFixed(2) ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono tabular-nums">
                    {row.mpu6050?.acc.y?.toFixed(2) ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono tabular-nums">
                    {row.mpu6050?.acc.z?.toFixed(2) ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono tabular-nums">
                    {row.mpu6050?.gyro.x?.toFixed(1) ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono tabular-nums">
                    {row.mpu6050?.gyro.y?.toFixed(1) ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono tabular-nums">
                    {row.mpu6050?.gyro.z?.toFixed(1) ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono tabular-nums">
                    {row.mpu6050?.ang.x?.toFixed(1) ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono tabular-nums">
                    {row.mpu6050?.ang.y?.toFixed(1) ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono tabular-nums">
                    {row.mpu6050?.ang.z?.toFixed(1) ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono tabular-nums">
                    {row.system?.cpu_temp?.toFixed(1) ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono tabular-nums">
                    {row.system?.free_heap ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono tabular-nums">
                    {row.system?.rssi ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={18} className="text-center text-xs text-muted-foreground py-8">
                    No stream data yet. Start streaming to collect samples.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
      </div>
    </div>
  )
}
