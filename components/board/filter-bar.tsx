"use client";

import { useState } from "react";
import { Filter, X, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface TaskFilters {
  search: string;
  assignee: string | null;
  label: string | null;
  priority: string | null;
  status: string | null;
  dueDate: "overdue" | "today" | "this-week" | "none" | null;
  hasSubtasks: boolean | null;
}

interface FilterBarProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  assignees: Array<{ id: string; name: string | null; email: string }>;
  labels: Array<{ id: string; name: string; color: string }>;
  columns: Array<{ id: string; name: string }>;
  showSearch?: boolean;
}

export function FilterBar({
  filters,
  onFiltersChange,
  assignees,
  labels,
  columns,
  showSearch = true,
}: FilterBarProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const activeFiltersCount = [
    filters.assignee,
    filters.label,
    filters.priority,
    filters.status,
    filters.dueDate,
    filters.hasSubtasks !== null && filters.hasSubtasks,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      assignee: null,
      label: null,
      priority: null,
      status: null,
      dueDate: null,
      hasSubtasks: null,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {showSearch && (
        <div className="relative flex-1 min-w-[200px] max-w-xs sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari tugas..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>
      )}

      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={activeFiltersCount > 0 ? "secondary" : "outline"}
            className="gap-2"
            size="sm"
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="end" className="w-80 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">Filter Tugas</h4>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-3 h-3 mr-1" />
                Hapus Semua
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {/* Assignee Filter */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Assignee</Label>
              <Select
                value={filters.assignee || ""}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, assignee: value || null })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua assignee</SelectItem>
                  {assignees.map((assignee) => (
                    <SelectItem key={assignee.id} value={assignee.id}>
                      {assignee.name || assignee.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Label Filter */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Label</Label>
              <Select
                value={filters.label || ""}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, label: value || null })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua label" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua label</SelectItem>
                  {labels.map((label) => (
                    <SelectItem key={label.id} value={label.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        {label.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Prioritas</Label>
              <Select
                value={filters.priority || ""}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, priority: value || null })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua prioritas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua prioritas</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status/Column Filter */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Status (Kolom)</Label>
              <Select
                value={filters.status || ""}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, status: value || null })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua status</SelectItem>
                  {columns.map((column) => (
                    <SelectItem key={column.id} value={column.id}>
                      {column.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date Filter */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Tanggal Jatuh Tempo</Label>
              <Select
                value={filters.dueDate || ""}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, dueDate: value as any || null })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua tanggal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua tanggal</SelectItem>
                  <SelectItem value="overdue">Lewat jatuh tempo</SelectItem>
                  <SelectItem value="today">Hari ini</SelectItem>
                  <SelectItem value="this-week">Minggu ini</SelectItem>
                  <SelectItem value="none">Tidak ada tanggal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Has Subtasks Filter */}
            <div>
              <Label className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.hasSubtasks === true}
                  onCheckedChange={(checked) =>
                    onFiltersChange({ ...filters, hasSubtasks: checked ? true : null })
                  }
                />
                Hanya yang punya subtask
              </Label>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}