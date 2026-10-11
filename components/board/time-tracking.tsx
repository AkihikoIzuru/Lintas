"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Clock, Play, Pause, Trash2, Edit2, Calendar, Save, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn, formatRelativeTime, formatDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  duration: number; // minutes
  description: string | null;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  task: {
    id: string;
    title: string;
    project: {
      id: string;
      name: string;
      key: string;
    };
  };
}

interface TimeTrackingProps {
  projectId?: string;
  taskId?: string;
  userId?: string;
}

export function TimeTracking({ projectId, taskId, userId }: TimeTrackingProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [timerTaskId, setTimerTaskId] = useState<string | null>(null);
  const [timerStart, setTimerStart] = useState<Date | null>(null);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const exportTimeEntries = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.append("projectId", projectId);
      if (taskId) params.append("taskId", taskId);
      if (userId) params.append("userId", userId);
      params.append("format", "csv");
      const res = await fetch(`/api/time-entries/export?${params}`);
      if (!res.ok) throw new Error("Gagal mengekspor time entries");
      return res.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `time-entries-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Berhasil", description: "Time entries diekspor ke CSV" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["time-entries", { projectId, taskId, userId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.append("projectId", projectId);
      if (taskId) params.append("taskId", taskId);
      if (userId) params.append("userId", userId);
      params.append("limit", "100");
      const res = await fetch(`/api/time-entries?${params}`);
      if (!res.ok) throw new Error("Gagal memuat time entries");
      return res.json();
    },
  });

  const createTimeEntry = useMutation({
    mutationFn: async (data: { taskId: string; duration: number; description?: string; startedAt: string; endedAt?: string }) => {
      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal membuat time entry");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      setCreateDialogOpen(false);
      resetForm();
      toast({ title: "Berhasil", description: "Time entry ditambahkan" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const updateTimeEntry = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TimeEntry> }) => {
      const res = await fetch(`/api/time-entries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Gagal memperbarui time entry");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      setEditingEntry(null);
      resetForm();
      toast({ title: "Berhasil", description: "Time entry diperbarui" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const deleteTimeEntry = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/time-entries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus time entry");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      toast({ title: "Berhasil", description: "Time entry dihapus" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const [formData, setFormData] = useState({
    taskId: taskId || "",
    duration: 60,
    description: "",
    startedAt: new Date().toISOString().slice(0, 16),
    endedAt: "",
  });

  const timeEntries: TimeEntry[] = data?.timeEntries || [];
  const totalMinutes = timeEntries.reduce((sum, e) => sum + e.duration, 0);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}j ${mins}m` : `${mins}m`;
  };

  const startTimer = (entryTaskId: string) => {
    if (timerTaskId === entryTaskId) return;
    setTimerTaskId(entryTaskId);
    setTimerStart(new Date());
    setElapsedTime(0);
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((new Date().getTime() - (timerStart?.getTime() || 0)) / 1000 / 60));
    }, 1000);
    setTimerInterval(interval);
  };

  const stopTimer = () => {
    if (timerInterval) clearInterval(timerInterval);
    if (timerTaskId && timerStart) {
      const duration = Math.floor((new Date().getTime() - timerStart.getTime()) / 1000 / 60);
      if (duration > 0) {
        setFormData({
          taskId: timerTaskId,
          duration,
          description: "",
          startedAt: timerStart.toISOString().slice(0, 16),
          endedAt: new Date().toISOString().slice(0, 16),
        });
        setCreateDialogOpen(true);
      }
    }
    setTimerTaskId(null);
    setTimerStart(null);
    setTimerInterval(null);
    setElapsedTime(0);
  };

  const openCreateDialog = (prefillTaskId?: string) => {
    resetForm();
    if (prefillTaskId) setFormData(prev => ({ ...prev, taskId: prefillTaskId }));
    setCreateDialogOpen(true);
  };

  const openEditDialog = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setFormData({
      taskId: entry.taskId,
      duration: entry.duration,
      description: entry.description || "",
      startedAt: new Date(entry.startedAt).toISOString().slice(0, 16),
      endedAt: entry.endedAt ? new Date(entry.endedAt).toISOString().slice(0, 16) : "",
    });
    setCreateDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingEntry) {
      updateTimeEntry.mutate({
        id: editingEntry.id,
        data: {
          duration: formData.duration,
          description: formData.description || null,
          startedAt: formData.startedAt,
          endedAt: formData.endedAt || null,
        },
      });
    } else {
      createTimeEntry.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      taskId: taskId || "",
      duration: 60,
      description: "",
      startedAt: new Date().toISOString().slice(0, 16),
      endedAt: "",
    });
    setEditingEntry(null);
  };

  if (isLoading) {
    return <Card><CardContent className="py-6"><div className="h-20 bg-muted animate-pulse rounded" /></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Time Tracking
            </CardTitle>
            <CardDescription>Catat dan kelola waktu yang dihabiskan untuk tugas</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {timeEntries.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => exportTimeEntries.mutate()} disabled={exportTimeEntries.isPending}>
                <Download className="w-4 h-4 mr-2" />
                Ekspor CSV
              </Button>
            )}
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Waktu
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Waktu</p>
            <p className="text-2xl font-bold">{formatDuration(totalMinutes)}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Entries</p>
            <p className="text-2xl font-bold">{timeEntries.length}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Rata-rata/Entry</p>
            <p className="text-2xl font-bold">{timeEntries.length > 0 ? formatDuration(Math.round(totalMinutes / timeEntries.length)) : "0m"}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            {timerTaskId ? (
              <Button variant="destructive" onClick={stopTimer} className="w-full">
                <Pause className="w-4 h-4 mr-2" />
                Stop Timer ({formatDuration(elapsedTime)})
              </Button>
            ) : (
              <Button variant="outline" onClick={() => openCreateDialog()} className="w-full">
                <Play className="w-4 h-4 mr-2" />
                Mulai Timer
              </Button>
            )}
          </div>
        </div>

        {/* Time Entries List */}
        {timeEntries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Belum ada time entry</p>
            <p className="text-sm mt-1">Mulai melacak waktu untuk tugas Anda</p>
            <Button variant="outline" className="mt-4" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Time Entry Pertama
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {timeEntries.map((entry) => (
              <TimeEntryCard
                key={entry.id}
                entry={entry}
                isTimerActive={timerTaskId === entry.taskId}
                onEdit={openEditDialog}
                onDelete={(id) => deleteTimeEntry.mutate(id)}
              />
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={(open) => { if (!open) { setCreateDialogOpen(false); setEditingEntry(null); resetForm(); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingEntry ? "Edit Time Entry" : "Tambah Time Entry"}</DialogTitle>
              <DialogDescription>Catat waktu yang dihabiskan untuk tugas</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="time-task">Tugas</Label>
                  <Input
                    id="time-task"
                    placeholder="Pilih tugas..."
                    value={formData.taskId}
                    onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
                    disabled={!!taskId}
                  />
                  {taskId && <p className="text-xs text-muted-foreground">Tugas terkunci karena dilihat dari detail tugas</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="time-duration">Durasi (menit)</Label>
                    <Input
                      id="time-duration"
                      type="number"
                      min="1"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time-started">Mulai</Label>
                    <Input
                      id="time-started"
                      type="datetime-local"
                      value={formData.startedAt}
                      onChange={(e) => setFormData({ ...formData, startedAt: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time-ended">Selesai (Opsional)</Label>
                  <Input
                    id="time-ended"
                    type="datetime-local"
                    value={formData.endedAt}
                    onChange={(e) => setFormData({ ...formData, endedAt: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time-desc">Deskripsi</Label>
                  <Textarea
                    id="time-desc"
                    placeholder="Apa yang dikerjakan..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setCreateDialogOpen(false); setEditingEntry(null); resetForm(); }}>
                  Batal
                </Button>
                <Button type="submit" disabled={createTimeEntry.isPending || updateTimeEntry.isPending}>
                  {createTimeEntry.isPending || updateTimeEntry.isPending ? "Menyimpan..." : editingEntry ? "Simpan Perubahan" : "Tambah Time Entry"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function TimeEntryCard({ entry, isTimerActive, onEdit, onDelete }: {
  entry: TimeEntry;
  isTimerActive: boolean;
  onEdit: (entry: TimeEntry) => void;
  onDelete: (id: string) => void;
}) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}j ${mins}m` : `${mins}m`;
  };

  return (
    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Clock className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{entry.task.title}</span>
            <Badge variant="secondary" className="text-xs">{entry.task.project.key}</Badge>
            {isTimerActive && <Badge variant="default" className="text-xs animate-pulse">⏱ Aktif</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{formatDuration(entry.duration)} • {formatDate(entry.startedAt)}</p>
          {entry.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{entry.description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => onEdit(entry)}>
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(entry.id)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}