import { useRef, useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SerialMessage } from "@/lib/types";
import {
  ArrowUp,
  ArrowDown,
  Send,
  CheckCircle,
  Activity,
  FileJson,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SerialLogProps {
  messages: SerialMessage[];
  disabled?: boolean;
  onSend: (message: string) => void;
}

function formatParsedMessage(msg: SerialMessage) {
  const p = msg.parsed;
  if (!p) return msg.raw;

  switch (p.type) {
    case "log":
      return (
        <span>
          <span className="text-muted-foreground">[{p.level}]</span> {p.message}
        </span>
      );
    case "pong":
      return (
        <span className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-green-500" />
          Pong — device alive
        </span>
      );
    case "response":
      if (p.error) {
        return (
          <span>
            <span className="text-muted-foreground">
              {p.action} {p.target}:
            </span>{" "}
            <span className="text-destructive">{p.error}</span>
          </span>
        );
      }
      return (
        <span>
          <span className="text-muted-foreground">
            {p.action} {p.target}:
          </span>{" "}
          <span className="font-mono text-green-600 dark:text-green-400">
            {p.value}
          </span>
        </span>
      );
    case "selftest_result":
      return (
        <span>
          <span className="text-muted-foreground">Selftest {p.sensor}:</span>{" "}
          {p.ok ? (
            <span className="text-green-600 dark:text-green-400">
              {p.message}
            </span>
          ) : (
            <span className="text-destructive">{p.error}</span>
          )}
        </span>
      );
    case "sensor_data":
      return (
        <span className="flex items-center gap-1">
          <Activity className="h-3 w-3 text-blue-500" />
          <span className="text-muted-foreground">Sensor payload</span>
          <span className="text-[10px] text-muted-foreground">
            ({p.data ? Object.keys(p.data).join(", ") : "raw"})
          </span>
        </span>
      );
    default:
      if (p.action === "ping")
        return <span className="text-muted-foreground">Ping</span>;
      if (p.action === "reboot")
        return <span className="text-orange-500">Reboot</span>;
      if (p.action === "bootloader")
        return <span className="text-orange-500">Bootloader hook</span>;
      if (p.action === "factory_reset")
        return <span className="text-destructive">Factory reset</span>;
      if (p.action === "set_serial")
        return <span className="text-muted-foreground">Set serial</span>;
      return (
        <span>
          <span className="text-muted-foreground">{p.action}</span>
          {p.target && (
            <span className="text-muted-foreground"> {p.target}</span>
          )}
        </span>
      );
  }
}

export function SerialLog({ messages, disabled, onSend }: SerialLogProps) {
  const [input, setInput] = useState("");
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop =
        scrollViewportRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col border rounded-lg bg-card/50 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30">
        <FileJson className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold">Serial Monitor</span>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-auto">
          {messages.length}
        </Badge>
      </div>
      <ScrollArea className="flex-1 min-h-0" viewportRef={scrollViewportRef}>
        <div className="p-2 space-y-0.5 font-mono text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "grid grid-cols-[1rem_4.75rem_minmax(0,1fr)] items-start gap-x-2 rounded px-2 py-1",
                msg.direction === "tx" && "bg-blue-500/5",
                msg.direction === "rx" &&
                  msg.parsed?.type === "log" &&
                  msg.parsed.level === "error" &&
                  "bg-destructive/5",
              )}
            >
              <span className="mt-[2px] shrink-0">
                {msg.direction === "tx" ? (
                  <ArrowUp className="h-3 w-3 text-blue-500" />
                ) : (
                  <ArrowDown className="h-3 w-3 text-green-500" />
                )}
              </span>
              <span className="text-[10px] text-muted-foreground/60 shrink-0 whitespace-nowrap tabular-nums">
                {new Date(msg.timestamp).toLocaleTimeString("en-US", {
                  hour12: false,
                })}
              </span>
              <span className="min-w-0 leading-relaxed break-all">
                {formatParsedMessage(msg)}
              </span>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-xs text-muted-foreground p-4 text-center">
              No messages yet. Connect to a device to see its serial output.
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="flex items-center gap-2 p-2 border-t bg-muted/30">
        <Input
          placeholder={
            disabled ? "Unavailable while streaming..." : '{"action":"ping"}'
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={disabled}
          className="h-8 text-xs font-mono"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="h-8 px-2.5"
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
