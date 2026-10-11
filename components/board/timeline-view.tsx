"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  GanttChart,
  MoreHorizontal,
  Clock,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { format, startOfMonth, endOfMonth, addMonths, subMonths, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isBefore, startOfDay, differenceInDays, addDays } from "date-fns";
import { id } from "date-fns/locale";

interface Task {
  id: string;
  title: string;
  priority: string;
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
  column: {
    id: string;
    name: string;
    color: string;
    status: string;
  };
}

interface TimelineViewProps {
  projectId: string;
  tasks: Task[];
  columns: Array<{ id: string; name: string; color: string; status: string }>;
  onTaskClick: (taskId: string) => void;
  onCreateTask: (columnId: string) => void;
}

const priorityColors = {
  URGENT: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-blue-500",
};

const priorityLabels = {
  URGENT: "Urgent",
  HIGH: "Tinggi",
  MEDIUM: "Sedang",
  LOW: "Rendah",
};

const timelineScales = [
  { key: "day", label: "Hari", days: 1 },
  { key: "week", label: "Minggu", days: 7 },
  { key: "month", label: "Bulan", days: 30 },
  { key: "quarter", label: "Kuartal", days: 90 },
] as const;

type TimelineScale = typeof timelineScales[number]["key"];

function TaskBar({
  task,
  scale,
  startDate,
  endDate,
  onClick,
}: {
  task: Task;
  scale: TimelineScale;
  startDate: Date;
  endDate: Date;
  onClick: () => void;
}) {
  const taskStart = task.startDate ? new Date(task.startDate) : (task.dueDate ? new Date(task.dueDate) : null);
  const taskEnd = task.dueDate ? new Date(task.dueDate) : null;

  if (!taskStart || !taskEnd) return null;

  // Clamp to visible range
  const clampedStart = taskStart < startDate ? startDate : taskStart;
  const clampedEnd = taskEnd > endDate ? endDate : taskEnd;

  if (clampedStart > clampedEnd) return null;

  const totalDays = differenceInDays(endDate, startDate) + 1;
  const taskStartOffset = differenceInDays(clampedStart, startDate);
  const taskDuration = differenceInDays(clampedEnd, clampedStart) + 1;

  const leftPercent = (taskStartOffset / totalDays) * 100;
  const widthPercent = (taskDuration / totalDays) * 100;

  return (
    <div
      className="absolute h-8 rounded-lg cursor-pointer transition-all hover:shadow-md hover:z-10"
      style={{
        left: `${leftPercent}%`,
        width: `${Math.max(widthPercent, 2)}%`,
        backgroundColor: priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.MEDIUM,
      }}
      onClick={onClick}
      title={`${task.title} (${formatDate(taskStart.toISOString())} - ${formatDate(taskEnd.toISOString())})`}
    >
      <div className="px-2 h-full flex items-center overflow-hidden text-white text-xs font-medium truncate">
        {task.title}
      </div>
    </div>
  );
}

