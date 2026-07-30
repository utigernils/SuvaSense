import { useEffect, useRef } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SensorPayload } from "@/lib/types";
import { Eraser, Table2 } from "lucide-react";

interface DataDrawerProps {
  data: SensorPayload[];
  streaming: boolean;
  onStreamingChange: (v: boolean) => void;
  streamingDisabled?: boolean;
  onClear: () => void;
}

export function DataDrawer({
  data,
  streaming,
  onStreamingChange,
  streamingDisabled,
  onClear,
}: DataDrawerProps) {
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
    }
  }, [data]);

  return (
    <div className="flex h-full min-h-0 flex-col border rounded-lg bg-card/50 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30">
        <Table2 className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold">Stream Data</span>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          {data.length}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          disabled={data.length === 0}
          className="ml-auto h-6 px-2 text-[10px]"
        >
          <Eraser className="h-3 w-3" />
          Clear
        </Button>
        <div className="flex items-center gap-2">
          <Switch
            id="streaming"
            checked={streaming}
            onCheckedChange={onStreamingChange}
            disabled={streamingDisabled}
          />
          <Label
            htmlFor="streaming"
            className="text-xs font-medium cursor-pointer"
          >
            Streaming
          </Label>
        </div>
      </div>
      <ScrollArea className="flex-1 min-h-0" viewportRef={scrollViewportRef}>
        <div className="px-3 pb-3 pt-2">
          <table className="min-w-max caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50">
                <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground text-xs w-16">#</th>
                <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground text-xs">Temp °C</th>
                <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground text-xs">Hum %</th>
                <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground text-xs">Press hPa</th>
                <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground text-xs">Gas kΩ</th>
                <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground text-xs">Lux</th>
                <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground text-xs">Acc X</th>
                <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground text-xs">Acc Y</th>
                <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground text-xs">Acc Z</th>
                <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground text-xs">Gyro X</th>
                <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground text-xs">Gyro Y</th>
                <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground text-xs">Gyro Z</th>
                <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground text-xs">Ang X</th>
                <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground text-xs">Ang Y</th>
                <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground text-xs">Ang Z</th>
                <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground text-xs">CPU °C</th>
                <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground text-xs">Heap</th>
                <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground text-xs">RSSI</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
            {data.map((row, i) => (
              <tr key={i} className="border-b transition-colors hover:bg-muted/50">
                <td className="p-2 align-middle whitespace-nowrap text-xs text-muted-foreground">
                  {i + 1}
                </td>
                <td className="p-2 align-middle whitespace-nowrap text-xs font-mono tabular-nums">
                  {row.bme680?.temp?.toFixed(1) ?? "—"}
                </td>
                <td className="p-2 align-middle whitespace-nowrap text-xs font-mono tabular-nums">
                  {row.bme680?.hum?.toFixed(1) ?? "—"}
                </td>
                <td className="p-2 align-middle whitespace-nowrap text-xs font-mono tabular-nums">
                  {row.bme680?.press?.toFixed(1) ?? "—"}
                </td>
                <td className="p-2 align-middle whitespace-nowrap text-xs font-mono tabular-nums">
                  {row.bme680?.gas?.toFixed(1) ?? "—"}
                </td>
                <td className="p-2 align-middle whitespace-nowrap text-xs font-mono tabular-nums">
                  {row.veml7700?.lux?.toFixed(1) ?? "—"}
                </td>
                <td className="p-2 align-middle whitespace-nowrap text-xs font-mono tabular-nums">
                  {row.mpu6050?.acc.x?.toFixed(2) ?? "—"}
                </td>
                <td className="p-2 align-middle whitespace-nowrap text-xs font-mono tabular-nums">
                  {row.mpu6050?.acc.y?.toFixed(2) ?? "—"}
                </td>
                <td className="p-2 align-middle whitespace-nowrap text-xs font-mono tabular-nums">
                  {row.mpu6050?.acc.z?.toFixed(2) ?? "—"}
                </td>
                <td className="p-2 align-middle whitespace-nowrap text-xs font-mono tabular-nums">
                  {row.mpu6050?.gyro.x?.toFixed(1) ?? "—"}
                </td>
                <td className="p-2 align-middle whitespace-nowrap text-xs font-mono tabular-nums">
                  {row.mpu6050?.gyro.y?.toFixed(1) ?? "—"}
                </td>
                <td className="p-2 align-middle whitespace-nowrap text-xs font-mono tabular-nums">
                  {row.mpu6050?.gyro.z?.toFixed(1) ?? "—"}
                </td>
                <td className="p-2 align-middle whitespace-nowrap text-xs font-mono tabular-nums">
                  {row.mpu6050?.ang.x?.toFixed(1) ?? "—"}
                </td>
                <td className="p-2 align-middle whitespace-nowrap text-xs font-mono tabular-nums">
                  {row.mpu6050?.ang.y?.toFixed(1) ?? "—"}
                </td>
                <td className="p-2 align-middle whitespace-nowrap text-xs font-mono tabular-nums">
                  {row.mpu6050?.ang.z?.toFixed(1) ?? "—"}
                </td>
                <td className="p-2 align-middle whitespace-nowrap text-xs font-mono tabular-nums">
                  {row.system?.cpu_temp?.toFixed(1) ?? "—"}
                </td>
                <td className="p-2 align-middle whitespace-nowrap text-xs font-mono tabular-nums">
                  {row.system?.free_heap ?? "—"}
                </td>
                <td className="p-2 align-middle whitespace-nowrap text-xs font-mono tabular-nums">
                  {row.system?.rssi ?? "—"}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr className="border-b transition-colors hover:bg-muted/50">
                <td
                  colSpan={18}
                  className="p-2 align-middle whitespace-nowrap text-center text-xs text-muted-foreground py-8"
                >
                  No stream data yet. Start streaming to collect samples.
                </td>
              </tr>
            )}
            </tbody>
          </table>
        </div>
      </ScrollArea>
    </div>
  );
}
