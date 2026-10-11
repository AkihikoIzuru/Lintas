"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
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
  GripVertical,
  ChevronRight,
  CheckSquare,
  MessageSquare,
  Paperclip,
  Tag,
  Calendar,
  User,
  MoreVertical,
  Flag,
  Trash2,
  Edit2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { getInitials, formatDate, cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  position: number;
  dueDate: string | null;
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

interface ListViewProps {
  projectId: string;
  tasks: Task[];
  columns: Array<{ id: string; name: string; color: string; status: string }>;
  onTaskClick: (taskId: string) => void;
  onCreateTask: (columnId: string) => void;
  view: "list" | "board" | "calendar" | "timeline";
}

const priorityColors = {
  URGENT: "text-red-500 bg-red-500/10 border-red-500/20",
  HIGH: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  MEDIUM: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
  LOW: "text-blue-500 bg-blue-500/10 border-blue-500/20",
};

const priorityLabels = {
  URGENT: "Urgent",
  HIGH: "Tinggi",
  MEDIUM: "Sedang",
  LOW: "Rendah",
};

function TaskRow({
  task,
  index,
  onClick,
  onDragStart,
  onDragEnd,
}: {
  task: Task;
  index: number;
  onClick: () => void;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
}) {
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
    <tr
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        cursor-pointer hover:bg-muted/50 transition-colors
        ${isDragging ? "shadow-lg bg-background" : ""}
      `}
      onClick={(e) => {
        // Don't trigger click if clicking on interactive elements
        if (
          e.target instanceof HTMLElement &&
          (e.target.closest("button") ||
            e.target.closest("[role='button']") ||
            e.target.closest("a"))
        ) {
          return;
        }
        if (!isDragging && onClick) {
          onClick();
        }
      }}
    >
      <td className="px-4 py-3 text-center text-muted-foreground">
        <GripVertical
          className="w-4 h-4 mx-auto cursor-grab active:cursor-grabbing text-muted-foreground/50"
          {...listeners}
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: task.column.color }}
          />
          <div>
            <p className="font-medium text-sm">{task.title}</p>
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {task.description}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <Badge
          variant="secondary"
          className={cn("text-xs", priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.MEDIUM)}
        >
          {priorityLabels[task.priority as keyof typeof priorityLabels] || task.priority}
        </Badge>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        {task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.labels.slice(0, 3).map(({ label }) => (
              <Badge
                key={label.id}
                variant="secondary"
                className="text-[10px] h-5 px-2"
                style={{
                  backgroundColor: `${label.color}20`,
                  color: label.color,
                  borderColor: label.color,
                }}
              >
                {label.name}
              </Badge>
            ))}
            {task.labels.length > 3 && (
              <Badge variant="outline" className="text-[10px] h-5 px-2">
                +{task.labels.length - 3}
              </Badge>
            )}
          </div>
        )}
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        {task.dueDate ? (
          <div className="flex items-center gap-1 text-sm">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            <span
              className={cn(
                format(new Date(task.dueDate), "yyyy-MM-dd") < format(new Date(), "yyyy-MM-dd")
                  ? "text-destructive"
                  : "text-muted-foreground"
              )}
            >
              {formatDate(task.dueDate)}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </td>
      <td className="px-4 py-3 hidden xl:table-cell">
        <div className="flex items-center gap-2">
          {task.assignees.slice(0, 2).map(({ user }) => (
            <Avatar key={user.id} className="w-6 h-6 border-2 border-background">
              <AvatarImage src={user.avatarUrl || undefined} />
              <AvatarFallback className="text-[10px]">
                {getInitials(user.name || user.email)}
              </AvatarFallback>
            </Avatar>
          ))}
          {task.assignees.length > 2 && (
            <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px]">
              +{task.assignees.length - 2}
            </div>
          )}
          {task.assignees.length === 0 && (
            <span className="text-muted-foreground text-sm">-</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {totalSubtasks > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <CheckSquare className="w-3 h-3" />
              <span>{completedSubtasks}/{totalSubtasks}</span>
            </div>
          )}
          {task._count.comments > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MessageSquare className="w-3 h-3" />
              <span>{task._count.comments}</span>
            </div>
          )}
          {task._count.attachments > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Paperclip className="w-3 h-3" />
              <span>{task._count.attachments}</span>
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onClick}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onClick()}>
              <Flag className="w-4 h-4 mr-2" />
              Detail
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => {}}>
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

export function ListView({
  projectId,
  tasks,
  columns,
  onTaskClick,
  onCreateTask,
}: ListViewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    onDragStart(event);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    onDragEnd(event);
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <CheckSquare className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-medium">Belum ada tugas</h3>
          <p className="text-muted-foreground text-sm">
            Klik "Tambah Tugas" untuk membuat tugas pertama Anda
          </p>
        </div>
      </div>
    );
  }

  // Group tasks by column for list view
  const tasksByColumn = columns.reduce(
    (acc, col) => {
      acc[col.id] = tasks.filter((t) => t.column.id === col.id);
      return acc;
    },
    {} as Record<string, Task[]>
  );

  return (
    <div className="overflow-x-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tugas
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                Prioritas
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                Label
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                Jatuh Tempo
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">
                Assignee
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Info
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12">
              </th>
            </tr>
          </thead>
          <tbody>
            {columns.map((column) => {
              const columnTasks = tasksByColumn[column.id] || [];
              return (
                <React.Fragment key={column.id}>
                  {/* Column Header */}
                  <tr className="border-b bg-muted/30">
                    <td colSpan={8} className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: column.color }}
                        />
                        <span className="font-semibold text-sm">{column.name}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {columnTasks.length}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCreateTask(column.id)}
                          className="ml-2"
                        >
                          Tambah Tugas
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {/* Column Tasks */}
                  <SortableContext
                    items={columnTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {columnTasks.map((task, index) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        index={index}
                        onClick={() => onTaskClick(task.id)}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      />
                    ))}
                    {columnTasks.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-4 text-center text-muted-foreground text-sm">
                          Tidak ada tugas di kolom ini
                        </td>
                      </tr>
                    )}
                  </SortableContext>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </DndContext>
    </div>
  );
}