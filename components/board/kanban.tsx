"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Plus, X, ChevronLeft, ChevronRight, Settings, Save, Download, Upload, Trash2, Edit, Copy, Eye, Share2 } from "lucide-react";

export function TaskCard({ task, onClick, onDragStart, onDragEnd }: { task: any; onClick?: () => void; onDragStart?: () => void; onDragEnd?: () => void }) {
  return (
    <div
      className={cn(
        "group relative bg-card border border-border rounded-lg p-3 shadow-sm transition-all duration-200 hover:shadow-md",
        "cursor-pointer"
      )}
      onClick={onClick}
      draggable={true}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex items-start gap-2">
        <div className="h-2 w-2 rounded-full mt-1.5 flex-shrink-0 bg-primary" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
          {task.dueDate && (
            <div className="flex items-center gap-1 mt-1">
              <svg className="h-3 w-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-xs text-muted-foreground">{new Date(task.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
            </div>
          )}
          {task.assignees && task.assignees.length > 0 && (
            <div className="flex -space-x-1 mt-1">
              {task.assignees.slice(0, 3).map((assignee: any, i: number) => (
                <div key={i} className="h-6 w-6 rounded-full bg-primary/10 border-2 border-card flex items-center justify-center text-xs font-medium text-primary">
                  {assignee.user?.name?.charAt(0) || "?"}
                </div>
              ))}
              {task.assignees.length > 3 && (
                <div className="h-6 w-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-xs font-medium text-muted-foreground">
                  +{task.assignees.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.labels.slice(0, 4).map((label: any) => (
            <span
              key={label.id}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
              style={{ backgroundColor: `${label.color}20`, color: label.color }}
            >
              {label.name}
            </span>
          ))}
          {task.labels.length > 4 && <span className="text-xs text-muted-foreground">+{task.labels.length - 4}</span>}
        </div>
      )}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-2">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(task.subtasks.filter((s: any) => s.completed).length / task.subtasks.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {task.subtasks.filter((s: any) => s.completed).length} / {task.subtasks.length} subtugas
          </p>
        </div>
      )}
    </div>
  );
}

export function Column({ title, status, tasks, taskCount, wipLimit, onTaskDrop, onAddTask }: any) {
  const isOverWip = wipLimit && taskCount > wipLimit;

  return (
    <div className="flex flex-col w-72 flex-shrink-0 min-h-[500px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
          {title}
          <span className={cn("px-1.5 py-0.5 text-xs font-medium rounded-full", isOverWip ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground")}>
            {taskCount}
          </span>
          {wipLimit && (
            <span className={cn("px-1.5 py-0.5 text-xs font-medium rounded-full", isOverWip ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground")}>
              {taskCount}/{wipLimit}
            </span>
          )}
        </h3>
      </div>
      <div
        className={cn(
          "flex-1 min-h-[300px] rounded-lg bg-muted/30 p-2 space-y-2 overflow-y-auto",
          "drop-zone"
        )}
        role="list"
        aria-label={`Kolom ${title}`}
      >
        {tasks.map((task: any, index: number) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <div className="h-20 flex items-center justify-center text-muted-foreground/50 text-sm">
            Kosong — tarik tugas ke sini atau klik +
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2"
        onClick={onAddTask}
      >
        <Plus className="h-4 w-4" />
        Tambah tugas
      </Button>
    </div>
  );
}

export function KanbanBoard({ columns, tasks, onTaskMove, onAddTask }: any) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4" role="region" aria-label="Kanban Board">
      {columns.map((column: any) => (
        <Column
          key={column.id}
          title={column.name}
          status={column.status}
          tasks={tasks.filter((t: any) => t.columnId === column.id)}
          taskCount={tasks.filter((t: any) => t.columnId === column.id).length}
          wipLimit={column.wipLimit}
          onTaskDrop={(taskId: string) => onTaskMove(taskId, column.id)}
          onAddTask={() => onAddTask(column.id)}
        />
      ))}
      <div className="flex-shrink-0 w-72 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-foreground">+ Kolom Baru</h3>
        </div>
        <Button variant="outline" className="w-full h-[300px] flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground border-dashed">
          <Plus className="h-8 w-8" />
          <span>Tambah Kolom</span>
        </Button>
      </div>
    </div>
  );
}