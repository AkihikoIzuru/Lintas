"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Save,
  Star,
  Trash2,
  ChevronDown,
  Filter,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

export interface SavedFilter {
  id: string;
  name: string;
  filters: any;
  isDefault: boolean;
  workspaceId: string | null;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SavedFiltersProps {
  projectId: string;
  workspaceId: string;
  currentFilters: any;
  onLoadFilter: (filters: any) => void;
}

export function SavedFilters({
  projectId,
  workspaceId,
  currentFilters,
  onLoadFilter,
}: SavedFiltersProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");

  const { data: savedFilters } = useQuery({
    queryKey: ["saved-filters", projectId, workspaceId],
    queryFn: async () => {
      const params = new URLSearchParams({
        projectId,
        workspaceId,
      });
      const res = await fetch(`/api/saved-filters?${params}`);
      if (!res.ok) throw new Error("Gagal memuat filter tersimpan");
      return res.json() as Promise<{ filters: SavedFilter[] }>;
    },
  });

  const saveFilter = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/saved-filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          filters: currentFilters,
          projectId,
          workspaceId,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal menyimpan filter");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-filters", projectId, workspaceId] });
      setSaveDialogOpen(false);
      setSaveName("");
      toast({ title: "Berhasil", description: "Filter berhasil disimpan" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const deleteFilter = useMutation({
    mutationFn: async (filterId: string) => {
      const res = await fetch(`/api/saved-filters/${filterId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus filter");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-filters", projectId, workspaceId] });
      toast({ title: "Berhasil", description: "Filter berhasil dihapus" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const setDefaultFilter = useMutation({
    mutationFn: async (filterId: string) => {
      const res = await fetch(`/api/saved-filters/${filterId}/default`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Gagal mengatur filter default");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-filters", projectId, workspaceId] });
    },
  });

  const handleSave = () => {
    if (saveName.trim()) {
      saveFilter.mutate(saveName.trim());
    }
  };

  const hasActiveFilters = Object.values(currentFilters).some(
    (v) => v !== null && v !== "" && v !== false && (Array.isArray(v) ? v.length > 0 : true)
  );

  return (
    <div className="flex items-center gap-2">
      {/* Save Current Filter Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setSaveDialogOpen(true)}
        disabled={!hasActiveFilters}
        className="gap-2"
      >
        <Save className="w-4 h-4" />
        Simpan Filter
      </Button>

      {/* Saved Filters Dropdown */}
      {savedFilters?.filters.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              <span>Filter Tersimpan</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="end" className="w-72 p-2">
            <div className="space-y-1">
              {savedFilters.filters.map((filter) => (
                <div
                  key={filter.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer transition-colors",
                    filter.isDefault && "bg-primary/10"
                  )}
                  onClick={() => onLoadFilter(filter.filters)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium truncate">{filter.name}</span>
                      {filter.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onLoadFilter(filter.filters);
                        }}
                      >
                        Terapkan
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setDefaultFilter.mutate(filter.id);
                        }}
                        disabled={filter.isDefault}
                      >
                        {filter.isDefault ? "Sudah Default" : "Jadikan Default"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Hapus filter ini?")) {
                            deleteFilter.mutate(filter.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Save Dialog */}
      <Popover open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="hidden">
            Save
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4">
          <div className="space-y-4">
            <h4 className="font-semibold">Simpan Filter Saat Ini</h4>
            <div className="space-y-2">
              <Label htmlFor="filter-name">Nama Filter</Label>
              <Input
                id="filter-name"
                placeholder="Contoh: Tugas Urgent Minggu Ini"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setSaveDialogOpen(false)}>
                Batal
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saveFilter.isPending}>
                {saveFilter.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}