function TimelineRow({
  task,
  scale,
  startDate,
  endDate,
  onTaskClick,
}: {
  task: Task;
  scale: TimelineScale;
  startDate: Date;
  endDate: Date;
  onTaskClick: (taskId: string) => void;
}) {
  const taskStart = task.startDate ? new Date(task.startDate) : (task.dueDate ? new Date(task.dueDate) : null);
  const taskEnd = task.dueDate ? new Date(task.dueDate) : null;

  const hasDates = taskStart && taskEnd;
  const isOverdue = taskEnd && isBefore(startOfDay(taskEnd), startOfDay(new Date())) && task.column.status !== "DONE";

  return (
    <div className="relative h-10 border-b border-muted/50">
      <div className="absolute inset-0 flex items-center">
        {hasDates && (
          <TaskBar
            task={task}
            scale={scale}
            startDate={startDate}
            endDate={endDate}
            onClick={() => onTaskClick(task.id)}
          />
        )}
      </div>
      <div className="relative z-10 flex items-center gap-3 px-3 h-full">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: task.column.color }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{task.title}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge
              variant="secondary"
              className={cn("text-[10px] h-4 px-1.5", priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.MEDIUM)}
            >
              {priorityLabels[task.priority as keyof typeof priorityLabels] || task.priority}
            </Badge>
            {task.dueDate && (
              <span className={cn("flex items-center gap-1", isOverdue && "text-destructive")}>
                <Clock className="w-3 h-3" />
                {formatDate(task.dueDate)}
                {isOverdue && <Flag className="w-3 h-3" />}
              </span>
            )}
            {task.assignees.length > 0 && (
              <div className="flex items-center gap-1">
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
            <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onTaskClick(task.id)}>
              <Flag className="w-4 h-4 mr-2" />
              Detail
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Hapus</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function TimelineHeader({
  scale,
  startDate,
  endDate,
}: {
  scale: TimelineScale;
  startDate: Date;
  endDate: Date;
}) {
  const totalDays = differenceInDays(endDate, startDate) + 1;

  if (scale === "day") {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    return (
      <div className="flex border-b border-muted bg-muted/30">
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className="flex-1 min-w-[60px] px-2 py-1 text-center text-xs font-medium text-muted-foreground border-r border-muted/50"
          >
            {format(day, "d", { locale: id })}
            <div className="text-[10px]">{format(day, "EEE", { locale: id })}</div>
          </div>
        ))}
      </div>
    );
  }

  if (scale === "week") {
    const weeks: Date[] = [];
    let current = startOfWeek(startDate, { weekStartsOn: 1 });
    while (isBefore(current, endDate) || isSameDay(current, endDate)) {
      weeks.push(current);
      current = addDays(current, 7);
    }
    return (
      <div className="flex border-b border-muted bg-muted/30">
        {weeks.map((week) => (
          <div
            key={week.toISOString()}
            className="flex-1 min-w-[100px] px-2 py-1 text-center text-xs font-medium text-muted-foreground border-r border-muted/50"
          >
            {format(week, "d MMM", { locale: id })} - {format(addDays(week, 6), "d MMM", { locale: id })}
          </div>
        ))}
      </div>
    );
  }

  if (scale === "month") {
    const months: Date[] = [];
    let current = startOfMonth(startDate);
    while (isBefore(current, endDate) || isSameDay(current, endDate)) {
      months.push(current);
      current = addMonths(current, 1);
    }
    return (
      <div className="flex border-b border-muted bg-muted/30">
        {months.map((month) => (
          <div
            key={month.toISOString()}
            className="flex-1 min-w-[120px] px-2 py-1 text-center text-xs font-medium text-muted-foreground border-r border-muted/50"
          >
            {format(month, "MMMM yyyy", { locale: id })}
          </div>
        ))}
      </div>
    );
  }

  // quarter
  const quarters: Date[] = [];
  let current = startDate;
  const quarterMonths = [0, 3, 6, 9];
  while (isBefore(current, endDate) || isSameDay(current, endDate)) {
    const quarterStart = new Date(current.getFullYear(), Math.floor(current.getMonth() / 3) * 3, 1);
    if (!quarters.some((q) => q.getTime() === quarterStart.getTime())) {
      quarters.push(quarterStart);
    }
    current = addMonths(current, 3);
  }
  return (
    <div className="flex border-b border-muted bg-muted/30">
      {quarters.map((quarter) => (
        <div
          key={quarter.toISOString()}
          className="flex-1 min-w-[140px] px-2 py-1 text-center text-xs font-medium text-muted-foreground border-r border-muted/50"
        >
          Q{Math.floor(quarter.getMonth() / 3) + 1} {quarter.getFullYear()}
        </div>
      ))}
    </div>
  );
}

