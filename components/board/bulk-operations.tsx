"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckSquare,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Trash2,
  Edit2,
  Flag,
  Tag,
  UserPlus,
  Archive,
  Download,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Task {
  id: string;
  title: string;
  priority: string;
  column: {
    id: string;
    name: string;
    status: string;
  };
  assignees: Array<{
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
  labels: Array<{
    label: {
      id: string;
      name: string;
      color: string;
    };
  }>;
}

interface BulkOperationsProps {
  tasks: Task[];
  selectedTasks: string[];
  onSelectChange: (selected: string[]) => void;
  projectId: string;
  onClose: () => void;
}

export function BulkOperations({
  tasks,
  selectedTasks,
  onSelectChange,
  projectId,
  onClose,
}: BulkOperationsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"move" | "priority" | "assignee" | "label" | "delete" | "archive" | "export" | null>(null);
  const [formData, setFormData] = useState({
    columnId: "",
    priority: "",
    assigneeId: "",
    labelId: "",
    labelAction: "add" as "add" | "remove",
  });

  const selectedTaskObjects = tasks.filter((t) => selectedTasks.includes(t.id));
  const selectedCount = selectedTasks.length;

  const bulkUpdate = useMutation({
    mutationFn: async (updates: any) => {
      const res = await fetch(`/api/tasks/bulk`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds: selectedTasks, ...updates }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal memperbarui tugas");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onSelectChange([]);
      onClose();
      toast({ title: "Berhasil", description: `${selectedCount} tugas diperbarui` });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const bulkDelete = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tasks/bulk`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds: selectedTasks }),
      });
      if (!res.ok) throw new Error("Gagal menghapus tugas");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      onSelectChange([]);
      onClose();
      toast({ title: "Berhasil", description: `${selectedCount} tugas dihapus` });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const handleAction = (action: typeof dialogAction) => {
    setDialogAction(action);
    setIsDialogOpen(true);
  };

  const handleConfirm = () => {
    switch (dialogAction) {
      case "move":
        if (formData.columnId) bulkUpdate.mutate({ columnId: formData.columnId });
        break;
      case "priority":
        if (formData.priority) bulkUpdate.mutate({ priority: formData.priority });
        break;
      case "assignee":
        if (formData.assigneeId) bulkUpdate.mutate({ assigneeIds: [formData.assigneeId] });
        break;
      case "label":
        if (formData.labelId) {
          bulkUpdate.mutate({
            labelIds: [formData.labelId],
            labelAction: formData.labelAction,
          });
        }
        break;
      case "archive":
        bulkUpdate.mutate({ isArchived: true });
        break;
      case "delete":
        bulkDelete.mutate();
        break;
    }
  };

  const getDialogContent = () => {
    switch (dialogAction) {
      case "move":
        return (
          <div className="space-y-4">
            <Label htmlFor="columnId">Pindah ke Kolom</Label>
            <Select
              value={formData.columnId}
              onValueChange={(value) => setFormData({ ...formData, columnId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kolom" />
              </SelectTrigger>
              <SelectContent>
                {tasks[0]?.column && <SelectItem value={tasks[0].column.id}>{tasks[0].column.name}</SelectItem>}
              </SelectContent>
            </Select>
          </div>
        );
      case "priority":
        return (
          <div className="space-y-4">
            <Label htmlFor="priority">Prioritas Baru</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData({ ...formData, priority: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih prioritas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="URGENT">Urgent</SelectItem>
                <SelectItem value="HIGH">Tinggi</SelectItem>
                <SelectItem value="MEDIUM">Sedang</SelectItem>
                <SelectItem value="LOW">Rendah</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case "assignee":
        return (
          <div className="space-y-4">
            <Label htmlFor="assigneeId">Tugaskan ke</Label>
            <Select
              value={formData.assigneeId}
              onValueChange={(value) => setFormData({ ...formData, assigneeId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih anggota" />
              </SelectTrigger>
              <SelectContent>
                {selectedTaskObjects.flatMap((t) => t.assignees).map(({ user }) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case "label":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Select
                value={formData.labelAction}
                onValueChange={(value) => setFormData({ ...formData, labelAction: value as any })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Tambah</SelectItem>
                  <SelectItem value="remove">Hapus</SelectItem>
                </SelectContent>
              </Select>
              <Label htmlFor="labelId">Label</Label>
            </div>
            <Select
              value={formData.labelId}
              onValueChange={(value) => setFormData({ ...formData, labelId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih label" />
              </SelectTrigger>
              <SelectContent>
                {selectedTaskObjects.flatMap((t) => t.labels).map(({ label }) => (
                  <SelectItem key={label.id} value={label.id}>
                    <span style={{ color: label.color }}>{label.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case "archive":
        return (
          <p className="text-sm text-muted-foreground">
            {selectedCount} tugas akan diarsipkan. Tugas yang diarsipkan tidak akan muncul di board tetapi tetap dapat diakses.
          </p>
        );
      case "delete":
        return (
          <p className="text-sm text-destructive">
            <strong>Peringatan:</strong> {selectedCount} tugas akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
          </p>
        );
      default:
        return null;
    }
  };

  if (selectedCount === 0) return null;

  return (
    <>
      {/* Floating Bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
        <Card className="shadow-lg border-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedCount === tasks.length && tasks.length > 0}
                  onCheckedChange={(checked) =>
                    onSelectChange(checked ? tasks.map((t) => t.id) : [])
                  }
                  aria-label="Select all"
                />
                <span className="font-medium">
                  {selectedCount} tugas dipilih
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <MoreVertical className="w-4 h-4" />
                      Aksi
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Pindah & Status</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => handleAction("move")}
                      onSelect={handleConfirm}
                    >
                      <Flag className="w-4 h-4 mr-2" />
                      Pindah ke Kolom
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleAction("priority")}
                      onSelect={handleConfirm}
                    >
                      <Flag className="w-4 h-4 mr-2" />
                      Ubah Prioritas
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleAction("archive")}
                      onSelect={handleConfirm}
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Arsipkan
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Atribut</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => handleAction("assignee")}
                      onSelect={handleConfirm}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Ubah Assignee
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleAction("label")}
                      onSelect={handleConfirm}
                    >
                      <Tag className="w-4 h-4 mr-2" />
                      Kelola Label
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Lainnya</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => handleAction("export")}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Ekspor CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleAction("copy")}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Duplikasi
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleAction("delete")}
                      onSelect={handleConfirm}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Hapus Permanen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectChange([])}
                >
                  Batal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) setDialogAction(null); setIsDialogOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{{
              move: "Pindah Tugas",
              priority: "Ubah Prioritas",
              assignee: "Tugaskan Ulang",
              label: "Kelola Label",
              archive: "Arsipkan Tugas",
              delete: "Hapus Tugas",
              export: "Ekspor Tugas",
              copy: "Duplikasi Tugas",
            }[dialogAction!]}</DialogTitle>
            <DialogDescription>
              Aksi ini akan diterapkan ke {selectedCount} tugas yang dipilih
            </DialogDescription>
          </DialogHeader>
          {getDialogContent()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleConfirm}
              variant={dialogAction === "delete" ? "destructive" : "default"}
              disabled={bulkUpdate.isPending || bulkDelete.isPending}
            >
              {bulkUpdate.isPending || bulkDelete.isPending ? "Memproses..." : "Konfirmasi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}