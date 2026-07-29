import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { SystemInfo } from "@/lib/types";
import { LayoutDashboard, Settings2 } from "lucide-react";

interface SubHeaderProps {
  systemInfo: SystemInfo;
  page: "overview" | "settings";
}

const pageTitle: Record<string, string> = {
  overview: "Dashboard",
  settings: "Configuration",
};

export function SubHeader({ systemInfo, page }: SubHeaderProps) {
  return (
    <div className="mx-4 mt-3 bg-card border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-3.5 pb-2">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold tracking-tight">
            {pageTitle[page]}
          </h2>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 font-mono"
          >
            Serial: {systemInfo.serial_num || "—"}
          </Badge>
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 font-mono"
          >
            Boots: {systemInfo.boot_count}
          </Badge>
          <span className="w-px h-4 bg-border" />

          <Badge
            variant={systemInfo.factory_done ? "default" : "destructive"}
            className="text-[10px] px-1.5 py-0"
          >
            {systemInfo.factory_done ? "Factory OK" : "Pending"}
          </Badge>
        </div>
      </div>
      <div className="border-t px-5 py-2 flex items-center">
        <TabsList className="h-8">
          <TabsTrigger value="overview" className="text-xs gap-1.5">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs gap-1.5">
            <Settings2 className="h-3.5 w-3.5" />
            Settings
          </TabsTrigger>
        </TabsList>
      </div>
    </div>
  );
}
