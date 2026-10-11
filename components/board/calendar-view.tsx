import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, isBefore, startOfDay } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  priority: string;
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
  column: {
    id: string;
    name: string;
    color: string;
    status: string;
  };
}

interface CalendarViewProps {
  projectId: string;
  tasks: Task[];
  columns: Array<{ id: string; name: string; color: string; status: string }>;
  onTaskClick: (taskId: string) => void;
  onCreateTask: (columnId: string, date?: Date) => void;
  view: "month" | "week";
}

const priorityColors = {
  URGENT: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-blue-500",
};

function CalendarDay({
  date,
  tasks,
  onTaskClick,
  onCreateTask,
  isCurrentMonth,
  isSelected,
  today,
}: {
  date: Date;
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onCreateTask: (columnId: string, date: Date) => void;
  isCurrentMonth: boolean;
  isSelected: boolean;
  today: Date;
}) {
  const dayTasks = tasks.filter((task) => {
    if (!task.dueDate) return false;
    return isSameDay(new Date(task.dueDate), date);
  });

  return (
    <div
      className={cn(
        "relative min-h-[100px] p-2 border border-muted",
        !isCurrentMonth && "bg-muted/30 text-muted-foreground",
        isSameDay(date, today) && "bg-primary/10",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={() => onCreateTask(columns[0]?.id || "", date)}
    >
      <div className="flex justify-between mb-1">
        <span
          className={cn(
            "text-sm font-medium",
            isSameDay(date, today) && "text-primary",
            !isCurrentMonth && "text-muted-foreground"
          )}
        >
          {format(date, "d")}
        </span>
        {dayTasks.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {dayTasks.length}
          </Badge>
        )}
      </div>
      <div className="space-y-1 max-h-[80px] overflow-y-auto">
        {dayTasks.slice(0, 3).map((task) => (
          <div
            key={task.id}
            className={cn(
              "text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80",
              priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.MEDIUM
            )}
            onClick={(e) => {
              e.stopPropagation();
              onTaskClick(task.id);
            }}
          >
            {task.title}
          </div>
        ))}
        {dayTasks.length > 3 && (
          <div
            className="text-xs text-center text-muted-foreground cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onTaskClick(dayTasks[3].id);
            }}
          >
            +{dayTasks.length - 3} lagi
          </div>
        )}
      </div>
    </div>
  );
}

