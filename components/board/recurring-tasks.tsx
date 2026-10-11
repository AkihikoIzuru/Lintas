"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, Edit2, Calendar, RotateCcw, Clock, ChevronDown, ChevronUp, X, Save, CheckCircle2, AlertCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn, formatDate } from "@/lib/utils";
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
import { Switch } from "@/components/ui/switch";

interface RecurringTask {
  id: string;
  name: string;
  templateData: any;
  frequency: string;
  interval: number;
  daysOfWeek: number[] | null;
  dayOfMonth: number | null;
  nextOccurrence: string;
  isActive: boolean;
  projectId: string;
  project: {
    id: string;
    name: string;
    key: string;
  };
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface RecurringTasksProps {
  projectId?: string;
}

const FREQUENCIES = [
  { value: "daily", label: "Harian" },
  { value: "weekly", label: "Mingguan" },
  { value: "monthly", label: "Bulanan" },
  { value: "custom", label: "Kustom" },
];

export function RecurringTasks({ projectId }: RecurringTasksProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<RecurringTask | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "all">("active");

  const { data, isLoading } = useQuery({
    queryKey: ["recurring-tasks", { projectId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.append("projectId", projectId);
      params.append("limit", "50");
      const res = await fetch(`/api/recurring-tasks?${params}`);
      if (!res.ok) throw new Error("Gagal memuat recurring tasks");
      return res.json();
    },
  });

  const createRecurringTask = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/recurring-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, projectId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal membuat recurring task");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-tasks"] });
      setCreateDialogOpen(false);
      resetForm();
      toast({ title: "Berhasil", description: "Recurring task dibuat" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const updateRecurringTask = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RecurringTask> }) => {
      const res = await fetch(`/api/recurring-tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Gagal memperbarui recurring task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-tasks"] });
      setCreateDialogOpen(false);
      setEditingTask(null);
      resetForm();
      toast({ title: "Berhasil", description: "Recurring task diperbarui" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const deleteRecurringTask = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/recurring-tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus recurring task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-tasks"] });
      toast({ title: "Berhasil", description: "Recurring task dihapus" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/recurring-tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Gagal mengubah status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-tasks"] });
      toast({ title: "Berhasil", description: "Status diperbarui" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const triggerRecurringTask = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/recurring-tasks/${id}/trigger`, {
        method: "POST",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal menjalankan recurring task");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-tasks"] });
      toast({ title: "Berhasil", description: "Tugas dibuat dari template" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    templateData: {
      title: "",
      description: "",
      priority: "MEDIUM",
      columnId: "",
      labels: [],
      assignees: [],
    },
    frequency: "weekly",
    interval: 1,
    daysOfWeek: [] as number[],
    dayOfMonth: 1,
    nextOccurrence: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    isActive: true,
  });

  const recurringTasks: RecurringTask[] = data?.recurringTasks || [];
  const activeTasks = recurringTasks.filter(t => t.isActive);
  const inactiveTasks = recurringTasks.filter(t => !t.isActive);

  const openCreateDialog = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const openEditDialog = (task: RecurringTask) => {
    setEditingTask(task);
    setFormData({
      name: task.name,
      templateData: task.templateData,
      frequency: task.frequency,
      interval: task.interval,
      daysOfWeek: task.daysOfWeek || [],
      dayOfMonth: task.dayOfMonth || 1,
      nextOccurrence: new Date(task.nextOccurrence).toISOString().slice(0, 16),
      isActive: task.isActive,
    });
    setCreateDialogOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      name: formData.name,
      templateData: formData.templateData,
      frequency: formData.frequency,
      interval: formData.interval,
      daysOfWeek: formData.frequency === "weekly" ? formData.daysOfWeek : null,
      dayOfMonth: formData.frequency === "monthly" ? formData.dayOfMonth : null,
      nextOccurrence: formData.nextOccurrence,
      isActive: formData.isActive,
    };
    if (editingTask) {
      updateRecurringTask.mutate({ id: editingTask.id, data });
    } else {
      createRecurringTask.mutate(data);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      templateData: {
        title: "",
        description: "",
        priority: "MEDIUM",
        columnId: "",
        labels: [],
        assignees: [],
      },
      frequency: "weekly",
      interval: 1,
      daysOfWeek: [],
      dayOfMonth: 1,
      nextOccurrence: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      isActive: true,
    });
    setEditingTask(null);
  };

  const getFrequencyLabel = (freq: string) => {
    return FREQUENCIES.find(f => f.value === freq)?.label || freq;
  };

  const getNextOccurrenceLabel = (task: RecurringTask) => {
    const now = new Date();
    const next = new Date(task.nextOccurrence);
    const diffDays = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "Terlewat";
    if (diffDays === 0) return "Hari ini";
    if (diffDays === 1) return "Besok";
    return `${diffDays} hari lagi (${formatDate(task.nextOccurrence)})`;
  };

  if (isLoading) {
    return <Card><CardContent className="py-6"><div className="h-20 bg-muted animate-pulse rounded" /></CardContent></Card>;
  }

  const displayTasks = activeTab === "active" ? activeTasks : recurringTasks;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Recurring Tasks
            </CardTitle>
            <CardDescription>Otomatisasi pembuatan tugas berulang</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Buat Baru
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("active")}
          >
            Aktif ({activeTasks.length})
          </Button>
          <Button
            variant={activeTab === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("all")}
          >
            Semua ({recurringTasks.length})
          </Button>
        </div>

        {displayTasks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Belum ada recurring task</p>
            <p className="text-sm mt-1">Buat tugas berulang untuk mengotomatisasi pekerjaan rutin</p>
            <Button variant="outline" className="mt-4" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Buat Recurring Task Pertama
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {displayTasks.map((task) => (
              <RecurringTaskCard
                key={task.id}
                task={task}
                onEdit={openEditDialog}
                onDelete={(id) => deleteRecurringTask.mutate(id)}
                onToggle={(isActive) => toggleActive.mutate({ id: task.id, isActive })}
                onTrigger={(id) => triggerRecurringTask.mutate(id)}
              />
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={(open) => { if (!open) { setCreateDialogOpen(false); setEditingTask(null); resetForm(); } }}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTask ? "Edit Recurring Task" : "Buat Recurring Task Baru"}</DialogTitle>
              <DialogDescription>Konfigurasi tugas yang dibuat secara otomatis secara berkala</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="recurring-name">Nama Pola</Label>
                  <Input
                    id="recurring-name"
                    placeholder="Contoh: Weekly Sprint Review, Monthly Report"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Frekuensi</Label>
                  <Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map((f) => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurring-interval">Interval</Label>
                  <Input
                    id="recurring-interval"
                    type="number"
                    min="1"
                    max="52"
                    value={formData.interval}
                    onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) || 1 })}
                  />
                  <p className="text-xs text-muted-foreground">Setiap {formData.interval} {formData.frequency === "daily" ? "hari" : formData.frequency === "weekly" ? "minggu" : "bulan"}</p>
                </div>

                {formData.frequency === "weekly" && (
                  <div className="space-y-2">
                    <Label>Hari dalam Minggu</Label>
                    <div className="flex flex-wrap gap-2">
                      {["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((day, index) => (
                        <label key={index} className="inline-flex items-center gap-1 px-3 py-1 rounded border text-sm cursor-pointer hover:bg-accent">
                          <input
                            type="checkbox"
                            checked={formData.daysOfWeek.includes(index)}
                            onChange={(e) => setFormData({
                              ...formData,
                              daysOfWeek: e.target.checked
                                ? [...formData.daysOfWeek, index]
                                : formData.daysOfWeek.filter(d => d !== index),
                            })}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          {day}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {formData.frequency === "monthly" && (
                  <div className="space-y-2">
                    <Label htmlFor="recurring-day">Tanggal dalam Bulan</Label>
                    <Input
                      id="recurring-day"
                      type="number"
                      min="1"
                      max="31"
                      value={formData.dayOfMonth}
                      onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="recurring-next">Kejadian Berikutnya</Label>
                  <Input
                    id="recurring-next"
                    type="datetime-local"
                    value={formData.nextOccurrence}
                    onChange={(e) => setFormData({ ...formData, nextOccurrence: e.target.value })}
                  />
                </div>

                <div className="space-y-4 border-t pt-4">
                  <Label className="font-medium">Template Tugas (Data yang akan digunakan saat membuat tugas)</Label>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-title">Judul Tugas</Label>
                      <Input
                        id="template-title"
                        placeholder="Judul tugas yang akan dibuat"
                        value={formData.templateData.title}
                        onChange={(e) => setFormData({ ...formData, templateData: { ...formData.templateData, title: e.target.value } })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="template-desc">Deskripsi</Label>
                      <Textarea
                        id="template-desc"
                        placeholder="Deskripsi tugas..."
                        value={formData.templateData.description}
                        onChange={(e) => setFormData({ ...formData, templateData: { ...formData.templateData, description: e.target.value } })}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Prioritas</Label>
                      <Select value={formData.templateData.priority} onValueChange={(v) => setFormData({ ...formData, templateData: { ...formData.templateData, priority: v } })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Rendah</SelectItem>
                          <SelectItem value="MEDIUM">Sedang</SelectItem>
                          <SelectItem value="HIGH">Tinggi</SelectItem>
                          <SelectItem value="URGENT">Mendesak</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="recurring-active"
                        checked={formData.isActive}
                        onCheckedChange={(c) => setFormData({ ...formData, isActive: c })}
                      />
                      <Label htmlFor="recurring-active" className="cursor-pointer">Aktifkan recurring task ini</Label>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setCreateDialogOpen(false); setEditingTask(null); resetForm(); }}>
                  Batal
                </Button>
                <Button type="submit" disabled={createRecurringTask.isPending || updateRecurringTask.isPending}>
                  {createRecurringTask.isPending || updateRecurringTask.isPending ? "Menyimpan..." : editingTask ? "Simpan Perubahan" : "Buat Recurring Task"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function RecurringTaskCard({ task, onEdit, onDelete, onToggle, onTrigger }: {
  task: RecurringTask;
  onEdit: (task: RecurringTask) => void;
  onDelete: (id: string) => void;
  onToggle: (isActive: boolean) => void;
  onTrigger: (id: string) => void;
}) {
  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = { daily: "Harian", weekly: "Mingguan", monthly: "Bulanan", custom: "Kustom" };
    return labels[freq] || freq;
  };

  const getNextOccurrenceLabel = (task: RecurringTask) => {
    const now = new Date();
    const next = new Date(task.nextOccurrence);
    const diffDays = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: "Terlewat", color: "text-red-500" };
    if (diffDays === 0) return { label: "Hari ini", color: "text-yellow-500" };
    if (diffDays === 1) return { label: "Besok", color: "text-green-500" };
    return { label: `${diffDays} hari lagi (${formatDate(task.nextOccurrence)})`, color: "text-muted-foreground" };
  };

  const nextLabel = getNextOccurrenceLabel(task);

  return (
    <div className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium">{task.name}</span>
            <Switch
              checked={task.isActive}
              onCheckedChange={onToggle}
              aria-label={task.isActive ? "Nonaktifkan" : "Aktifkan"}
            />
            {task.isActive ? <Badge variant="default" className="text-xs">Aktif</Badge> : <Badge variant="secondary" className="text-xs">Nonaktif</Badge>}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
            <span className="flex items-center gap-1">
              <RotateCcw className="w-3 h-3" />
              {getFrequencyLabel(task.frequency)}
              {task.interval > 1 && ` setiap ${task.interval}`}
            </span>
            {task.frequency === "weekly" && task.daysOfWeek && task.daysOfWeek.length > 0 && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {task.daysOfWeek.map(d => ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"][d]).join(", ")}
              </span>
            )}
            {task.frequency === "monthly" && task.dayOfMonth && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Tanggal ke-{task.dayOfMonth}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Berikutnya: <span className={nextLabel.color + " font-medium"}>{nextLabel.label}</span>
            </span>
            <Badge variant="secondary" className="text-xs">{task.project.key}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Template: "{task.templateData.title}" • {task.templateData.priority}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onTrigger(task.id)} title="Jalankan sekarang">
            <Play className="w-4 h-4 mr-2" />
            Jalankan
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onEdit(task)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(task.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}