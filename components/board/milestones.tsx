"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, Edit2, Calendar, Flag, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

interface Milestone {
  id: string;
  name: string;
  description: string | null;
  dueDate: string;
  completedAt: string | null;
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

interface MilestonesProps {
  projectId?: string;
}

export function Milestones({ projectId }: MilestonesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed" | "all">("upcoming");

  const { data, isLoading } = useQuery({
    queryKey: ["milestones", { projectId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.append("projectId", projectId);
      params.append("limit", "50");
      const res = await fetch(`/api/milestones?${params}`);
      if (!res.ok) throw new Error("Gagal memuat milestones");
      return res.json();
    },
  });

  const createMilestone = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, projectId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal membuat milestone");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones"] });
      setCreateDialogOpen(false);
      resetForm();
      toast({ title: "Berhasil", description: "Milestone dibuat" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const updateMilestone = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Milestone> }) => {
      const res = await fetch(`/api/milestones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Gagal memperbarui milestone");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones"] });
      setCreateDialogOpen(false);
      setEditingMilestone(null);
      resetForm();
      toast({ title: "Berhasil", description: "Milestone diperbarui" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const deleteMilestone = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/milestones/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus milestone");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones"] });
      toast({ title: "Berhasil", description: "Milestone dihapus" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const toggleComplete = useMutation({
    mutationFn: async ({ id, completedAt }: { id: string; completedAt: string | null }) => {
      const res = await fetch(`/api/milestones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedAt }),
      });
      if (!res.ok) throw new Error("Gagal mengubah status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones"] });
      toast({ title: "Berhasil", description: "Status milestone diperbarui" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });

  const milestones: Milestone[] = data?.milestones || [];
  const now = new Date();

  const upcomingMilestones = milestones
    .filter(m => !m.completedAt && new Date(m.dueDate) >= now)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const overdueMilestones = milestones
    .filter(m => !m.completedAt && new Date(m.dueDate) < now)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const completedMilestones = milestones
    .filter(m => m.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

  const openCreateDialog = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const openEditDialog = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setFormData({
      name: milestone.name,
      description: milestone.description || "",
      dueDate: new Date(milestone.dueDate).toISOString().slice(0, 10),
    });
    setCreateDialogOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      name: formData.name,
      description: formData.description || null,
      dueDate: formData.dueDate,
    };
    if (editingMilestone) {
      updateMilestone.mutate({ id: editingMilestone.id, data });
    } else {
      createMilestone.mutate(data);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    });
    setEditingMilestone(null);
  };

  const getDaysUntil = (dueDate: string) => {
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays;
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
              <Flag className="w-5 h-5" />
              Milestones
            </CardTitle>
            <CardDescription>Pencapaian utama dan deadline penting proyek</CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Milestone
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === "upcoming" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("upcoming")}
          >
            Mendatang ({upcomingMilestones.length})
          </Button>
          <Button
            variant={activeTab === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("completed")}
          >
            Selesai ({completedMilestones.length})
          </Button>
          <Button
            variant={activeTab === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("all")}
          >
            Semua ({milestones.length})
          </Button>
        </div>

        {/* Overdue Warning */}
        {overdueMilestones.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">{overdueMilestones.length} milestone terlewat!</span>
            </div>
          </div>
        )}

        {milestones.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Flag className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Belum ada milestone</p>
            <p className="text-sm mt-1">Tambahkan milestone untuk melacak pencapaian penting proyek</p>
            <Button variant="outline" className="mt-4" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Buat Milestone Pertama
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === "upcoming" && overdueMilestones.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> Terlewat ({overdueMilestones.length})
                </h4>
                <div className="space-y-2">
                  {overdueMilestones.map((milestone) => (
                    <MilestoneCard
                      key={milestone.id}
                      milestone={milestone}
                      isOverdue={true}
                      onEdit={openEditDialog}
                      onDelete={(id) => deleteMilestone.mutate(id)}
                      onToggleComplete={() => toggleComplete.mutate({ id: milestone.id, completedAt: new Date().toISOString() })}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeTab !== "completed" && upcomingMilestones.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Mendatang ({upcomingMilestones.length})
                </h4>
                <div className="space-y-2">
                  {upcomingMilestones.map((milestone) => (
                    <MilestoneCard
                      key={milestone.id}
                      milestone={milestone}
                      isOverdue={false}
                      onEdit={openEditDialog}
                      onDelete={(id) => deleteMilestone.mutate(id)}
                      onToggleComplete={() => toggleComplete.mutate({ id: milestone.id, completedAt: new Date().toISOString() })}
                    />
                  ))}
                </div>
              </div>
            )}

            {completedMilestones.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Selesai ({completedMilestones.length})
                </h4>
                <div className="space-y-2">
                  {completedMilestones.map((milestone) => (
                    <MilestoneCard
                      key={milestone.id}
                      milestone={milestone}
                      isOverdue={false}
                      isCompleted={true}
                      onEdit={openEditDialog}
                      onDelete={(id) => deleteMilestone.mutate(id)}
                      onToggleComplete={() => toggleComplete.mutate({ id: milestone.id, completedAt: null })}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={(open) => { if (!open) { setCreateDialogOpen(false); setEditingMilestone(null); resetForm(); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingMilestone ? "Edit Milestone" : "Buat Milestone Baru"}</DialogTitle>
              <DialogDescription>Tandai pencapaian penting dalam proyek</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="milestone-name">Nama Milestone</Label>
                  <Input
                    id="milestone-name"
                    placeholder="Contoh: MVP Launch, Design Complete, Q3 Review"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="milestone-desc">Deskripsi</Label>
                  <Textarea
                    id="milestone-desc"
                    placeholder="Detail apa yang harus dicapai..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="milestone-date">Tanggal Target</Label>
                  <Input
                    id="milestone-date"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setCreateDialogOpen(false); setEditingMilestone(null); resetForm(); }}>
                  Batal
                </Button>
                <Button type="submit" disabled={createMilestone.isPending || updateMilestone.isPending}>
                  {createMilestone.isPending || updateMilestone.isPending ? "Menyimpan..." : editingMilestone ? "Simpan Perubahan" : "Buat Milestone"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function MilestoneCard({ milestone, isOverdue, isCompleted, onEdit, onDelete, onToggleComplete }: {
  milestone: Milestone;
  isOverdue: boolean;
  isCompleted?: boolean;
  onEdit: (milestone: Milestone) => void;
  onDelete: (id: string) => void;
  onToggleComplete: () => void;
}) {
  const daysUntil = Math.ceil((new Date(milestone.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const getStatusBadge = () => {
    if (isCompleted) return <Badge variant="default" className="text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />Selesai</Badge>;
    if (isOverdue) return <Badge variant="destructive" className="text-xs"><AlertCircle className="w-3 h-3 mr-1" />Terlewat</Badge>;
    if (daysUntil === 0) return <Badge variant="default" className="text-xs">Hari ini</Badge>;
    if (daysUntil === 1) return <Badge variant="default" className="text-xs text-yellow-600 bg-yellow-50 border-yellow-200">Besok</Badge>;
    return <Badge variant="secondary" className="text-xs">{daysUntil} hari lagi</Badge>;
  };

  return (
    <div className={cn(
      "border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors",
      isOverdue && "border-red-200 bg-red-50",
      isCompleted && "border-green-200 bg-green-50 opacity-70"
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium">{isCompleted ? (
              <span className="line-through text-muted-foreground">{milestone.name}</span>
            ) : milestone.name}</span>
            {getStatusBadge()}
          </div>
          {milestone.description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{milestone.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Target: {formatDate(milestone.dueDate)}
            </span>
            {isCompleted && milestone.completedAt && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="w-3 h-3" />
                Selesai: {formatDate(milestone.completedAt)}
              </span>
            )}
            <Badge variant="secondary" className="text-xs">{milestone.project.key}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isCompleted && (
            <Button variant="ghost" size="icon" onClick={onToggleComplete} className="text-green-600 hover:bg-green-50">
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => onEdit(milestone)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(milestone.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}