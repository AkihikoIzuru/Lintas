"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit2, CheckCircle2, XCircle2, Loader2, ExternalLink, Send, Copy, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const WEBHOOK_EVENTS = [
  "task.created", "task.updated", "task.moved", "task.completed", "task.deleted",
  "comment.created", "comment.updated", "comment.deleted",
  "sprint.created", "sprint.started", "sprint.completed",
  "user.assigned", "user.unassigned",
  "label.added", "label.removed",
  "custom_field.changed",
  "dependency.added", "dependency.removed",
];

const EVENT_LABELS: Record<string, string> = {
  "task.created": "Tugas Dibuat",
  "task.updated": "Tugas Diperbarui",
  "task.moved": "Tugas Dipindahkan",
  "task.completed": "Tugas Selesai",
  "task.deleted": "Tugas Dihapus",
  "comment.created": "Komentar Dibuat",
  "comment.updated": "Komentar Diperbarui",
  "comment.deleted": "Komentar Dihapus",
  "sprint.created": "Sprint Dibuat",
  "sprint.started": "Sprint Dimulai",
  "sprint.completed": "Sprint Selesai",
  "user.assigned": "Pengguna Ditugaskan",
  "user.unassigned": "Pengguna Dilepas",
  "label.added": "Label Ditambahkan",
  "label.removed": "Label Dihapus",
  "custom_field.changed": "Custom Field Diubah",
  "dependency.added": "Dependensi Ditambahkan",
  "dependency.removed": "Dependensi Dihapus",
};

