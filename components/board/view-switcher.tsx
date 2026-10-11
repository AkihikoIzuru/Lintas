"use client";

import { LayoutGrid, List, Calendar, GanttChart, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ViewType = "board" | "list" | "calendar" | "timeline" | "dashboard";

interface ViewSwitcherProps {
  view: ViewType;
  onViewChange: (view: ViewType) => void;
}

const views = [
  { type: "board" as const, icon: LayoutGrid, label: "Board" },
  { type: "list" as const, icon: List, label: "List" },
  { type: "calendar" as const, icon: Calendar, label: "Calendar" },
  { type: "timeline" as const, icon: GanttChart, label: "Timeline" },
  { type: "dashboard" as const, icon: BarChart2, label: "Dashboard" },
];

export function ViewSwitcher({ view, onViewChange }: ViewSwitcherProps) {
  return (
    <div className="flex items-center gap-1 border rounded-lg p-1">
      {views.map(({ type, icon: Icon, label }) => (
        <Button
          key={type}
          variant={view === type ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewChange(type)}
          className={cn(
            "gap-2",
            view === type && "shadow-sm"
          )}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  );
}
