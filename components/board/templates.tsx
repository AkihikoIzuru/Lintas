"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, Edit2, FileText, Copy, Check, X, Save, FilePlus, FolderPlus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

interface TaskTemplate {
  id: string;
  name: string;
  description: string | null;
  templateData: any;
  projectId: string | null;
  workspaceId: string | null;
  isPublic: boolean;
  createdAt: string;
  project: { id: string; name: string; key: string } | null;
  workspace: { id: string; name: string; slug: string } | null;
  createdBy: { id: string; name: string | null; email: string };
}

interface ProjectTemplate {
  id: string;
  name: string;
  description: string | null;
  columns: any[];
  labels: any[] | null;
  workspaceId: string;
  isPublic: boolean;
  createdAt: string;
  workspace: { id: string; name: string; slug: string };
  createdBy: { id: string; name: string | null; email: string };
}

interface TemplatesProps {
  projectId?: string;
  workspaceId?: string;
}

export function Templates({ projectId, workspaceId }: TemplatesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"task-templates" | "project-templates">("task-templates");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | ProjectTemplate | null>(null);
  const [isProjectTemplate, setIsProjectTemplate] = useState(false);

  // Task Templates
  const { data: taskTemplatesData, isLoading: taskTemplatesLoading } = useQuery({
    queryKey: ["task-templates", { projectId, workspaceId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.append("projectId", projectId);
      if (workspaceId) params.append("workspaceId", workspaceId);
      params.append("limit", "50");
      const res = await fetch(`/api/task-templates?${params}`);
      if (!res.ok) throw new Error("Gagal memuat task templates");
      return res.json();
    },
  });

  // Project Templates
  const { data: projectTemplatesData, isLoading: projectTemplatesLoading } = useQuery({
    queryKey: ["project-templates", { workspaceId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (workspaceId) params.append("workspaceId", workspaceId);
      params.append("limit", "50");
      const res = await fetch(`/api/project-templates?${params}`);
      if (!res.ok) throw new Error("Gagal memuat project templates");
      return res.json();
    },
    enabled: !!workspaceId,
  });

  // Mutations for Task Templates
  const createTaskTemplate = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/task-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, projectId, workspaceId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal membuat template");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-templates"] });
      setCreateDialogOpen(false);
      setEditingTemplate(null);
      setIsProjectTemplate(false);
      resetForm();
      toast({ title: "Berhasil", description: "Task template dibuat" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const updateTaskTemplate = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TaskTemplate> }) => {
      const res = await fetch(`/api/task-templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Gagal memperbarui template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-templates"] });
      setCreateDialogOpen(false);
      setEditingTemplate(null);
      setIsProjectTemplate(false);
      resetForm();
      toast({ title: "Berhasil", description: "Task template diperbarui" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const deleteTaskTemplate = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/task-templates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-templates"] });
      toast({ title: "Berhasil", description: "Task template dihapus" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const useTaskTemplate = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/task-templates/${id}/use`, { method: "POST" });
      if (!res.ok) throw new Error("Gagal menggunakan template");
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Berhasil", description: "Template data siap digunakan" });
      // Navigate to create task with template data
      if (projectId) {
        window.location.href = `/w/${window.location.pathname.split('/')[2]}/projects/${projectId}?template=${encodeURIComponent(JSON.stringify(data.templateData))}`;
      }
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const useProjectTemplate = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/project-templates/${id}/use`, { method: "POST" });
      if (!res.ok) throw new Error("Gagal menggunakan template");
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Berhasil", description: "Template proyek siap digunakan" });
      // Navigate to create project with template
      if (workspaceId) {
        window.location.href = `/w/${workspaceId}/projects/new?template=${encodeURIComponent(JSON.stringify(data))}`;
      }
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  // Mutations for Project Templates
  const createProjectTemplate = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/project-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, workspaceId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal membuat template");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-templates"] });
      setCreateDialogOpen(false);
      setEditingTemplate(null);
      setIsProjectTemplate(true);
      resetForm();
      toast({ title: "Berhasil", description: "Project template dibuat" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const updateProjectTemplate = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProjectTemplate> }) => {
      const res = await fetch(`/api/project-templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Gagal memperbarui template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-templates"] });
      setCreateDialogOpen(false);
      setEditingTemplate(null);
      setIsProjectTemplate(true);
      resetForm();
      toast({ title: "Berhasil", description: "Project template diperbarui" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const deleteProjectTemplate = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/project-templates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-templates"] });
      toast({ title: "Berhasil", description: "Project template dihapus" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    templateData: {
      title: "",
      description: "",
      priority: "MEDIUM",
      labels: [],
      assignees: [],
    },
    columns: [
      { name: "Backlog", status: "BACKLOG", color: "#6B7280" },
      { name: "Todo", status: "TODO", color: "#3B82F6" },
      { name: "In Progress", status: "IN_PROGRESS", color: "#F59E0B" },
      { name: "Review", status: "IN_REVIEW", color: "#8B5CF6" },
      { name: "Done", status: "DONE", color: "#10B981" },
    ],
    labels: [],
    isPublic: false,
  });

  const taskTemplates: TaskTemplate[] = taskTemplatesData?.templates || [];
  const projectTemplates: ProjectTemplate[] = projectTemplatesData?.templates || [];

  const openCreateTaskTemplate = () => {
    setIsProjectTemplate(false);
    resetForm();
    setCreateDialogOpen(true);
  };

  const openCreateProjectTemplate = () => {
    setIsProjectTemplate(true);
    resetForm();
    setCreateDialogOpen(true);
  };

  const openEditTaskTemplate = (template: TaskTemplate) => {
    setIsProjectTemplate(false);
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      templateData: template.templateData,
      columns: [],
      labels: [],
      isPublic: template.isPublic,
    });
    setCreateDialogOpen(true);
  };

  const openEditProjectTemplate = (template: ProjectTemplate) => {
    setIsProjectTemplate(true);
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      templateData: {},
      columns: template.columns,
      labels: template.labels || [],
      isPublic: template.isPublic,
    });
    setCreateDialogOpen(true);
  };

  const handleSubmit = () => {
    if (isProjectTemplate) {
      if (editingTemplate) {
        updateProjectTemplate.mutate({ id: editingTemplate.id, data: formData });
      } else {
        createProjectTemplate.mutate(formData);
      }
    } else {
      if (editingTemplate) {
        updateTaskTemplate.mutate({ id: editingTemplate.id, data: formData });
      } else {
        createTaskTemplate.mutate(formData);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      templateData: {
        title: "",
        description: "",
        priority: "MEDIUM",
        labels: [],
        assignees: [],
      },
      columns: [
        { name: "Backlog", status: "BACKLOG", color: "#6B7280" },
        { name: "Todo", status: "TODO", color: "#3B82F6" },
        { name: "In Progress", status: "IN_PROGRESS", color: "#F59E0B" },
        { name: "Review", status: "IN_REVIEW", color: "#8B5CF6" },
        { name: "Done", status: "DONE", color: "#10B981" },
      ],
      labels: [],
      isPublic: false,
    });
    setEditingTemplate(null);
    setIsProjectTemplate(false);
  };

  if (activeTab === "task-templates" && taskTemplatesLoading) {
    return <Card><CardContent className="py-6"><div className="h-20 bg-muted animate-pulse rounded" /></CardContent></Card>;
  }
  if (activeTab === "project-templates" && projectTemplatesLoading) {
    return <Card><CardContent className="py-6"><div className="h-20 bg-muted animate-pulse rounded" /></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Templates
            </CardTitle>
            <CardDescription>Template tugas dan proyek untuk mempercepat workflow</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="task-templates">
              <FilePlus className="w-4 h-4 mr-2" />
              Task Templates
            </TabsTrigger>
            <TabsTrigger value="project-templates" disabled={!workspaceId}>
              <FolderPlus className="w-4 h-4 mr-2" />
              Project Templates
            </TabsTrigger>
          </TabsList>

          {/* Task Templates Tab */}
          <TabsContent value="task-templates">
            <div className="flex items-center justify-between mb-4">
              <div></div>
              <Button onClick={openCreateTaskTemplate}>
                <Plus className="w-4 h-4 mr-2" />
                Buat Task Template
              </Button>
            </div>

            {taskTemplates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Belum ada task template</p>
                <p className="text-sm mt-1">Buat template untuk tugas yang sering dibuat</p>
                <Button variant="outline" className="mt-4" onClick={openCreateTaskTemplate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Task Template Pertama
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {taskTemplates.map((template) => (
                  <TaskTemplateCard
                    key={template.id}
                    template={template}
                    onEdit={openEditTaskTemplate}
                    onDelete={(id) => deleteTaskTemplate.mutate(id)}
                    onUse={() => useTaskTemplate.mutate(template.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Project Templates Tab */}
          <TabsContent value="project-templates">
            <div className="flex items-center justify-between mb-4">
              <div></div>
              {workspaceId && (
                <Button onClick={openCreateProjectTemplate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Project Template
                </Button>
              )}
            </div>

            {!workspaceId ? (
              <div className="text-center py-12 text-muted-foreground">
                <FolderPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Project templates memerlukan workspace</p>
                <p className="text-sm mt-1">Akses dari halaman workspace untuk membuat project template</p>
              </div>
            ) : projectTemplates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FolderPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Belum ada project template</p>
                <p className="text-sm mt-1">Buat template untuk struktur proyek yang sering digunakan</p>
                <Button variant="outline" className="mt-4" onClick={openCreateProjectTemplate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Project Template Pertama
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {projectTemplates.map((template) => (
                  <ProjectTemplateCard
                    key={template.id}
                    template={template}
                    onEdit={openEditProjectTemplate}
                    onDelete={(id) => deleteProjectTemplate.mutate(id)}
                    onUse={() => useProjectTemplate.mutate(template.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create/Edit Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={(open) => { if (!open) { setCreateDialogOpen(false); setEditingTemplate(null); setIsProjectTemplate(false); resetForm(); } }}>
          <DialogContent className="sm:max-w-2xl lg:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? (isProjectTemplate ? "Edit Project Template" : "Edit Task Template") : (isProjectTemplate ? "Buat Project Template Baru" : "Buat Task Template Baru")}</DialogTitle>
              <DialogDescription>{isProjectTemplate ? "Konfigurasi struktur proyek yang dapat digunakan kembali" : "Konfigurasi template tugas untuk penggunaan berulang"}</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Nama Template</Label>
                  <Input
                    id="template-name"
                    placeholder={isProjectTemplate ? "Contoh: Sprint Project, Marketing Campaign" : "Contoh: Bug Report, Feature Request, Meeting Notes"}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-desc">Deskripsi</Label>
                  <Textarea
                    id="template-desc"
                    placeholder="Kapan template ini digunakan..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>

                {!isProjectTemplate && (
                  <div className="space-y-4 border-t pt-4">
                    <Label className="font-medium">Template Data Tugas</Label>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tt-title">Judul Default</Label>
                        <Input
                          id="tt-title"
                          placeholder="Judul tugas..."
                          value={formData.templateData.title}
                          onChange={(e) => setFormData({ ...formData, templateData: { ...formData.templateData, title: e.target.value } })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tt-desc">Deskripsi Default</Label>
                        <Textarea
                          id="tt-desc"
                          placeholder="Deskripsi tugas..."
                          value={formData.templateData.description}
                          onChange={(e) => setFormData({ ...formData, templateData: { ...formData.templateData, description: e.target.value } })}
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Prioritas Default</Label>
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
                    </div>
                  </div>
                )}

                {isProjectTemplate && (
                  <div className="space-y-4 border-t pt-4">
                    <Label className="font-medium">Kolom Proyek</Label>
                    <div className="space-y-2">
                      {formData.columns.map((col: any, index: number) => (
                        <div key={index} className="flex gap-2 p-3 border rounded bg-background">
                          <Input
                            placeholder="Nama kolom"
                            value={col.name}
                            onChange={(e) => {
                              const cols = [...formData.columns];
                              cols[index] = { ...cols[index], name: e.target.value };
                              setFormData({ ...formData, columns: cols });
                            }}
                            className="flex-1"
                          />
                          <Select value={col.status} onValueChange={(v) => {
                            const cols = [...formData.columns];
                            cols[index] = { ...cols[index], status: v };
                            setFormData({ ...formData, columns: cols });
                          }}>
                            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BACKLOG">Backlog</SelectItem>
                              <SelectItem value="TODO">Todo</SelectItem>
                              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                              <SelectItem value="IN_REVIEW">Review</SelectItem>
                              <SelectItem value="DONE">Done</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="color"
                            value={col.color}
                            onChange={(e) => {
                              const cols = [...formData.columns];
                              cols[index] = { ...cols[index], color: e.target.value };
                              setFormData({ ...formData, columns: cols });
                            }}
                            className="w-10 h-10 p-0"
                          />
                          {formData.columns.length > 1 && (
                            <Button variant="ghost" size="icon" onClick={() => {
                              const cols = formData.columns.filter((_: any, i: number) => i !== index);
                              setFormData({ ...formData, columns: cols });
                            }}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => {
                        setFormData({ ...formData, columns: [...formData.columns, { name: "", status: "TODO", color: "#3B82F6" }] });
                      }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Kolom
                      </Button>
                    </div>
                    <div className="space-y-2 border-t pt-4">
                      <Label className="font-medium">Label Default (Opsional)</Label>
                      <div className="space-y-2">
                        {formData.labels.map((label: any, index: number) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              placeholder="Nama label"
                              value={label.name}
                              onChange={(e) => {
                                const labels = [...formData.labels];
                                labels[index] = { ...labels[index], name: e.target.value };
                                setFormData({ ...formData, labels: labels });
                              }}
                              className="flex-1"
                            />
                            <Input
                              type="color"
                              value={label.color}
                              onChange={(e) => {
                                const labels = [...formData.labels];
                                labels[index] = { ...labels[index], color: e.target.value };
                                setFormData({ ...formData, labels: labels });
                              }}
                              className="w-10 h-10 p-0"
                            />
                            <Button variant="ghost" size="icon" onClick={() => {
                              const labels = formData.labels.filter((_: any, i: number) => i !== index);
                              setFormData({ ...formData, labels: labels });
                            }}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => {
                          setFormData({ ...formData, labels: [...formData.labels, { name: "", color: "#3B82F6" }] });
                        }}>
                          <Plus className="w-4 h-4 mr-2" />
                          Tambah Label
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 border-t pt-4">
                  <Switch
                    id="template-public"
                    checked={formData.isPublic}
                    onCheckedChange={(c) => setFormData({ ...formData, isPublic: c })}
                  />
                  <Label htmlFor="template-public" className="cursor-pointer">Jadikan template publik (dapat digunakan semua member)</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setCreateDialogOpen(false); setEditingTemplate(null); setIsProjectTemplate(false); resetForm(); }}>
                  Batal
                </Button>
                <Button type="submit" disabled={createTaskTemplate.isPending || updateTaskTemplate.isPending || createProjectTemplate.isPending || updateProjectTemplate.isPending}>
                  {(createTaskTemplate.isPending || updateTaskTemplate.isPending || createProjectTemplate.isPending || updateProjectTemplate.isPending) ? "Menyimpan..." : editingTemplate ? "Simpan Perubahan" : isProjectTemplate ? "Buat Project Template" : "Buat Task Template"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function TaskTemplateCard({ template, onEdit, onDelete, onUse }: {
  template: TaskTemplate;
  onEdit: (template: TaskTemplate) => void;
  onDelete: (id: string) => void;
  onUse: () => void;
}) {
  const td = template.templateData;
  return (
    <div className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium">{template.name}</span>
            {template.isPublic && <Badge variant="secondary" className="text-xs">Publik</Badge>}
          </div>
          {template.description && <p className="text-sm text-muted-foreground mb-2">{template.description}</p>}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: td.priority === "URGENT" ? "#ef4444" :
                    td.priority === "HIGH" ? "#f97316" :
                      td.priority === "MEDIUM" ? "#eab308" : "#3b82f6"
                }} />
              {td.priority}
            </span>
            {td.labels && td.labels.length > 0 && (
              <span>{td.labels.length} label(s)</span>
            )}
            {(template.project || template.workspace) && (
              <Badge variant="outline" className="text-xs">
                {template.project ? template.project.key : template.workspace?.slug}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onUse}>
            <Check className="w-4 h-4 mr-2" />
            Gunakan
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onEdit(template)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(template.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProjectTemplateCard({ template, onEdit, onDelete, onUse }: {
  template: ProjectTemplate;
  onEdit: (template: ProjectTemplate) => void;
  onDelete: (id: string) => void;
  onUse: () => void;
}) {
  return (
    <div className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium">{template.name}</span>
            {template.isPublic && <Badge variant="secondary" className="text-xs">Publik</Badge>}
          </div>
          {template.description && <p className="text-sm text-muted-foreground mb-2">{template.description}</p>}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <FilePlus className="w-3 h-3" />
              {template.columns.length} kolom
            </span>
            {template.labels && template.labels.length > 0 && (
              <span>{template.labels.length} label(s)</span>
            )}
            <Badge variant="outline" className="text-xs">{template.workspace.slug}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onUse}>
            <Check className="w-4 h-4 mr-2" />
            Gunakan
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onEdit(template)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(template.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}