import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SelftestResult } from "@/lib/types";
import { FlaskConical, CheckCircle, XCircle, Info } from "lucide-react";

interface SensorValue {
  label: string;
  value: string;
  unit: string;
}

interface SensorCardProps {
  title: string;
  icon: React.ReactNode;
  i2cAddress?: string;
  description: string;
  values: SensorValue[];
  noDataReason?: string;
  selftestResult?: SelftestResult;
  onSelftest: () => void;
  disabled?: boolean;
}

export function SensorCard({
  title,
  icon,
  i2cAddress,
  description,
  values,
  noDataReason,
  selftestResult,
  onSelftest,
  disabled,
}: SensorCardProps) {
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const lastShownSignatureRef = useRef<string>("");

  useEffect(() => {
    if (!selftestResult) return;

    const signature = [
      title,
      selftestResult.ok ? "ok" : "fail",
      selftestResult.sensor,
      selftestResult.message ?? "",
      selftestResult.error ?? "",
    ].join("|");

    if (signature === lastShownSignatureRef.current) return;

    lastShownSignatureRef.current = signature;
    setResultModalOpen(true);
  }, [selftestResult, title]);

  return (
    <>
    <Card className="relative h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            {i2cAddress && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 font-mono"
              >
                {i2cAddress}
              </Badge>
            )}
            <TooltipProvider delay={0}>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-48">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2">
            {selftestResult ? (
              <button
                type="button"
                onClick={() => setResultModalOpen(true)}
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] transition-colors hover:bg-muted/50 ${
                  selftestResult.ok
                    ? "border-green-500/40 text-green-600 dark:text-green-400"
                    : "border-destructive/40 text-destructive"
                }`}
                aria-label={`Open last ${title} selftest result`}
              >
                {selftestResult.ok ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {selftestResult.ok ? "Last: OK" : "Last: Failed"}
              </button>
            ) : (
              <span className="text-[10px] text-muted-foreground">No selftest yet</span>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onSelftest}
              disabled={disabled}
              className="text-xs gap-1 h-7"
            >
              <FlaskConical className="h-3 w-3" />
              Selftest
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {values.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 flex-1">
            {values.map((v) => (
              <div key={v.label} className="flex items-baseline gap-1">
                <span className="text-[11px] text-muted-foreground leading-tight">
                  {v.label}
                </span>
                <span className="text-sm font-mono font-medium tabular-nums ml-auto leading-tight">
                  {v.value}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight">
                  {v.unit}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
            <span>
              No data available.
              {noDataReason ? ` ${noDataReason}` : ""}
            </span>
          </div>
        )}
      </CardContent>
    </Card>

      <Dialog open={resultModalOpen} onOpenChange={setResultModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title} selftest result</DialogTitle>
            <DialogDescription>
              {selftestResult
                ? selftestResult.ok
                  ? "Selftest completed successfully."
                  : "Selftest failed."
                : "No selftest result available."}
            </DialogDescription>
          </DialogHeader>

          {selftestResult ? (
            <div
              className={`rounded-md px-3 py-2 text-sm ${
                selftestResult.ok
                  ? "bg-green-500/10 text-green-700 dark:text-green-400"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium">
                {selftestResult.ok ? (
                  <CheckCircle className="h-3.5 w-3.5" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                Sensor: {selftestResult.sensor}
              </div>
              <p className="text-sm leading-relaxed">
                {selftestResult.ok
                  ? selftestResult.message
                  : selftestResult.error}
              </p>
            </div>
          ) : null}

          <DialogFooter>
            <Button onClick={() => setResultModalOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