function CalendarWeek({
  date,
  tasks,
  onTaskClick,
  onCreateTask,
  isSelected,
  today,
}: {
  date: Date;
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onCreateTask: (columnId: string, date: Date) => void;
  isSelected: boolean;
  today: Date;
}) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const dayTasks = days.map((day) => ({
    date: day,
    tasks: tasks.filter((task) => {
      if (!task.dueDate) return false;
      return isSameDay(new Date(task.dueDate), day);
    }),
  }));

  return (
    <div className="flex gap-1 overflow-x-auto">
      {dayTasks.map(({ date: day, tasks: dayTaskList }) => (
        <div
          key={day.toISOString()}
          className={cn(
            "flex-1 min-w-[120px] min-h-[200px] p-2 border border-muted bg-background",
            isSameDay(day, today) && "bg-primary/10",
            isSelected && "ring-2 ring-primary"
          )}
        >
          <div className="flex justify-between mb-2">
            <span
              className={cn(
                "text-sm font-medium",
                isSameDay(day, today) && "text-primary"
              )}
            >
              {format(day, "EEE d", { locale: id })}
            </span>
            {dayTaskList.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {dayTaskList.length}
              </Badge>
            )}
          </div>
          <div className="space-y-1 flex-1 overflow-y-auto">
            {dayTaskList.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80",
                  priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.MEDIUM
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onTaskClick(task.id);
                }}
              >
                {task.title}
              </div>
            ))}
            {dayTaskList.length > 5 && (
              <div className="text-xs text-center text-muted-foreground cursor-pointer">
                +{dayTaskList.length - 5} lagi
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CalendarView({
  projectId,
  tasks,
  columns,
  onTaskClick,
  onCreateTask,
  view = "month",
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const today = new Date();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const tasksWithDueDate = tasks.filter((t) => t.dueDate);

  const handlePrev = () => {
    setCurrentDate((prev) => (view === "month" ? subMonths(prev, 1) : subMonths(prev, 1)));
  };

  const handleNext = () => {
    setCurrentDate((prev) => (view === "month" ? addMonths(prev, 1) : addMonths(prev, 1)));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  if (view === "week") {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="font-semibold text-lg">
              {format(currentDate, "d MMM - ", { locale: id })}{format(endOfWeek(currentDate, { weekStartsOn: 1 }), "d MMM yyyy", { locale: id })}
            </h3>
            <Button variant="outline" size="sm" onClick={handleNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Hari Ini
            </Button>
          </div>
        </div>
        <CalendarWeek
          date={currentDate}
          tasks={tasksWithDueDate}
          onTaskClick={onTaskClick}
          onCreateTask={onCreateTask}
          isSelected={!!selectedDate}
          today={today}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrev}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="font-semibold text-lg">
            {format(currentDate, "MMMM yyyy", { locale: id })}
          </h3>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Hari Ini
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "month" ? "secondary" : "outline"}
            size="sm"
            onClick={() => {}}
          >
            Bulan
          </Button>
          <Button
            variant={view === "week" ? "secondary" : "outline"}
            size="sm"
            onClick={() => {}}
          >
            Minggu
          </Button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-0 border-b mb-1">
        {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => (
          <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0 flex-1 overflow-auto">
        {days.map((day) => (
          <CalendarDay
            key={day.toISOString()}
            date={day}
            tasks={tasksWithDueDate}
            onTaskClick={onTaskClick}
            onCreateTask={onCreateTask}
            isCurrentMonth={isSameMonth(day, currentDate)}
            isSelected={selectedDate ? isSameDay(day, selectedDate) : false}
            today={today}
          />
        ))}
      </div>

      {/* Tasks without due date */}
      const tasksWithoutDueDate = tasks.filter((t) => !t.dueDate);
      if (tasksWithoutDueDate.length > 0) {
        return (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePrev}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h3 className="font-semibold text-lg">
                  {format(currentDate, "MMMM yyyy", { locale: id })}
                </h3>
                <Button variant="outline" size="sm" onClick={handleNext}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleToday}>
                  Hari Ini
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant={view === "month" ? "secondary" : "outline"} size="sm">Bulan</Button>
                <Button variant={view === "week" ? "secondary" : "outline"} size="sm">Minggu</Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-0 border-b mb-1">
              {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => (
                <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0 flex-1 overflow-auto">
              {days.map((day) => (
                <CalendarDay
                  key={day.toISOString()}
                  date={day}
                  tasks={tasksWithDueDate}
                  onTaskClick={onTaskClick}
                  onCreateTask={onCreateTask}
                  isCurrentMonth={isSameMonth(day, currentDate)}
                  isSelected={selectedDate ? isSameDay(day, selectedDate) : false}
                  today={today}
                />
              ))}
            </div>
            <div className="border-t mt-4 pt-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Tugas Tanpa Tanggal ({tasksWithoutDueDate.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {tasksWithoutDueDate.slice(0, 10).map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "px-3 py-1 rounded text-sm cursor-pointer hover:opacity-80",
                      priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.MEDIUM
                    )}
                    onClick={() => onTaskClick(task.id)}
                  >
                    {task.title}
                  </div>
                ))}
                {tasksWithoutDueDate.length > 10 && (
                  <span className="text-sm text-muted-foreground">
                    +{tasksWithoutDueDate.length - 10} lagi
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrev}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="font-semibold text-lg">
                {format(currentDate, "MMMM yyyy", { locale: id })}
              </h3>
              <Button variant="outline" size="sm" onClick={handleNext}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday}>
                Hari Ini
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant={view === "month" ? "secondary" : "outline"} size="sm">Bulan</Button>
              <Button variant={view === "week" ? "secondary" : "outline"} size="sm">Minggu</Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-0 border-b mb-1">
            {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => (
              <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0 flex-1 overflow-auto">
            {days.map((day) => (
              <CalendarDay
                key={day.toISOString()}
                date={day}
                tasks={tasksWithDueDate}
                onTaskClick={onTaskClick}
                onCreateTask={onCreateTask}
                isCurrentMonth={isSameMonth(day, currentDate)}
                isSelected={selectedDate ? isSameDay(day, selectedDate) : false}
                today={today}
              />
            ))}
          </div>
        </div>
      );
    }
  );
}