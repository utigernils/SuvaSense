import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { SensorPayload } from "@/lib/types"
import { ChevronDown } from "lucide-react"

interface DataDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: SensorPayload[]
}

export function DataDrawer({ open, onOpenChange, data }: DataDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[40vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-sm font-semibold flex items-center gap-2">
            <ChevronDown className="h-4 w-4" />
            Stream Data
            <span className="text-xs font-normal text-muted-foreground">
              ({data.length} samples)
            </span>
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4 overflow-auto">
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
      </DrawerContent>
    </Drawer>
  )
}
