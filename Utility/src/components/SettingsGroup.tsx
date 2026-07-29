import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Info } from "lucide-react"

interface SettingField {
  key: string
  label: string
  type: "text" | "password" | "number" | "boolean" | "select"
  value: string | number | boolean
  description?: string
  unit?: string
  readOnly?: boolean
  options?: { label: string; value: string }[]
}

interface SettingsGroupProps {
  title: string
  icon: React.ReactNode
  fields: SettingField[]
  onChange: (key: string, value: string | number | boolean) => void
  disabled?: boolean
}

export function SettingsGroup({ title, icon, fields, onChange, disabled }: SettingsGroupProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Label htmlFor={field.key} className="text-xs font-medium">
                {field.label}
              </Label>
              {field.description && (
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-48">{field.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {field.readOnly && (
                <span className="text-[10px] text-muted-foreground ml-auto">read-only</span>
              )}
            </div>

            {field.type === "boolean" ? (
              <div className="flex items-center gap-2">
                <Switch
                  id={field.key}
                  checked={field.value as boolean}
                  onCheckedChange={(v) => onChange(field.key, v)}
                  disabled={disabled || field.readOnly}
                />
                <Label htmlFor={field.key} className="text-xs text-muted-foreground cursor-pointer">
                  {field.value ? "Enabled" : "Disabled"}
                </Label>
              </div>
            ) : field.type === "select" && field.options ? (
              <Select
                value={String(field.value)}
                onValueChange={(v) => onChange(field.key, v)}
                disabled={disabled || field.readOnly}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-1.5">
                <Input
                  id={field.key}
                  type={field.type === "password" ? "password" : field.type === "number" ? "number" : "text"}
                  value={field.readOnly && typeof field.value === "boolean" ? String(field.value) : field.value as string | number}
                  onChange={(e) => {
                    const val =
                      field.type === "number"
                        ? Number(e.target.value)
                        : field.type === "boolean"
                          ? e.target.value === "true"
                          : e.target.value
                    onChange(field.key, val)
                  }}
                  disabled={disabled || field.readOnly}
                  className="h-8 text-xs font-mono"
                />
                {field.unit && (
                  <span className="text-[10px] text-muted-foreground shrink-0">{field.unit}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
