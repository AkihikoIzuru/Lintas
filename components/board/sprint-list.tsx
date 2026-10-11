"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Flag,
  Trash2,
  Edit2,
  Target,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isCompleted: boolean;
  project: {
    id: string;
    name: string;
    key: string;
    color: string;
  } | null;
  _count: {
    tasks: number;
  };
}

interface SprintListProps {
  workspaceId: string;
  workspaceSlug?: string;
  projectId?: string;
  onSprintClick?: (sprintId: string) => void;
}

export function SprintList({ workspaceId, workspaceSlug, projectId, onSprintClick }: SprintListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    goal: "",
    startDate: "",
    endDate: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["sprints", workspaceId, projectId],
    queryFn: async () => {
      const params = new URLSearchParams({ workspaceId });
      if (projectId) params.append("projectId", projectId);
      const res = await fetch(`/api/sprints?${params}`);
      if (!res.ok) throw new Error("Gagal memuat sprint");
      return res.json();
    },
  });

  const createSprint = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/sprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, workspaceId, projectId: projectId || undefined }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal membuat sprint");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", workspaceId, projectId] });
      setCreateDialogOpen(false);
      setFormData({ name: "", goal: "", startDate: "", endDate: "" });
      toast({ title: "Berhasil", description: "Sprint berhasil dibuat" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const deleteSprint = useMutation({
    mutationFn: async (sprintId: string) => {
      const res = await fetch(`/api/sprints/${sprintId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus sprint");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", workspaceId, projectId] });
      toast({ title: "Berhasil", description: "Sprint dihapus" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="py-6">
              <div className="h-20 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const sprints: Sprint[] = data?.sprints || [];

  if (sprints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Flag className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-medium">Belum ada sprint</h3>
          <p className="text-muted-foreground text-sm">
            Buat sprint pertama untuk mulai merencanakan pekerjaan tim
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <CardTitle>Sprint ({sprints.length})</CardTitle>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Sprint Baru
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buat Sprint Baru</DialogTitle>
              <DialogDescription>Atur nama, tujuan, dan jadwal sprint</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createSprint.mutate(formData); }}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Sprint</Label>
                  <Input
                    id="name"
                    placeholder="Contoh: Sprint 1 - Q4 2024"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal">Tujuan Sprint (Opsional)</Label>
                  <Textarea
                    id="goal"
                    placeholder="Apa yang ingin dicapai sprint ini?"
                    value={formData.goal}
                    onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Tanggal Mulai</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      min={format(today, "yyyy-MM-dd")}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Tanggal Berakhir</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      min={formData.startDate || format(today, "yyyy-MM-dd")}
                      required
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={createSprint.isPending}>
                  {createSprint.isPending ? "Membuat..." : "Buat Sprint"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {sprints.map((sprint) => {
          const startDate = new Date(sprint.startDate);
          const endDate = new Date(sprint.endDate);
          const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const elapsedDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
          const progress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));

          return (
            <Card
              key={sprint.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                if (onSprintClick) {
                  onSprintClick(sprint.id);
                } else if (workspaceSlug) {
                  router.push(`/w/${workspaceSlug}/sprints/${sprint.id}`);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Flag className={cn("w-5 h-5", sprint.isActive ? "text-primary" : "text-muted-foreground")} />
                      <h3 className="font-semibold truncate">{sprint.name}</h3>
                      {sprint.isActive && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Aktif
                        </Badge>
                      )}
                      {sprint.isCompleted && (
                        <Badge variant="secondary">Selesai</Badge>
                      )}
                      {!sprint.isActive && !sprint.isCompleted && startDate > today && (
                        <Badge variant="outline">Akan Datang</Badge>
                      )}
                    </div>
                    {sprint.goal && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{sprint.goal}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{format(startDate, "d MMM", { locale: id })} - {format(endDate, "d MMM yyyy", { locale: id })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{totalDays} hari</span>
                      </div>
                      {sprint.project && (
                        <div className="flex items-center gap-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: sprint.project.color }}
                          />
                          <span>{sprint.project.key}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{sprint._count.tasks} tugas</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 min-w-[120px]">
                    <div className="w-full">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{Math.round(progress)}%</span>
                        <span>{remainingDays} hari tersisa</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Hapus sprint ini?")) deleteSprint.mutate(sprint.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent            </Card>
          );
        })}
      </div>
    </div>
  );
}