interface Webhook {
  id: string;
  name: string;
  url: string;
  secret: string | null;
  events: string[];
  enabled: boolean;
  projectId: string | null;
  workspaceId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WebhookManagerProps {
  projectId?: string;
  workspaceId?: string;
}

export function WebhookManager({ projectId, workspaceId }: WebhookManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    secret: "",
    events: [] as string[],
    enabled: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["webhooks", projectId, workspaceId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.append("projectId", projectId);
      if (workspaceId) params.append("workspaceId", workspaceId);
      const res = await fetch(`/api/webhooks?${params}`);
      if (!res.ok) throw new Error("Gagal memuat webhook");
      return res.json();
    },
    enabled: !!projectId || !!workspaceId,
  });

  const createWebhook = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, projectId, workspaceId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal membuat webhook");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks", projectId, workspaceId] });
      setCreateDialogOpen(false);
      resetForm();
      toast({ title: "Berhasil", description: "Webhook dibuat" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const updateWebhook = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const res = await fetch(`/api/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Gagal memperbarui webhook");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks", projectId, workspaceId] });
      setEditDialogOpen(false);
      setEditingWebhook(null);
      resetForm();
      toast({ title: "Berhasil", description: "Webhook diperbarui" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const deleteWebhook = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus webhook");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks", projectId, workspaceId] });
      toast({ title: "Berhasil", description: "Webhook dihapus" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const testWebhook = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/webhooks/${id}/test`, { method: "POST" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal menguji webhook");
      }
      return res.json();
    },
    onSuccess: (data, id) => {
      setTestDialogOpen(true);
      setTestingWebhookId(id);
      toast({ title: "Berhasil", description: "Webhook uji coba dikirim" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const copyWebhookUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Disalin", description: "URL webhook disalin ke clipboard" });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      url: "",
      secret: "",
      events: [],
      enabled: true,
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const openEditDialog = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      secret: webhook.secret || "",
      events: webhook.events || [],
      enabled: webhook.enabled,
    });
    setEditDialogOpen(true);
  };

  const webhooks: Webhook[] = data?.webhooks || [];
  const availableEvents = data?.availableEvents || WEBHOOK_EVENTS;

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
              <ExternalLink className="w-5 h-5" />
              Webhook
            </CardTitle>
            <CardDescription>
              {projectId ? "Proyek" : "Workspace"} - Integrasi dengan sistem eksternal via HTTP callbacks
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Webhook
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {webhooks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ExternalLink className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Belum ada webhook</p>
            <p className="text-sm mt-1">Tambahkan webhook untuk menerima notifikasi real-time dari sistem eksternal</p>
            <Button variant="outline" className="mt-4" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Buat Webhook Pertama
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {webhooks.map((webhook) => (
              <WebhookCard
                key={webhook.id}
                webhook={webhook}
                onEdit={openEditDialog}
                onDelete={(id) => deleteWebhook.mutate(id)}
                onTest={(id) => testWebhook.mutate(id)}
                onCopyUrl={copyWebhookUrl}
                isTesting={testingWebhookId === webhook.id && testWebhook.isPending}
              />
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={createDialogOpen || editDialogOpen} onOpenChange={(open) => { if (!open) { setCreateDialogOpen(false); setEditDialogOpen(false); setEditingWebhook(null); resetForm(); } }}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingWebhook ? "Edit Webhook" : "Buat Webhook Baru"}</DialogTitle>
              <DialogDescription>
                Konfigurasi endpoint HTTP untuk menerima event real-time
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); editingWebhook ? updateWebhook.mutate({ id: editingWebhook.id, data: formData }) : createWebhook.mutate(formData); }}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-name">Nama Webhook</Label>
                  <Input
                    id="webhook-name"
                    placeholder="Contoh: Slack Notifications, CI/CD Trigger"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">URL Endpoint</Label>
                  <Input
                    id="webhook-url"
                    type="url"
                    placeholder="https://your-server.com/webhook"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhook-secret">Secret (Opsional)</Label>
                  <Input
                    id="webhook-secret"
                    type="password"
                    placeholder="Secret untuk verifikasi signature"
                    value={formData.secret}
                    onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Digunakan untuk menghasilkan HMAC SHA256 signature di header X-Lintas-Signature</p>
                </div>
                <div className="space-y-2">
                  <Label>Event yang Dikirim</Label>
                  <div className="max-h-60 overflow-auto border rounded p-2 space-y-1">
                    {availableEvents.map((event) => (
                      <label key={event} className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.events.includes(event)}
                          onChange={(e) => setFormData({
                            ...formData,
                            events: e.target.checked
                              ? [...formData.events, event]
                              : formData.events.filter((ev) => ev !== event),
                          })}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm">{EVENT_LABELS[event] || event}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formData.events.length} event dipilih dari {availableEvents.length} tersedia
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="webhook-enabled"
                    checked={formData.enabled}
                    onCheckedChange={(c) => setFormData({ ...formData, enabled: c })}
                  />
                  <Label htmlFor="webhook-enabled" className="cursor-pointer">Aktifkan webhook ini</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setCreateDialogOpen(false); setEditDialogOpen(false); }}>
                  Batal
                </Button>
                <Button type="submit" disabled={createWebhook.isPending || updateWebhook.isPending}>
                  {createWebhook.isPending || updateWebhook.isPending ? "Menyimpan..." : editingWebhook ? "Simpan Perubahan" : "Buat Webhook"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Test Dialog */}
        <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Uji Coba Webhook Berhasil
              </DialogTitle>
              <DialogDescription>
                Payload uji coba telah dikirim ke endpoint webhook
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => { setTestDialogOpen(false); setTestingWebhookId(null); }}>
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function WebhookCard({ webhook, onEdit, onDelete, onTest, onCopyUrl, isTesting }: {
  webhook: Webhook;
  onEdit: (w: Webhook) => void;
  onDelete: (id: string) => void;
  onTest: (id: string) => void;
  onCopyUrl: (url: string) => void;
  isTesting: boolean;
}) {
  return (
    <div className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium">{webhook.name}</span>
            <Switch
              checked={webhook.enabled}
              onCheckedChange={(c) => onEdit({ ...webhook, enabled: c })}
              aria-label={webhook.enabled ? "Nonaktifkan" : "Aktifkan"}
            />
            {webhook.enabled ? <Badge variant="default" className="text-xs">Aktif</Badge> : <Badge variant="secondary" className="text-xs">Nonaktif</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mb-2 truncate">{webhook.url}</p>

          <div className="flex flex-wrap gap-1 mb-2">
            {webhook.events.slice(0, 5).map((event) => (
              <Badge key={event} variant="outline" className="text-xs">{EVENT_LABELS[event] || event}</Badge>
            ))}
            {webhook.events.length > 5 && (
              <Badge variant="secondary" className="text-xs">+{webhook.events.length - 5} lagi</Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Dibuat: {new Date(webhook.createdAt).toLocaleDateString("id-ID")}</span>
            {webhook.secret && (
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-yellow-500" />
                Secret dikonfigurasi
              </span>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Event Terdaftar</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {webhook.events.map((event) => (
              <DropdownMenuItem key={event} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                {EVENT_LABELS[event] || event}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onCopyUrl(webhook.url)}>
              <Copy className="w-4 h-4 mr-2" />
              Salin URL
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(webhook)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTest(webhook.id)} disabled={isTesting}>
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menguji...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Uji Coba
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(webhook.id)} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}