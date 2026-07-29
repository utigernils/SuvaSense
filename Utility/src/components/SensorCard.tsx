import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  selftestResult,
  onSelftest,
  disabled,
}: SensorCardProps) {
  return (
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
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
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
        {selftestResult && (
          <div
            className={`mt-3 flex items-start gap-1.5 rounded-md px-2.5 py-1.5 text-xs ${
              selftestResult.ok
                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {selftestResult.ok ? (
              <CheckCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            ) : (
              <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            )}
            <span>
              {selftestResult.ok
                ? selftestResult.message
                : selftestResult.error}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