export function TimelineView({
  projectId,
  tasks,
  columns,
  onTaskClick,
  onCreateTask,
}: TimelineViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scale, setScale] = useState<TimelineScale>("week");

  // Calculate date range based on tasks and current view
  const tasksWithDates = tasks.filter((t) => t.dueDate || t.startDate);
  const allDates = tasksWithDates.flatMap((t) => [
    t.startDate ? new Date(t.startDate) : null,
    t.dueDate ? new Date(t.dueDate) : null,
  ]).filter((d): d is Date => d !== null);

  const minDate = allDates.length > 0 ? new Date(Math.min(...allDates.map((d) => d.getTime()))) : new Date();
  const maxDate = allDates.length > 0 ? new Date(Math.max(...allDates.map((d) => d.getTime()))) : new Date();

  // Extend range based on scale
  let startDate: Date;
  let endDate: Date;

  switch (scale) {
    case "day":
      startDate = startOfWeek(subMonths(currentDate, 1), { weekStartsOn: 1 });
      endDate = endOfWeek(addMonths(currentDate, 1), { weekStartsOn: 1 });
      break;
    case "week":
      startDate = startOfMonth(subMonths(currentDate, 1));
      endDate = endOfMonth(addMonths(currentDate, 2));
      break;
    case "month":
      startDate = startOfMonth(subMonths(currentDate, 3));
      endDate = endOfMonth(addMonths(currentDate, 3));
      break;
    case "quarter":
      startDate = new Date(currentDate.getFullYear(), 0, 1);
      endDate = new Date(currentDate.getFullYear() + 1, 0, 1);
      break;
  }

  // Also include task dates in range
  if (allDates.length > 0) {
    startDate = new Date(Math.min(startDate.getTime(), minDate.getTime()));
    endDate = new Date(Math.max(endDate.getTime(), maxDate.getTime()));
  }

  const tasksWithDateInfo = useMemo(() => {
    return tasks.map((task) => ({
      ...task,
      hasDates: !!(task.startDate || task.dueDate),
      isOverdue: task.dueDate && isBefore(startOfDay(new Date(task.dueDate)), startOfDay(new Date())) && task.column.status !== "DONE",
    }));
  }, [tasks]);

  const tasksWithDatesOnly = tasksWithDateInfo.filter((t) => t.hasDates);
  const tasksWithoutDates = tasksWithDateInfo.filter((t) => !t.hasDates);

  const handlePrev = () => {
    switch (scale) {
      case "day":
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case "week":
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case "month":
        setCurrentDate(subMonths(currentDate, 3));
        break;
      case "quarter":
        setCurrentDate(new Date(currentDate.getFullYear() - 1, 0, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (scale) {
      case "day":
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case "week":
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case "month":
        setCurrentDate(addMonths(currentDate, 3));
        break;
      case "quarter":
        setCurrentDate(new Date(currentDate.getFullYear() + 1, 0, 1));
        break;
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrev}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-semibold text-lg hidden sm:block">
            {scale === "day" && format(currentDate, "MMMM yyyy", { locale: id })}
            {scale === "week" && format(currentDate, "MMMM yyyy", { locale: id })}
            {scale === "month" && currentDate.getFullYear().toString()}
            {scale === "quarter" && currentDate.getFullYear().toString()}
          </span>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Hari Ini
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {timelineScales.map((s) => (
            <Button
              key={s.key}
              variant={scale === s.key ? "secondary" : "outline"}
              size="sm"
              onClick={() => setScale(s.key)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Timeline Header */}
        <div className="sticky top-0 z-10 bg-background">
          <TimelineHeader scale={scale} startDate={startDate} endDate={endDate} />
        </div>

        {/* Task Rows */}
        <div className="relative">
          {tasksWithDatesOnly.length === 0 && tasksWithoutDates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <GanttChart className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium">Belum ada tugas dengan tanggal</h3>
                <p className="text-muted-foreground text-sm">
                  Tambah tanggal mulai atau jatuh tempo ke tugas untuk melihat timeline
                </p>
              </div>
            </div>
          ) : (
            <>
              {tasksWithDatesOnly.map((task) => (
                <TimelineRow
                  key={task.id}
                  task={task}
                  scale={scale}
                  startDate={startDate}
                  endDate={endDate}
                  onTaskClick={onTaskClick}
                />
              ))}

              {tasksWithoutDates.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2 px-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    Tugas Tanpa Tanggal ({tasksWithoutDates.length})
                  </h4>
                  <div className="space-y-2 px-3">
                    {tasksWithoutDates.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => onTaskClick(task.id)}
                      >
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: task.column.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge
                              variant="secondary"
                              className={cn("text-[10px] h-4 px-1.5", priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.MEDIUM)}
                            >
                              {priorityLabels[task.priority as keyof typeof priorityLabels] || task.priority}
                            </Badge>
                            {task.assignees.length > 0 && (
                              <div className="flex items-center gap-1">
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
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onTaskClick(task.id); }}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 p-4 border-t border-muted flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: priorityColors.URGENT }} />
          <span>Urgent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: priorityColors.HIGH }} />
          <span>Tinggi</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: priorityColors.MEDIUM }} />
          <span>Sedang</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: priorityColors.LOW }} />
          <span>Rendah</span>
        </div>
      </div>
    </div>
  );
}