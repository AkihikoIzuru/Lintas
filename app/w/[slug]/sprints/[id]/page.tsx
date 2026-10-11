"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { Loader2, Plus, ArrowLeft, Settings, Calendar, CheckSquare, Users, Clock, ChevronDown, X, Edit2, Trash2, Download, Upload, FileSpreadsheet, List, GanttChart, MessageSquare, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { getInitials, formatDate } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TaskDetail } from "@/components/board/task-detail";
import { CreateTaskDialog } from "@/components/board/create-task-dialog";
import { SprintBurndown } from "@/components/board/sprint-burndown";
import { CsvImportExport } from "@/components/board/csv-import-export";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  position: number;
  dueDate: string | null;
  startDate: string | null;
  assignees: Array<{
    user: {
      id: string;
      name: string | null;
      email: string;
      avatarUrl: string | null;
    };
  }>;
  labels: Array<{
    label: {
      id: string;
      name: string;
      color: string;
    };
  }>;
  subtasks: Array<{
    id: string;
    title: string;
    isCompleted: boolean;
  }>;
  _count: {
    comments: number;
    attachments: number;
  };
  column: {
    id: string;
    name: string;
    color: string;
    status: string;
  };
  sprintId: string | null;
}

interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  startDate: string;
  endDate: string;
  status: string;
  projectId: string;
  project: {
    id: string;
    name: string;
    key: string;
    color: string;
    columns: Array<{
      id: string;
      name: string;
      status: string;
      color: string;
      position: number;
    }>;
  };
  tasks: Task[];
}

const priorityColors = {
  URGENT: "text-red-500",
  HIGH: "text-orange-500",
  MEDIUM: "text-yellow-500",
  LOW: "text-blue-500",
};

const statusColors = {
  BACKLOG: "bg-gray-100 text-gray-700",
  TODO: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  REVIEW: "bg-purple-100 text-purple-700",
  DONE: "bg-green-100 text-green-700",
};

