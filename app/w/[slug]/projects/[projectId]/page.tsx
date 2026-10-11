"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Loader2,
  Plus,
  Settings,
  MoreVertical,
  Calendar,
  Tag,
  MessageSquare,
  Paperclip,
  CheckSquare,
  LayoutGrid,
  List,
  GanttChart,
  Search,
  Filter,
  X,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { getInitials, formatDate } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TaskDetail } from "@/components/board/task-detail";
import { CreateTaskDialog } from "@/components/board/create-task-dialog";
import { ViewSwitcher, ViewType } from "@/components/board/view-switcher";
import { FilterBar, TaskFilters } from "@/components/board/filter-bar";
import { SavedFilters } from "@/components/board/saved-filters";
import { Dashboard } from "@/components/board/dashboard";
import { ListView } from "@/components/board/list-view";
import { CalendarView } from "@/components/board/calendar-view";
import { TimelineView } from "@/components/board/timeline-view";
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
} from "@/components/ui/dropdown-menu";

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
}

interface Column {
  id: string;
  name: string;
  status: string;
  color: string;
  position: number;
  tasks: Task[];
}

interface Project {
  id: string;
  name: string;
  key: string;
  color: string;
  columns: Column[];
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
}

const priorityColors = {
  URGENT: "text-red-500",
  HIGH: "text-orange-500",
  MEDIUM: "text-yellow-500",
  LOW: "text-blue-500",
};

