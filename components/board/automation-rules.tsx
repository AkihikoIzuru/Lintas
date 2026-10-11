"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit2, ToggleLeft, ToggleRight, Copy, Loader2, Zap, Target, ArrowRight, Settings, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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
import {
  Switch,
} from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const TRIGGER_LABELS: Record<string, string> = {
  TASK_CREATED: "Tugas Dibuat",
  TASK_UPDATED: "Tugas Diperbarui",
  TASK_MOVED: "Tugas Dipindahkan",
  TASK_COMPLETED: "Tugas Selesai",
  TASK_OVERDUE: "Tugas Terlambat",
  SPRINT_STARTED: "Sprint Dimulai",
  SPRINT_ENDED: "Sprint Berakhir",
  COMMENT_ADDED: "Komentar Ditambahkan",
  MENTION_ADDED: "Mention Ditambahkan",
};

const ACTION_LABELS: Record<string, string> = {
  ASSIGN_USER: "Tetapkan Pengguna",
  CHANGE_PRIORITY: "Ubah Prioritas",
  CHANGE_STATUS: "Ubah Status",
  ADD_LABEL: "Tambah Label",
  REMOVE_LABEL: "Hapus Label",
  SET_DUE_DATE: "Atur Tanggal Jatuh Tempo",
  ADD_TO_SPRINT: "Tambah ke Sprint",
  REMOVE_FROM_SPRINT: "Hapus dari Sprint",
  SEND_NOTIFICATION: "Kirim Notifikasi",
  CREATE_TASK: "Buat Tugas",
  WEBHOOK: "Panggil Webhook",
};

interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  trigger: string;
  conditions: any[];
  actions: any[];
  enabled: boolean;
  projectId: string | null;
  workspaceId: string | null;
}

interface AutomationRulesManagerProps {
  projectId?: string;
  workspaceId?: string;
}