function TaskCard({ task, onClick }: { task: Task; onClick?: () => void }) {
  const completedSubtasks = task.subtasks.filter((st) => st.isCompleted).length;
  const totalSubtasks = task.subtasks.length;

  return (
    <Card className="mb-2 cursor-pointer hover:border-primary transition-colors" onClick={onClick}>
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-sm line-clamp-2 flex-1">{task.title}</p>
            <Badge
              variant="secondary"
              className={cn("text-xs", statusColors[task.column.status as keyof typeof statusColors] || "bg-gray-100 text-gray-700")}
            >
              {task.column.name}
            </Badge>
          </div>

          {task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.labels.map(({ label }) => (
                <Badge
                  key={label.id}
                  variant="secondary"
                  className="text-xs"
                  style={{
                    backgroundColor: `${label.color}20`,
                    color: label.color,
                    borderColor: label.color,
                  }}
                >
                  {label.name}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              {totalSubtasks > 0 && (
                <div className="flex items-center gap-1">
                  <CheckSquare className="w-3 h-3" />
                  <span>{completedSubtasks}/{totalSubtasks}</span>
                </div>
              )}
              {task._count.comments > 0 && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  <span>{task._count.comments}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {task.priority && (
                <Badge variant="secondary" className={cn("text-xs", priorityColors[task.priority as keyof typeof priorityColors] || "")}>
                  {task.priority}
                </Badge>
              )}
              {task.assignees.length > 0 && (
                <div className="flex -space-x-2">
                  {task.assignees.slice(0, 2).map(({ user }) => (
                    <Avatar key={user.id} className="w-5 h-5 border-2 border-background">
                      <AvatarImage src={user.avatarUrl || undefined} />
                      <AvatarFallback className="text-[10px]">
                        {getInitials(user.name || user.email)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {task.assignees.length > 2 && (
                    <div className="w-5 h-5 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px]">
                      +{task.assignees.length - 2}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SprintDetailPage() {
  const router = useRouter();
  const params = useParams() as Promise<{ slug: string; id: string }>;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createDialogColumnId, setCreateDialogColumnId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"board" | "list" | "burndown">("board");

  const { data, isLoading, error } = useQuery({
    queryKey: ["sprint-detail"],
    queryFn: async () => {
      const resolvedParams = await params;
      const res = await fetch(`/api/sprints/${resolvedParams.id}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal memuat sprint");
      }
      return res.json();
    },
  });

  const sprint: Sprint = data?.sprint;

  const moveTask = useMutation({
    mutationFn: async ({
      taskId,
      columnId,
      position,
    }: {
      taskId: string;
      columnId: string;
      position: number;
    }) => {
      const res = await fetch(`/api/tasks/${taskId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, columnId, position }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal memindahkan tugas");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprint-detail"] });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeTask = sprint?.tasks.find((t: Task) => t.id === active.id);
    if (!activeTask) return;

    const targetColumn = sprint?.project.columns.find((col: any) =>
      col.tasks?.some((t: Task) => t.id === over.id) || col.id === over.id
    );

    if (!targetColumn) return;

    const tasksInColumn = sprint.tasks.filter((t: Task) => t.column.id === targetColumn.id);
    const overIndex = tasksInColumn.findIndex((t: Task) => t.id === over.id);
    const newPosition = overIndex >= 0 ? overIndex : tasksInColumn.length;

    moveTask.mutate({
      taskId: active.id as string,
      columnId: targetColumn.id,
      position: newPosition,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !sprint) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-destructive">
          {error instanceof Error ? error.message : "Sprint tidak ditemukan"}
        </p>
        <Button onClick={() => router.push(`/w/${params.slug}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Workspace
        </Button>
      </div>
    );
  }

  const columns = sprint.project.columns;
  const sprintTasks = sprint.tasks;

  // Group tasks by column for board view
  const columnsWithTasks = columns.map((column) => ({
    ...column,
    tasks: sprintTasks.filter((t) => t.column.id === column.id),
  }));

  const completedTasks = sprintTasks.filter((t) => t.column.status === "DONE").length;
  const totalTasks = sprintTasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const daysRemaining = Math.max(0, Math.ceil(
    (new Date(sprint.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  ));

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push(`/w/${params.slug}`)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">{sprint.project.key}</span>
                <h1 className="text-xl font-bold">{sprint.name}</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)} &middot; {daysRemaining} hari tersisa
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CsvImportExport projectId={sprint.projectId} />
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Pengaturan
            </Button>
          </div>
        </div>

        {/* Sprint Info Bar */}
        <div className="container px-4 pb-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{completedTasks} / {totalTasks}</p>
                    <p className="text-xs text-muted-foreground">Tugas Selesai</p>
                  </div>
                </div>
              </CardContent            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{progress}%</p>
                    <p className="text-xs text-muted-foreground">Kemajuan Sprint</p>
                  </div>
                </div>
              </CardContent            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{daysRemaining}</p>
                    <p className="text-xs text-muted-foreground">Hari Tersisa</p>
                  </div>
                </div>
              </CardContent            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {new Set(sprintTasks.flatMap(t => t.assignees.map(a => a.user.id))).size}
                    </p>
                    <p className="text-xs text-muted-foreground">Anggota Aktif</p>
                  </div>
                </div>
              </CardContent            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {sprintTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.column.status !== "DONE").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Tugas Terlambat</p>
                  </div>
                </div>
              </CardContent            </Card>
          </div>
        </div>

        {/* Tabs */}
        <div className="container px-4 pb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="board">
                <LayoutGrid className="w-4 h-4 mr-2" />
                Board
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="w-4 h-4 mr-2" />
                Daftar
              </TabsTrigger>
              <TabsTrigger value="burndown">
                <GanttChart className="w-4 h-4 mr-2" />
                Burndown
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="container h-full py-6">
          {activeTab === "board" && (
            <div className="flex gap-4 h-full">
              {columnsWithTasks.map((column) => (
                <div key={column.id} className="flex flex-col w-80 shrink-0">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: column.color }}
                      />
                      <h3 className="font-semibold text-sm">{column.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {column.tasks.length}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setCreateDialogColumnId(column.id)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex-1 min-h-[200px] space-y-2">
                    {column.tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => setSelectedTaskId(task.id)}
                      />
                    ))}
                    {column.tasks.length === 0 && (
                      <div className="text-center text-muted-foreground text-sm py-8">
                        Tidak ada tugas
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "list" && (
            <div className="space-y-4">
              {columnsWithTasks.map((column) => (
                <Card key={column.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: column.color }}
                        />
                        <CardTitle className="text-sm">{column.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {column.tasks.length}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {column.tasks.length > 0 ? (
                      <div className="divide-y">
                        {column.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => setSelectedTaskId(task.id)}
                          >
                            <TaskCard task={task} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground text-sm py-8">
                        Tidak ada tugas
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "burndown" && (
            <div className="max-w-4xl mx-auto">
              <SprintBurndown sprintId={sprint.id} />
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Sheet */}
      <Sheet open={!!selectedTaskId} onOpenChange={(open) => !open && setSelectedTaskId(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedTaskId && (
            <TaskDetail taskId={selectedTaskId} projectId={sprint.projectId} />
          )}
        </SheetContent>
      </Sheet>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={!!createDialogColumnId}
        onOpenChange={(open) => !open && setCreateDialogColumnId(null)}
        projectId={sprint.projectId}
        columnId={createDialogColumnId || ""}
      />
    </div>
  );
}