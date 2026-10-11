"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, differenceInDays, isBefore, startOfDay, endOfDay } from "date-fns";
import { id } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Target,
  Flag,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  Plus,
  MoreVertical,
  ArrowLeft,
  Trash2,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { getInitials, formatDate, cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
  tasks: Array<{
    id: string;
    title: string;
    priority: string;
    column: {
      name: string;
      status: string;
    };
    assignees: Array<{
      user: {
        id: string;
        name: string | null;
        email: string;
        avatarUrl: string | null;
      };
    }>;
    _count: {
      subtasks: number;
    };
  }>;
  _count: {
    tasks: number;
  };
}

interface SprintViewProps {
  sprintId: string;
  onBack: () => void;
}

const priorityColors = {
  URGENT: "bg-red-500 text-white",
  HIGH: "bg-orange-500 text-white",
  MEDIUM: "bg-yellow-500 text-white",
  LOW: "bg-blue-500 text-white",
};

const priorityLabels = {
  URGENT: "Urgent",
  HIGH: "Tinggi",
  MEDIUM: "Sedang",
  LOW: "Rendah",
};

const statusColors = {
  BACKLOG: "bg-gray-500",
  TODO: "bg-blue-500",
  IN_PROGRESS: "bg-yellow-500",
  IN_REVIEW: "bg-purple-500",
  DONE: "bg-green-500",
};

export function SprintView({ sprintId, onBack }: SprintViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["sprint", sprintId],
    queryFn: async () => {
      const res = await fetch(`/api/sprints/${sprintId}`);
      if (!res.ok) throw new Error("Gagal memuat sprint");
      return res.json();
    },
  });

  const deleteSprint = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/sprints/${sprintId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus sprint");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Berhasil", description: "Sprint dihapus" });
      onBack();
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const updateSprint = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/sprints/${sprintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Gagal memperbarui sprint");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprint", sprintId] });
      toast({ title: "Berhasil", description: "Sprint diperbarui" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const removeTaskFromSprint = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/sprints/${sprintId}/tasks?taskIds=${taskId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus tugas dari sprint");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprint", sprintId] });
      toast({ title: "Berhasil", description: "Tugas dihapus dari sprint" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-destructive">Gagal memuat sprint</p>
        <Button onClick={() => refetch()}>Coba Lagi</Button>
        <Button variant="outline" onClick={onBack}>Kembali</Button>
      </div>
    );
  }

  const sprint: Sprint = data?.sprint;
  const now = new Date();
  const startDate = new Date(sprint.startDate);
  const endDate = new Date(sprint.endDate);
  const totalDays = differenceInDays(endDate, startDate) + 1;
  const elapsedDays = differenceInDays(now, startDate) + 1;
  const remainingDays = Math.max(0, differenceInDays(endDate, now));
  const progress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));

  const completedTasks = sprint.tasks.filter((t) => t.column.status === "DONE").length;
  const totalTasks = sprint.tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const isOverdue = isBefore(endDate, now) && !sprint.isCompleted;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Flag className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold">{sprint.name}</h1>
            {sprint.isActive && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                Aktif
              </Badge>
            )}
            {sprint.isCompleted && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                Selesai
              </Badge>
            )}
          </div>
          {sprint.goal && (
            <p className="text-muted-foreground text-sm">{sprint.goal}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {}}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Sprint
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (confirm("Hapus sprint ini?")) deleteSprint.mutate();
                }}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent          </DropdownMenu>
        </div>
      </div>

      {/* Sprint Info & Progress */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Sprint Dates */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Periode Sprint</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{format(startDate, "d MMMM yyyy", { locale: id })}</p>
                  <p className="text-sm text-muted-foreground">Mulai</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{format(endDate, "d MMMM yyyy", { locale: id })}</p>
                  <p className="text-sm text-muted-foreground">Berakhir</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{totalDays} hari total • {remainingDays} hari tersisa</span>
              </div>
            </div>
          </CardContent        </Card>

        {/* Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kemajuan Waktu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{Math.round(progress)}% selesai</span>
                <span>{elapsedDays}/{totalDays} hari</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          </CardContent        </Card>

        {/* Task Completion */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tugas Terselesaikan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{completedTasks}/{totalTasks} tugas</span>
                <span>{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-3" />
            </div>
          </CardContent        </Card>

        {/* Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-3 h-3 rounded-full",
                sprint.isCompleted ? "bg-green-500" :
                isOverdue ? "bg-red-500" :
                sprint.isActive ? "bg-blue-500" : "bg-gray-500"
              )} />
              <div>
                <p className="font-medium">
                  {sprint.isCompleted ? "Selesai" :
                   isOverdue ? "Terlambat" :
                   sprint.isActive ? "Aktif" : "Belum Dimulai"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isOverdue && `Terlambat ${Math.abs(remainingDays)} hari`}
                </p>
              </div>
            </div>
          </CardContent        </Card>
      </div>

      {/* Burndown Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Burndown Chart</CardTitle>
          <CardDescription>Visualisasi sisa kerja vs waktu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
            <div className="text-center text-muted-foreground">
              <TrendingDown className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Burndown chart akan ditampilkan di sini</p>
              <p className="text-sm">(Membutuhkan Recharts line chart implementasi)</p>
            </div>
          </div>
        </CardContent      </Card>

      {/* Sprint Tasks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle>Tugas Sprint ({totalTasks})</CardTitle>
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {completedTasks} Selesai
          </Badge>
        </div>

        {/* Group tasks by column status */}
        {(() => {
          const tasksByStatus = sprint.tasks.reduce((acc, task) => {
            const status = task.column.status;
            if (!acc[status]) acc[status] = [];
            acc[status].push(task);
            return acc;
          }, {} as Record<string, typeof sprint.tasks>);

          const statusOrder = ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

          return statusOrder.map((status) => {
            const tasks = tasksByStatus[status] || [];
            if (tasks.length === 0) return null;

            return (
              <Card key={status} className="overflow-hidden">
                <CardHeader className="pb-2 py-3 px-4 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: statusColors[status as keyof typeof statusColors] }}
                      />
                      <span className="font-medium capitalize">{status.replace("_", " ")}</span>
                      <Badge variant="secondary">{tasks.length}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-4 hover:bg-muted/30 transition-colors flex items-center gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{task.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Badge
                              variant="secondary"
                              className={cn("text-[10px] h-4 px-1.5", priorityColors[task.priority as keyof typeof priorityColors])}
                            >
                              {priorityLabels[task.priority as keyof typeof priorityLabels]}
                            </Badge>
                            {task.assignees.length > 0 && (
                              <div className="flex -space-x-1">
                                {task.assignees.slice(0, 2).map(({ user }) => (
                                  <Avatar key={user.id} className="w-5 h-5 border-2 border-background">
                                    <AvatarImage src={user.avatarUrl || undefined} />
                                    <AvatarFallback className="text-[9px]">{getInitials(user.name || user.email)}</AvatarFallback>
                                  </Avatar>
                                ))}
                                {task.assignees.length > 2 && (
                                  <span className="text-[10px] text-muted-foreground">+{task.assignees.length - 2}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => removeTaskFromSprint.mutate(task.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Hapus dari Sprint
                            </DropdownMenuItem>
                          </DropdownMenuContent                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                </CardContent              </Card>
            );
          });
        })()}
      </div>
    </div>
  );
}