export function AutomationRulesManager({ projectId, workspaceId }: AutomationRulesManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [activeStep, setActiveStep] = useState<"trigger" | "conditions" | "actions">("trigger");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    trigger: "TASK_CREATED",
    conditions: [] as any[],
    actions: [] as any[],
    enabled: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["automation-rules", projectId, workspaceId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.append("projectId", projectId);
      if (workspaceId) params.append("workspaceId", workspaceId);
      const res = await fetch(`/api/automation-rules?${params}`);
      if (!res.ok) throw new Error("Gagal memuat aturan otomatisasi");
      return res.json();
    },
    enabled: !!projectId || !!workspaceId,
  });

  const createRule = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/automation-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, projectId, workspaceId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal membuat aturan");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules", projectId, workspaceId] });
      setCreateDialogOpen(false);
      resetForm();
      toast({ title: "Berhasil", description: "Aturan otomatisasi dibuat" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const res = await fetch(`/api/automation-rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Gagal memperbarui aturan");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules", projectId, workspaceId] });
      setEditDialogOpen(false);
      setEditingRule(null);
      resetForm();
      toast({ title: "Berhasil", description: "Aturan diperbarui" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/automation-rules/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus aturan");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules", projectId, workspaceId] });
      toast({ title: "Berhasil", description: "Aturan dihapus" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const res = await fetch(`/api/automation-rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error("Gagal mengubah status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules", projectId, workspaceId] });
    },
  });

  const duplicateRule = useMutation({
    mutationFn: async (rule: AutomationRule) => {
      const res = await fetch("/api/automation-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rule,
          name: `${rule.name} (Copy)`,
          id: undefined,
          createdAt: undefined,
          updatedAt: undefined,
          projectId,
          workspaceId,
        }),
      });
      if (!res.ok) throw new Error("Gagal menduplikasi aturan");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules", projectId, workspaceId] });
      toast({ title: "Berhasil", description: "Aturan diduplikasi" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      trigger: "TASK_CREATED",
      conditions: [],
      actions: [],
      enabled: true,
    });
    setActiveStep("trigger");
  };

  const openCreateDialog = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const openEditDialog = (rule: AutomationRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || "",
      trigger: rule.trigger,
      conditions: rule.conditions || [],
      actions: rule.actions || [],
      enabled: rule.enabled,
    });
    setEditDialogOpen(true);
  };

  const addCondition = () => {
    setFormData((prev) => ({
      ...prev,
      conditions: [...prev.conditions, { field: "", operator: "equals", value: "" }],
    }));
  };

  const removeCondition = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));
  };

  const updateCondition = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      conditions: prev.conditions.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    }));
  };

  const addAction = () => {
    setFormData((prev) => ({
      ...prev,
      actions: [...prev.actions, { type: "ASSIGN_USER", config: {} }],
    }));
  };

  const removeAction = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index),
    }));
  };

  const updateAction = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      actions: prev.actions.map((a, i) =>
        i === index ? { ...a, [field]: value, config: { ...a.config, ...value } } : a
      ),
    }));
  };

  const rules: AutomationRule[] = data?.rules || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="h-20 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Aturan Otomatisasi
            </CardTitle>
            <CardDescription>
              {projectId ? "Proyek" : "Workspace"} - Otomatisasi alur kerja dengan trigger → kondisi → aksi
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Buat Aturan
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {rules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Belum ada aturan otomatisasi</p>
            <p className="text-sm mt-1">Buat aturan untuk mengotomatiskan tugas berulang</p>
            <Button variant="outline" className="mt-4" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Buat Aturan Pertama
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <AutomationRuleCard
                key={rule.id}
                rule={rule}
                onEdit={openEditDialog}
                onDelete={(id) => deleteRule.mutate(id)}
                onToggle={(id, enabled) => toggleRule.mutate({ id, enabled })}
                onDuplicate={() => duplicateRule.mutate(rule)}
              />
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={createDialogOpen || editDialogOpen} onOpenChange={(open) => { if (!open) { setCreateDialogOpen(false); setEditDialogOpen(false); setEditingRule(null); resetForm(); } }}>
          <DialogContent className="max-w-3xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{editingRule ? "Edit Aturan Otomatisasi" : "Buat Aturan Otomatisasi Baru"}</DialogTitle>
              <DialogDescription>
                Aturan mengikuti pola: Ketika {trigger} → Jika {kondisi} → Maka {aksi}
              </DialogDescription>
            </DialogHeader>

            <Tabs value={activeStep} onValueChange={setActiveStep} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="trigger"><Target className="w-4 h-4 mr-2" /> Trigger</TabsTrigger>
                <TabsTrigger value="conditions"><Settings className="w-4 h-4 mr-2" /> Kondisi</TabsTrigger>
                <TabsTrigger value="actions"><ArrowRight className="w-4 h-4 mr-2" /> Aksi</TabsTrigger>
              </TabsList>

              <TabsContent value="trigger" className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rule-name">Nama Aturan</Label>
                  <Input
                    id="rule-name"
                    placeholder="Contoh: Otomatis tetapkan reviewer saat tugas dipindahkan ke Review"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rule-description">Deskripsi (Opsional)</Label>
                  <Textarea
                    id="rule-description"
                    placeholder="Jelaskan apa yang dilakukan aturan ini..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Trigger (Kapan aturan dijalankan)</Label>
                  <Select value={formData.trigger} onValueChange={(v) => setFormData({ ...formData, trigger: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TRIGGER_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">Aturan akan dijalankan setiap kali trigger ini terjadi</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="rule-enabled"
                    checked={formData.enabled}
                    onCheckedChange={(c) => setFormData({ ...formData, enabled: c })}
                  />
                  <Label htmlFor="rule-enabled" className="cursor-pointer">Aktifkan aturan ini</Label>
                </div>
              </TabsContent>

              <TabsContent value="conditions" className="py-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="mb-0">Kondisi (Opsional - aturan dijalankan jika SEMUA terpenuhi)</Label>
                  <Button variant="outline" size="sm" onClick={addCondition}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Kondisi
                  </Button>
                </div>
                {formData.conditions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Belum ada kondisi</p>
                    <p className="text-sm">Aturan akan dijalankan setiap kali trigger terjadi tanpa kondisi tambahan</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.conditions.map((condition, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <Label className="w-20 mb-0 text-sm">Field</Label>
                        <Select
                          value={condition.field}
                          onValueChange={(v) => updateCondition(index, "field", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih field" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="priority">Prioritas</SelectItem>
                            <SelectItem value="status">Status</SelectItem>
                            <SelectItem value="assignee">Penugasan</SelectItem>
                            <SelectItem value="label">Label</SelectItem>
                            <SelectItem value="dueDate">Tanggal Jatuh Tempo</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={condition.operator}
                          onValueChange={(v) => updateCondition(index, "operator", v)}
                          className="w-36"
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Sama dengan</SelectItem>
                            <SelectItem value="not_equals">Tidak sama dengan</SelectItem>
                            <SelectItem value="contains">Mengandung</SelectItem>
                            <SelectItem value="not_contains">Tidak mengandung</SelectItem>
                            <SelectItem value="in">Salah satu dari</SelectItem>
                            <SelectItem value="not_in">Bukan salah satu dari</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Nilai"
                          value={condition.value || ""}
                          onChange={(e) => updateCondition(index, "value", e.target.value)}
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeCondition(index)} className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="actions" className="py-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="mb-0">Aksi (Minimal 1)</Label>
                  <Button variant="outline" size="sm" onClick={addAction}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Aksi
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.actions.map((action, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                      <Select
                        value={action.type}
                        onValueChange={(v) => updateAction(index, "type", v)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ACTION_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex-1 flex flex-wrap gap-2">
                        {renderActionConfig(action, index, updateAction)}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeAction(index)} className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                {formData.actions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Belum ada aksi</p>
                    <p className="text-sm">Tambahkan minimal 1 aksi yang akan dijalankan saat trigger dan kondisi terpenuhi</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setCreateDialogOpen(false); setEditDialogOpen(false); }}>
                Batal
              </Button>
              <Button
                onClick={() => { editingRule ? updateRule.mutate({ id: editingRule.id, data: formData }) : createRule.mutate(formData); }}
                disabled={!formData.name || formData.actions.length === 0 || createRule.isPending || updateRule.isPending}
              >
                {createRule.isPending || updateRule.isPending ? "Menyimpan..." : editingRule ? "Simpan Perubahan" : "Buat Aturan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function renderActionConfig(action: any, index: number, updateAction: (index: number, field: string, value: any) => void) {
  switch (action.type) {
    case "ASSIGN_USER":
      return (
        <>
          <Input placeholder="User ID" value={action.config.userId || ""} onChange={(e) => updateAction(index, "config", { ...action.config, userId: e.target.value })} />
        </>
      );
    case "CHANGE_PRIORITY":
      return (
        <>
          <Select value={action.config.priority || ""} onValueChange={(v) => updateAction(index, "config", { ...action.config, priority: v })}>
            <SelectTrigger><SelectValue placeholder="Prioritas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="URGENT">Urgent</SelectItem>
              <SelectItem value="HIGH">Tinggi</SelectItem>
              <SelectItem value="MEDIUM">Sedang</SelectItem>
              <SelectItem value="LOW">Rendah</SelectItem>
            </SelectContent>
          </Select>
        </>
      );
    case "CHANGE_STATUS":
      return (
        <>
          <Select value={action.config.status || ""} onValueChange={(v) => updateAction(index, "config", { ...action.config, status: v })}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="BACKLOG">Backlog</SelectItem>
              <SelectItem value="TODO">Siap</SelectItem>
              <SelectItem value="IN_PROGRESS">Dalam Proses</SelectItem>
              <SelectItem value="IN_REVIEW">Review</SelectItem>
              <SelectItem value="DONE">Selesai</SelectItem>
            </SelectContent>
          </Select>
        </>
      );
    case "ADD_LABEL":
    case "REMOVE_LABEL":
      return (
        <>
          <Input placeholder="Label ID" value={action.config.labelId || ""} onChange={(e) => updateAction(index, "config", { ...action.config, labelId: e.target.value })} />
        </>
      );
    case "SET_DUE_DATE":
      return (
        <>
          <Input type="number" placeholder="Hari dari sekarang" value={action.config.daysFromNow || ""} onChange={(e) => updateAction(index, "config", { ...action.config, daysFromNow: parseInt(e.target.value) })} />
        </>
      );
    case "ADD_TO_SPRINT":
    case "REMOVE_FROM_SPRINT":
      return (
        <>
          <Input placeholder="Sprint ID" value={action.config.sprintId || ""} onChange={(e) => updateAction(index, "config", { ...action.config, sprintId: e.target.value })} />
        </>
      );
    case "SEND_NOTIFICATION":
      return (
        <>
          <Input placeholder="Pesan notifikasi" value={action.config.message || ""} onChange={(e) => updateAction(index, "config", { ...action.config, message: e.target.value })} />
        </>
      );
    case "CREATE_TASK":
      return (
        <>
          <Input placeholder="Judul tugas" value={action.config.title || ""} onChange={(e) => updateAction(index, "config", { ...action.config, title: e.target.value })} className="w-48" />
          <Input placeholder="Column ID" value={action.config.columnId || ""} onChange={(e) => updateAction(index, "config", { ...action.config, columnId: e.target.value })} className="w-48" />
        </>
      );
    case "WEBHOOK":
      return (
        <>
          <Input placeholder="Webhook ID" value={action.config.webhookId || ""} onChange={(e) => updateAction(index, "config", { ...action.config, webhookId: e.target.value })} />
        </>
      );
    default:
      return null;
  }
}

function AutomationRuleCard({ rule, onEdit, onDelete, onToggle, onDuplicate }: {
  rule: AutomationRule;
  onEdit: (r: AutomationRule) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onDuplicate: () => void;
}) {
  return (
    <div className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium">{rule.name}</span>
            <Switch
              checked={rule.enabled}
              onCheckedChange={(c) => onToggle(rule.id, c)}
              aria-label={rule.enabled ? "Nonaktifkan" : "Aktifkan"}
            />
            {rule.enabled ? <Badge variant="default" className="text-xs">Aktif</Badge> : <Badge variant="secondary" className="text-xs">Nonaktif</Badge>}
          </div>
          {rule.description && <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {TRIGGER_LABELS[rule.trigger] || rule.trigger}
            </span>
            {rule.conditions.length > 0 && (
              <span className="flex items-center gap-1">
                <Settings className="w-3 h-3" />
                {rule.conditions.length} kondisi
              </span>
            )}
            <span className="flex items-center gap-1">
              <ArrowRight className="w-3 h-3" />
              {rule.actions.length} aksi
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(rule)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDuplicate}>
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(rule.id)} className="text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}