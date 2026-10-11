"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit2, GripVertical, Loader2, Settings, Type, Calendar, Hash, CheckSquare, Link2, Mail, AlertCircle } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSensor, useSensors, PointerSensor } from "@dnd-kit/core";

const FIELD_TYPE_ICONS: Record<string, any> = {
  TEXT: Type,
  NUMBER: Hash,
  DATE: Calendar,
  SELECT: CheckSquare,
  MULTI_SELECT: CheckSquare,
  CHECKBOX: CheckSquare,
  URL: Link2,
  EMAIL: Mail,
};

const FIELD_TYPE_LABELS: Record<string, string> = {
  TEXT: "Teks",
  NUMBER: "Angka",
  DATE: "Tanggal",
  SELECT: "Pilihan Tunggal",
  MULTI_SELECT: "Pilihan Ganda",
  CHECKBOX: "Kotak Centang",
  URL: "URL",
  EMAIL: "Email",
};

interface CustomField {
  id: string;
  name: string;
  type: string;
  options: Array<{ value: string; label: string; color?: string }> | null;
  description: string | null;
  isRequired: boolean;
  position: number;
  projectId: string | null;
  workspaceId: string | null;
}

interface CustomFieldsManagerProps {
  projectId?: string;
  workspaceId?: string;
}

