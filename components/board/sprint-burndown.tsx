"use client";

import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, differenceInDays, eachDayOfInterval, startOfDay, endOfDay, isSameDay } from "date-fns";
import { id } from "date-fns/locale";

interface SprintBurndownProps {
  sprintId: string;
}

interface SprintTask {
  id: string;
  createdAt: string;
  completedAt: string | null;
  column: {
    status: string;
  };
}

interface BurndownDataPoint {
  date: string;
  ideal: number;
  actual: number;
  completed: number;
}

export function SprintBurndown({ sprintId }: SprintBurndownProps) {
  const { data: tasks, isLoading } = useQuery<SprintTask[]>({
    queryKey: ["sprint-burndown", sprintId],
    queryFn: async () => {
      const res = await fetch(`/api/sprints/${sprintId}/burndown`);
      if (!res.ok) throw new Error("Gagal memuat data burndown");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Burndown Chart</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Skeleton className="h-full w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Burndown Chart</CardTitle>
          <CardDescription>Tidak ada data tugas untuk sprint ini</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Belum ada tugas di sprint ini
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get sprint dates from first task or use default
  // In real implementation, we'd fetch sprint details separately
  const sprintStart = new Date(Math.min(...tasks.map(t => new Date(t.createdAt).getTime())));
  const sprintEnd = new Date(sprintStart);
  sprintEnd.setDate(sprintEnd.getDate() + 13); // 2 weeks default

  // Generate ideal burndown line
  const totalTasks = tasks.length;
  const totalDays = differenceInDays(sprintEnd, sprintStart) + 1;
  const tasksPerDay = totalTasks / totalDays;

  const days = eachDayOfInterval({ start: sprintStart, end: sprintEnd });

  const burndownData: BurndownDataPoint[] = days.map((day, index) => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);

    // Ideal remaining
    const ideal = Math.max(0, totalTasks - tasksPerDay * (index + 1));

    // Actual remaining - count tasks not completed by end of this day
    const completedByDay = tasks.filter(t =>
      t.completedAt && new Date(t.completedAt) <= dayEnd && t.column.status === "DONE"
    ).length;
    const actual = Math.max(0, totalTasks - completedByDay);

    return {
      date: format(day, "d MMM", { locale: id }),
      ideal: Math.round(ideal * 10) / 10,
      actual,
      completed: completedByDay,
    };
  });

  const completedTasks = tasks.filter(t => t.column.status === "DONE").length;
  const remainingTasks = totalTasks - completedTasks;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Burndown Chart</CardTitle>
            <CardDescription>Sisa tugas vs waktu ideal</CardDescription>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Badge variant="secondary" className="gap-1">
              Total: {totalTasks}
            </Badge>
            <Badge variant="default" className="gap-1">
              Selesai: {completedTasks}
            </Badge>
            <Badge variant="outline" className="gap-1">
              Sisa: {remainingTasks}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={burndownData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              domain={[0, 'auto']}
              label={{ value: 'Tugas Tersisa', angle: -90, position: 'insideLeft', offset: 10 }}
            />
            <Tooltip
              formatter={(value: number, name: string) => [value, name === 'ideal' ? 'Ideal' : name === 'actual' ? 'Aktual' : 'Selesai']}
              labelFormatter={(label) => `Hari: ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="ideal"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Ideal"
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6, strokeWidth: 3 }}
              name="Aktual"
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-1 border-t-2 border-dashed border-gray-400" />
            <span>Ideal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-1 bg-blue-500 rounded" />
            <span>Aktual</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}