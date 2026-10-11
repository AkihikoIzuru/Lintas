"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Calendar,
  Tag,
  User,
  MessageSquare,
  Paperclip,
  CheckSquare,
  Clock,
  Trash2,
  Plus,
  MoreVertical,
  X,
} from "lucide-react";
import { getInitials, formatRelativeTime } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Dependencies } from "./dependencies";
import { CustomFieldInput } from "./custom-field-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TaskDetailProps {
  taskId: string;
  projectId: string;
}

export function TaskDetail({ taskId, projectId }: TaskDetailProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [commentContent, setCommentContent] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal memuat tugas");
      }
      return res.json();
    },
  });

  const updateTask = useMutation({
    mutationFn: async (updates: any) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal memperbarui tugas");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast({
        title: "Berhasil",
        description: "Tugas berhasil diperbarui",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addComment = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal menambahkan komentar");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      setCommentContent("");
      toast({
        title: "Berhasil",
        description: "Komentar berhasil ditambahkan",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const task = data?.task;

  if (!task) {
    return <div>Tugas tidak ditemukan</div>;
  }

  const completedSubtasks = task.subtasks.filter((st: any) => st.isCompleted).length;
  const totalSubtasks = task.subtasks.length;

  const priorityOptions = [
    { value: "LOW", label: "Rendah", color: "text-blue-500" },
    { value: "MEDIUM", label: "Sedang", color: "text-yellow-500" },
    { value: "HIGH", label: "Tinggi", color: "text-orange-500" },
    { value: "URGENT", label: "Mendesak", color: "text-red-500" },
  ];

  const currentPriority = priorityOptions.find((p) => p.value === task.priority);

  return (
    <div className="space-y-6">
      <SheetHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditingTitle ? (
              <Input
                defaultValue={task.title}
                autoFocus
                onBlur={(e) => {
                  if (e.target.value && e.target.value !== task.title) {
                    updateTask.mutate({ title: e.target.value });
                  }
                  setIsEditingTitle(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
              />
            ) : (
              <SheetTitle
                className="cursor-pointer hover:text-primary"
                onClick={() => setIsEditingTitle(true)}
              >
                {task.title}
              </SheetTitle>
            )}
            <SheetDescription className="mt-2">
              dalam {task.column.name} • {task.project.key}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="space-y-4">
        {/* Priority */}
        <div className="space-y-2">
          <Label>Prioritas</Label>
          <Select
            value={task.priority}
            onValueChange={(value) => updateTask.mutate({ priority: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className={option.color}>{option.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label>Deskripsi</Label>
          {isEditingDescription ? (
            <Textarea
              defaultValue={task.description || ""}
              placeholder="Tambahkan deskripsi..."
              rows={4}
              autoFocus
              onBlur={(e) => {
                updateTask.mutate({ description: e.target.value || null });
                setIsEditingDescription(false);
              }}
            />
          ) : (
            <div
              className="text-sm text-muted-foreground cursor-pointer hover:text-foreground p-2 border rounded-md min-h-[80px]"
              onClick={() => setIsEditingDescription(true)}
            >
              {task.description || "Klik untuk menambahkan deskripsi..."}
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          {/* Start Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Tanggal Mulai
            </Label>
            <div className="relative">
              <Input
                type="date"
                value={task.startDate ? format(parseISO(task.startDate), "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  const value = e.target.value;
                  updateTask.mutate({
                    startDate: value ? new Date(value).toISOString() : null
                  });
                }}
                className="w-full"
              />
              {task.startDate && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-7 w-7"
                  onClick={() => updateTask.mutate({ startDate: null })}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Jatuh Tempo
            </Label>
            <div className="relative">
              <Input
                type="date"
                value={task.dueDate ? format(parseISO(task.dueDate), "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  const value = e.target.value;
                  updateTask.mutate({
                    dueDate: value ? new Date(value).toISOString() : null
                  });
                }}
                className={cn(
                  "w-full",
                  task.dueDate && new Date(task.dueDate) < new Date() && "border-destructive"
                )}
              />
              {task.dueDate && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-7 w-7"
                  onClick={() => updateTask.mutate({ dueDate: null })}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            {task.dueDate && new Date(task.dueDate) < new Date() && (
              <p className="text-xs text-destructive">Tugas terlambat!</p>
            )}
          </div>
        </div>

        {/* Assignees */}
        <div className="space-y-2">
          <Label>Ditugaskan kepada</Label>
          <div className="flex flex-wrap gap-2">
            {task.assignees.length > 0 ? (
              task.assignees.map(({ user }: any) => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 px-2 py-1 border rounded-md"
                >
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={user.avatarUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(user.name || user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{user.name || user.email}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada yang ditugaskan</p>
            )}
          </div>
        </div>

        {/* Labels */}
        <div className="space-y-2">
          <Label>Label</Label>
          <div className="flex flex-wrap gap-2">
            {task.labels.length > 0 ? (
              task.labels.map(({ label }: any) => (
                <Badge
                  key={label.id}
                  variant="secondary"
                  style={{
                    backgroundColor: `${label.color}20`,
                    color: label.color,
                    borderColor: label.color,
                  }}
                >
                  {label.name}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada label</p>
            )}
          </div>
        </div>

        {/* Custom Fields */}
        <div className="space-y-2">
          <Label>Custom Fields</Label>
          <CustomFieldInput taskId={taskId} projectId={projectId} />
        </div>

        <Separator />

        {/* Dependencies */}
        <div className="space-y-2">
          <Label>Dependensi Tugas</Label>
          <Dependencies taskId={taskId} projectId={projectId} />
        </div>

        <Separator />

        {/* Subtasks */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>
              Subtask ({completedSubtasks}/{totalSubtasks})
            </Label>
            <Button variant="ghost" size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {task.subtasks.map((subtask: any) => (
              <div key={subtask.id} className="flex items-center gap-2">
                <Checkbox
                  checked={subtask.isCompleted}
                  onCheckedChange={(checked) => {
                    // TODO: Update subtask
                  }}
                />
                <span
                  className={`text-sm ${
                    subtask.isCompleted ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {subtask.title}
                </span>
              </div>
            ))}
            {task.subtasks.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada subtask</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Activity & Comments */}
        <div className="space-y-4">
          <Label>Aktivitas</Label>

          {/* Add comment */}
          <div className="space-y-2">
            <Textarea
              placeholder="Tulis komentar..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              rows={3}
            />
            <Button
              size="sm"
              disabled={!commentContent.trim() || addComment.isPending}
              onClick={() => addComment.mutate(commentContent)}
            >
              {addComment.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mengirim...
                </>
              ) : (
                "Kirim Komentar"
              )}
            </Button>
          </div>

          {/* Comments list */}
          <div className="space-y-4">
            {task.comments.map((comment: any) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={comment.author.avatarUrl || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(comment.author.name || "User")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{comment.author.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(new Date(comment.createdAt))}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{comment.content}</p>
                </div>
              </div>
            ))}
            {task.comments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Belum ada komentar
              </p>
            )}
          </div>

          {/* Activity log */}
          {task.activities.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">Riwayat</Label>
                {task.activities.slice(0, 10).map((activity: any) => (
                  <div key={activity.id} className="flex gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 mt-0.5" />
                    <div>
                      <span className="font-medium">{activity.user.name}</span>{" "}
                      {activity.type === "CREATED" && "membuat tugas"}
                      {activity.type === "UPDATED" && "memperbarui tugas"}
                      {activity.type === "MOVED" && "memindahkan tugas"}
                      {activity.type === "COMMENTED" && "menambahkan komentar"}
                      <span className="block">
                        {formatRelativeTime(new Date(activity.createdAt))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}