export function CustomFieldsManager({ projectId, workspaceId }: CustomFieldsManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "TEXT",
    description: "",
    isRequired: false,
    options: [] as Array<{ value: string; label: string; color?: string }>,
  });
  const [newOption, setNewOption] = useState({ value: "", label: "", color: "#3B82F6" });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const { data, isLoading } = useQuery({
    queryKey: ["custom-fields", projectId, workspaceId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.append("projectId", projectId);
      if (workspaceId) params.append("workspaceId", workspaceId);
      const res = await fetch(`/api/custom-fields?${params}`);
      if (!res.ok) throw new Error("Gagal memuat custom fields");
      return res.json();
    },
    enabled: !!projectId || !!workspaceId,
  });

  const createField = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/custom-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, projectId, workspaceId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal membuat custom field");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-fields", projectId, workspaceId] });
      setCreateDialogOpen(false);
      resetForm();
      toast({ title: "Berhasil", description: "Custom field dibuat" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const updateField = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const res = await fetch(`/api/custom-fields/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Gagal memperbarui custom field");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-fields", projectId, workspaceId] });
      setEditDialogOpen(false);
      setEditingField(null);
      resetForm();
      toast({ title: "Berhasil", description: "Custom field diperbarui" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const deleteField = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/custom-fields/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus custom field");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-fields", projectId, workspaceId] });
      toast({ title: "Berhasil", description: "Custom field dihapus" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const reorderFields = useMutation({
    mutationFn: async (fields: CustomField[]) => {
      await Promise.all(
        fields.map((field, index) =>
          fetch(`/api/custom-fields/${field.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ position: index }),
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-fields", projectId, workspaceId] });
    },
  });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fields = data?.fields || [];
    const oldIndex = fields.findIndex((f: CustomField) => f.id === active.id);
    const newIndex = fields.findIndex((f: CustomField) => f.id === over.id);

    const newFields = [...fields];
    const [removed] = newFields.splice(oldIndex, 1);
    newFields.splice(newIndex, 0, removed);

    reorderFields.mutate(newFields);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "TEXT",
      description: "",
      isRequired: false,
      options: [],
    });
    setNewOption({ value: "", label: "", color: "#3B82F6" });
  };

  const openCreateDialog = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const openEditDialog = (field: CustomField) => {
    setEditingField(field);
    setFormData({
      name: field.name,
      type: field.type,
      description: field.description || "",
      isRequired: field.isRequired,
      options: field.options || [],
    });
    setEditDialogOpen(true);
  };

  const handleOptionAdd = () => {
    if (newOption.value && newOption.label) {
      setFormData((prev) => ({
        ...prev,
        options: [...prev.options, newOption],
      }));
      setNewOption({ value: "", label: "", color: "#3B82F6" });
    }
  };

  const handleOptionRemove = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const fields: CustomField[] = data?.fields || [];

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
              <Settings className="w-5 h-5" />
              Custom Fields
            </CardTitle>
            <CardDescription>
              {projectId ? "Proyek" : "Workspace"} - Kelola kolom kustom untuk tugas
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Field
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Belum ada custom field</p>
            <p className="text-sm mt-1">Tambahkan field kustom untuk melacak data tambahan pada tugas</p>
            <Button variant="outline" className="mt-4" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Buat Custom Field Pertama
            </Button>
          </div>
        ) : (
          <>
            <SortableContext
              items={fields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {fields.map((field) => (
                  <CustomFieldItem
                    key={field.id}
                    field={field}
                    onEdit={openEditDialog}
                    onDelete={(id) => deleteField.mutate(id)}
                  />
                ))}
              </div>
            </SortableContext>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Seret untuk mengubah urutan field
            </p>
          </>
        )}

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Buat Custom Field Baru</DialogTitle>
              <DialogDescription>Tambahkan field kustom untuk melacak data tambahan pada tugas</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createField.mutate(formData); }}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="field-name">Nama Field</Label>
                  <Input
                    id="field-name"
                    placeholder="Contoh: Estimasi Biaya, Prioritas Klien"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field-type">Tipe Field</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEXT">Teks</SelectItem>
                      <SelectItem value="NUMBER">Angka</SelectItem>
                      <SelectItem value="DATE">Tanggal</SelectItem>
                      <SelectItem value="SELECT">Pilihan Tunggal</SelectItem>
                      <SelectItem value="MULTI_SELECT">Pilihan Ganda</SelectItem>
                      <SelectItem value="CHECKBOX">Kotak Centang</SelectItem>
                      <SelectItem value="URL">URL</SelectItem>
                      <SelectItem value="EMAIL">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field-description">Deskripsi (Opsional)</Label>
                  <Textarea
                    id="field-description"
                    placeholder="Jelaskan kegunaan field ini..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="field-required"
                    checked={formData.isRequired}
                    onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="field-required" className="cursor-pointer">
                    Wajib diisi
                  </Label>
                </div>

                {/* Options for SELECT/MULTI_SELECT */}
                {["SELECT", "MULTI_SELECT"].includes(formData.type) && (
                  <div className="space-y-2">
                    <Label>Opsi Pilihan</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nilai"
                        value={newOption.value}
                        onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                      />
                      <Input
                        placeholder="Label"
                        value={newOption.label}
                        onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                      />
                      <Input
                        type="color"
                        value={newOption.color}
                        onChange={(e) => setNewOption({ ...newOption, color: e.target.value })}
                        className="w-10 h-10 p-0"
                      />
                      <Button type="button" variant="outline" onClick={handleOptionAdd}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {formData.options.length > 0 && (
                      <div className="space-y-1">
                        {formData.options.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: opt.color }} />
                            <span className="flex-1">{opt.label}</span>
                            <span className="text-xs text-muted-foreground">{opt.value}</span>
                            <Button variant="ghost" size="icon" onClick={() => handleOptionRemove(i)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={createField.isPending}>
                  {createField.isPending ? "Membuat..." : "Buat Field"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Custom Field</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); editingField && updateField.mutate({ id: editingField.id, data: formData }); }}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-field-name">Nama Field</Label>
                  <Input
                    id="edit-field-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-field-type">Tipe Field</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEXT">Teks</SelectItem>
                      <SelectItem value="NUMBER">Angka</SelectItem>
                      <SelectItem value="DATE">Tanggal</SelectItem>
                      <SelectItem value="SELECT">Pilihan Tunggal</SelectItem>
                      <SelectItem value="MULTI_SELECT">Pilihan Ganda</SelectItem>
                      <SelectItem value="CHECKBOX">Kotak Centang</SelectItem>
                      <SelectItem value="URL">URL</SelectItem>
                      <SelectItem value="EMAIL">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-field-description">Deskripsi (Opsional)</Label>
                  <Textarea
                    id="edit-field-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-field-required"
                    checked={formData.isRequired}
                    onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="edit-field-required" className="cursor-pointer">
                    Wajib diisi
                  </Label>
                </div>

                {["SELECT", "MULTI_SELECT"].includes(formData.type) && (
                  <div className="space-y-2">
                    <Label>Opsi Pilihan</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nilai"
                        value={newOption.value}
                        onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                      />
                      <Input
                        placeholder="Label"
                        value={newOption.label}
                        onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                      />
                      <Input
                        type="color"
                        value={newOption.color}
                        onChange={(e) => setNewOption({ ...newOption, color: e.target.value })}
                        className="w-10 h-10 p-0"
                      />
                      <Button type="button" variant="outline" onClick={handleOptionAdd}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {formData.options.length > 0 && (
                      <div className="space-y-1">
                        {formData.options.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: opt.color }} />
                            <span className="flex-1">{opt.label}</span>
                            <span className="text-xs text-muted-foreground">{opt.value}</span>
                            <Button variant="ghost" size="icon" onClick={() => handleOptionRemove(i)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={updateField.isPending}>
                  {updateField.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function CustomFieldItem({ field, onEdit, onDelete }: { field: CustomField; onEdit: (f: CustomField) => void; onDelete: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = FIELD_TYPE_ICONS[field.type] || Type;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
        aria-label="Seret untuk mengubah urutan"
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{field.name}</span>
          <Badge variant="secondary" className="text-xs">{FIELD_TYPE_LABELS[field.type] || field.type}</Badge>
          {field.isRequired && <Badge variant="default" className="text-xs">Wajib</Badge>}
        </div>
        {field.description && (
          <p className="text-sm text-muted-foreground truncate mt-1">{field.description}</p>
        )}
        {field.options && field.options.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {field.options.slice(0, 3).map((opt, i) => (
              <Badge key={i} variant="outline" className="text-xs" style={{ borderColor: opt.color }}>
                {opt.label}
              </Badge>
            ))}
            {field.options.length > 3 && (
              <Badge variant="outline" className="text-xs">+{field.options.length - 3} lagi</Badge>
            )}
          </div>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(field)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onDelete(field.id)} className="text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}