function TaskCard({ task, onClick }: { task: Task; onClick?: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const completedSubtasks = task.subtasks.filter((st) => st.isCompleted).length;
  const totalSubtasks = task.subtasks.length;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-2 cursor-move hover:border-primary transition-colors"
      onClick={(e) => {
        if (!isDragging && onClick) {
          onClick();
        }
      }}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          <p className="font-medium text-sm line-clamp-2">{task.title}</p>

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
              {task._count.attachments > 0 && (
                <div className="flex items-center gap-1">
                  <Paperclip className="w-3 h-3" />
                  <span>{task._count.attachments}</span>
                </div>
              )}
            </div>

            {task.assignees.length > 0 && (
              <div className="flex -space-x-2">
                {task.assignees.slice(0, 3).map(({ user }) => (
                  <Avatar key={user.id} className="w-5 h-5 border-2 border-background">
                    <AvatarImage src={user.avatarUrl || undefined} />
                    <AvatarFallback className="text-[10px]">
                      {getInitials(user.name || user.email)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {task.assignees.length > 3 && (
                  <div className="w-5 h-5 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px]">
                    +{task.assignees.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function KanbanColumn({
  column,
  onCreateTask,
  onTaskClick,
}: {
  column: Column;
  onCreateTask: (columnId: string) => void;
  onTaskClick: (taskId: string) => void;
}) {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: { type: "column" },
  });

  return (
    <div ref={setNodeRef} className="flex flex-col w-80 shrink-0">
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
          onClick={() => onCreateTask(column.id)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <SortableContext
        items={column.tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 min-h-[200px] space-y-2">
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task.id)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export default function ProjectBoardPage({
  params,
}: {
  params: { slug: string; projectId: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createDialogColumnId, setCreateDialogColumnId] = useState<string | null>(null);
  const [view, setView] = useState<ViewType>("board");
  const [filters, setFilters] = useState<TaskFilters>({
    search: "",
    assignee: null,
    label: null,
    priority: null,
    status: null,
    dueDate: null,
    hasSubtasks: null,
  });

  const handleLoadFilter = (savedFilters: any) => {
    setFilters(savedFilters);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ["project", params.projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${params.projectId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal memuat proyek");
      }
      return res.json();
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ["project", params.projectId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = data?.project.columns
      .flatMap((col: Column) => col.tasks)
      .find((t: Task) => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || active.id === over.id) return;

    const activeTask = data?.project.columns
      .flatMap((col: Column) => col.tasks)
      .find((t: Task) => t.id === active.id);

    if (!activeTask) return;

    // Find target column
    const targetColumn = data?.project.columns.find((col: Column) =>
      col.tasks.some((t: Task) => t.id === over.id) || col.id === over.id
    );

    if (!targetColumn) return;

    // Calculate new position
    const tasksInColumn = targetColumn.tasks;
    const overIndex = tasksInColumn.findIndex((t: Task) => t.id === over.id);
    const newPosition = overIndex >= 0 ? overIndex : tasksInColumn.length;

    moveTask.mutate({
      taskId: active.id as string,
      columnId: targetColumn.id,
      position: newPosition,
    });
  };

  // Get all unique assignees and labels for filters
  const allTasks = useMemo(
    () => data?.project.columns.flatMap((col: Column) => col.tasks) || [],
    [data]
  );

  const allAssignees = useMemo(() => {
    const assigneeMap = new Map();
    allTasks.forEach((task) => {
      task.assignees.forEach(({ user }) => {
        if (!assigneeMap.has(user.id)) {
          assigneeMap.set(user.id, user);
        }
      });
    });
    return Array.from(assigneeMap.values());
  }, [allTasks]);

  const allLabels = useMemo(() => {
    const labelMap = new Map();
    allTasks.forEach((task) => {
      task.labels.forEach(({ label }) => {
        if (!labelMap.has(label.id)) {
          labelMap.set(label.id, label);
        }
      });
    });
    return Array.from(labelMap.values());
  }, [allTasks]);

  // Apply filters
  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const titleMatch = task.title.toLowerCase().includes(searchLower);
        const descMatch = task.description?.toLowerCase().includes(searchLower);
        const labelMatch = task.labels.some(({ label }) =>
          label.name.toLowerCase().includes(searchLower)
        );
        if (!titleMatch && !descMatch && !labelMatch) return false;
      }

      // Assignee filter
      if (filters.assignee) {
        const hasAssignee = task.assignees.some(({ user }) => user.id === filters.assignee);
        if (!hasAssignee) return false;
      }

      // Label filter
      if (filters.label) {
        const hasLabel = task.labels.some(({ label }) => label.id === filters.label);
        if (!hasLabel) return false;
      }

      // Priority filter
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }

      // Status/Column filter
      if (filters.status && task.column.id !== filters.status) {
        return false;
      }

      // Due date filter
      if (filters.dueDate) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        if (filters.dueDate === "overdue") {
          if (!task.dueDate || new Date(task.dueDate) >= today) return false;
        } else if (filters.dueDate === "today") {
          if (!task.dueDate || !isSameDay(new Date(task.dueDate), today)) return false;
        } else if (filters.dueDate === "this-week") {
          if (!task.dueDate || new Date(task.dueDate) < today || new Date(task.dueDate) > weekEnd) return false;
        } else if (filters.dueDate === "none") {
          if (task.dueDate) return false;
        }
      }

      // Has subtasks filter
      if (filters.hasSubtasks === true && task.subtasks.length === 0) {
        return false;
      }

      return true;
    });
  }, [allTasks, filters]);

  // Group filtered tasks by column
  const filteredColumns = useMemo(() => {
    if (!data?.project.columns) return [];
    return data.project.columns.map((column) => ({
      ...column,
      tasks: filteredTasks.filter((t) => t.column.id === column.id),
    }));
  }, [data?.project.columns, filteredTasks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-destructive">
          {error instanceof Error ? error.message : "Terjadi kesalahan"}
        </p>
        <Button onClick={() => router.push(`/w/${params.slug}`)}>
          Kembali ke Workspace
        </Button>
      </div>
    );
  }

  const project: Project = data?.project;

  return (
    <>
      <div className="flex flex-col h-screen">
        <div className="border-b bg-background">
          <div className="container flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: project.color }}
              >
                {project.key}
              </div>
              <div>
                <h1 className="text-xl font-bold">{project.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {project.workspace.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Pengaturan
              </Button>
            </div>
          </div>

          {/* View Switcher & Filters */}
          <div className="container px-4 py-3 border-t">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <ViewSwitcher view={view} onViewChange={setView} />

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <FilterBar
                  filters={filters}
                  onFiltersChange={setFilters}
                  assignees={allAssignees}
                  labels={allLabels}
                  columns={project.columns}
                />
                <SavedFilters
                  projectId={params.projectId}
                  workspaceId={project.workspace.id}
                  currentFilters={filters}
                  onLoadFilter={handleLoadFilter}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="container h-full py-6">
            {view === "board" && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="flex gap-4 h-full">
                  {filteredColumns.map((column) => (
                    <KanbanColumn
                      key={column.id}
                      column={column}
                      onCreateTask={setCreateDialogColumnId}
                      onTaskClick={setSelectedTaskId}
                    />
                  ))}
                </div>

                <DragOverlay>
                  {activeTask ? (
                    <TaskCard task={activeTask} onClick={() => {}} />
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}

            {view === "list" && (
              <ListView
                projectId={params.projectId}
                tasks={filteredTasks}
                columns={project.columns}
                onTaskClick={setSelectedTaskId}
                onCreateTask={setCreateDialogColumnId}
                view={view}
              />
            )}

            {view === "calendar" && (
              <CalendarView
                projectId={params.projectId}
                tasks={filteredTasks}
                columns={project.columns}
                onTaskClick={setSelectedTaskId}
                onCreateTask={setCreateDialogColumnId}
                view="month"
              />
            )}

            {view === "timeline" && (
              <TimelineView
                projectId={params.projectId}
                tasks={filteredTasks}
                columns={project.columns}
                onTaskClick={setSelectedTaskId}
                onCreateTask={setCreateDialogColumnId}
              />
            )}

            {view === "dashboard" && (
              <Dashboard
                projectId={params.projectId}
                workspaceId={project.workspace.id}
              />
            )}
          </div>
        </div>
      </div>

      <Sheet open={!!selectedTaskId} onOpenChange={(open) => !open && setSelectedTaskId(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedTaskId && (
            <TaskDetail taskId={selectedTaskId} projectId={params.projectId} />
          )}
        </SheetContent      </Sheet>

      <CreateTaskDialog
        open={!!createDialogColumnId}
        onOpenChange={(open) => !open && setCreateDialogColumnId(null)}
        projectId={params.projectId}
        columnId={createDialogColumnId || ""}
      />
    </>
  );
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}