"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Link2, X, Loader2, AlertTriangle, HelpCircle } from "lucide-react";
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
import { getInitials } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

interface Dependency {
  id: string;
  type: string;
  task: {
    id: string;
    title: string;
    column: { name: string; status: string };
    project: { key: string };
    assignees: Array<{
      user: { id: string; name: string | null; email: string; avatarUrl: string | null };
    }>;
  };
}

interface DependenciesProps {
  taskId: string;
  projectId: string;
}

export function Dependencies({ taskId, projectId }: DependenciesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [dependsOnTaskId, setDependsOnTaskId] = useState("");
  const [dependencyType, setDependencyType] = useState("blocks");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["task-dependencies", taskId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}/dependencies`);
      if (!res.ok) throw new Error("Gagal memuat dependensi");
      return res.json();
    },
  });

  const addDependency = useMutation({
    mutationFn: async (data: { dependsOnTaskId: string; type: string }) => {
      const res = await fetch(`/api/tasks/${taskId}/dependencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal menambahkan dependensi");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-dependencies", taskId] });
      setAddDialogOpen(false);
      setDependsOnTaskId("");
      toast({ title: "Berhasil", description: "Dependensi ditambahkan" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const removeDependency = useMutation({
    mutationFn: async (dependencyId: string) => {
      const res = await fetch(`/api/tasks/${taskId}/dependencies?dependencyId=${dependencyId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus dependensi");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-dependencies", taskId] });
      toast({ title: "Berhasil", description: "Dependensi dihapus" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  // Search for tasks to link
  const { data: searchResults } = useQuery({
    queryKey: ["search-tasks-for-dependency", searchQuery, projectId, taskId],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=tasks&projectId=${projectId}&limit=10`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.results.tasks.filter((t: any) => t.id !== taskId);
    },
    enabled: searchQuery.length >= 2,
  });

  const dependencies: Dependency[] = data?.dependencies || [];
  const dependents: Dependency[] = data?.dependents || [];

  const handleAddDependency = () => {
    if (dependsOnTaskId) {
      addDependency.mutate({ dependsOnTaskId, type: dependencyType });
    }
  };

  const renderDependencyItem = (dep: Dependency, isDependent: boolean) => (
    <div key={dep.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Link2 className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{dep.task.title}</span>
          <Badge variant="secondary" className="text-xs">{dep.task.project.key}</Badge>
          <Badge variant="outline" className="text-xs">{dep.task.column.name}</Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            {isDependent ? "Diblokir oleh" : "Memblokir"}
          </span>
          {dep.task.assignees.length > 0 && (
            <span className="flex items-center gap-1">
              <Avatar className="w-5 h-5">
                <AvatarImage src={dep.task.assignees[0].user.avatarUrl || undefined} />
                <AvatarFallback className="text-[10px]">{getInitials(dep.task.assignees[0].user.name || dep.task.assignees[0].user.email)}</AvatarFallback>
              </Avatar>
              {dep.task.assignees[0].user.name || dep.task.assignees[0].user.email}
            </span>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive hover:text-destructive"
        onClick={() => removeDependency.mutate(dep.id)}
        disabled={removeDependency.isPending}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              Dependensi
            </CardTitle>
            <CardDescription>Kelola tugas yang saling terkait</CardDescription>
          </div>
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dependencies (this task blocks others) */}
        {(dependencies.length > 0 || dependents.length > 0) && (
          <>
            {dependencies.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span className="font-medium">Memblokir ({dependencies.length})</span>
                  <span className="text-xs text-muted-foreground">Tugas ini harus selesai dulu</span>
                </div>
                <div className="space-y-2 ml-6">
                  {dependencies.map((dep) => renderDependencyItem(dep, false))}
                </div>
              </div>
            )}

            {dependents.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Link2 className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Diblokir oleh ({dependents.length})</span>
                  <span className="text-xs text-muted-foreground">Tugas ini menunggu tugas lain</span>
                </div>
                <div className="space-y-2 ml-6">
                  {dependents.map((dep) => renderDependencyItem(dep, true))}
                </div>
              </div>
            )}
          </>
        )}

        {(dependencies.length === 0 && dependents.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            <Link2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Belum ada dependensi</p>
            <p className="text-sm mt-1">Tambahkan dependensi untuk melacak hubungan antar tugas</p>
            <Button variant="outline" className="mt-4" onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Dependensi Pertama
            </Button>
          </div>
        )}

        {/* Add Dependency Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah Dependensi</DialogTitle>
              <DialogDescription>
                Tautkan tugas ini dengan tugas lain untuk melacak ketergantungan
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="task-search">Cari Tugas</Label>
                <div className="relative">
                  <Input
                    id="task-search"
                    placeholder="Ketik minimal 2 karakter..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" />}
                </div>
                {searchResults && searchResults.length > 0 && (
                  <div className="max-h-60 overflow-auto border rounded bg-popover p-2">
                    {searchResults.map((task: any) => (
                      <Button
                        key={task.id}
                        variant="outline"
                        className="w-full justify-start gap-2 text-left"
                        onClick={() => { setDependsOnTaskId(task.id); setSearchQuery(""); }}
                      >
                        <div className="flex-1 text-left">
                          <div className="font-medium truncate">{task.title}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Badge variant="secondary">{task.project.key}</Badge>
                            <Badge variant="outline">{task.column.name}</Badge>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
                {searchQuery.length > 0 && searchResults && searchResults.length === 0 && (
                  <p className="text-sm text-muted-foreground">Tidak ada tugas ditemukan</p>
                )}
                {dependsOnTaskId && searchResults && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 bg-green-50 rounded">
                    <HelpCircle className="w-4 h-4" />
                    <span>Dipilih: {searchResults.find((t: any) => t.id === dependsOnTaskId)?.title}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Jenis Dependensi</Label>
                <Select value={dependencyType} onValueChange={setDependencyType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blocks">Memblokir (tugas ini harus selesai dulu)</SelectItem>
                    <SelectItem value="is_blocked_by">Diblokir oleh (menunggu tugas lain selesai)</SelectItem>
                    <SelectItem value="relates_to">Berkaitan dengan (tidak ada urutan wajib)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleAddDependency} disabled={!dependsOnTaskId || addDependency.isPending}>
                {addDependency.isPending ? "Menambahkan..." : "Tambah Dependensi"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}