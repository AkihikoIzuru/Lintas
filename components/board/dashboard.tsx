"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Target,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DashboardProps {
  projectId: string;
  workspaceId: string;
}

interface ProjectMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
  tasksByPriority: Array<{ name: string; value: number; color: string }>;
  tasksByStatus: Array<{ name: string; value: number; color: string }>;
  tasksByAssignee: Array<{ name: string; tasks: number; completed: number }>;
  completionTrend: Array<{ date: string; completed: number; created: number }>;
  averageCompletionTime: number;
  velocity: number;
}

const priorityColors = {
  URGENT: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#eab308",
  LOW: "#3b82f6",
};

const statusColors = {
  BACKLOG: "#6b7280",
  TODO: "#3b82f6",
  IN_PROGRESS: "#eab308",
  IN_REVIEW: "#a855f7",
  DONE: "#22c55e",
};

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  change?: string;
  icon: any;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className="flex items-center gap-1 mt-1">
            {trend === "up" && <TrendingUp className="w-3 h-3 text-green-500" />}
            {trend === "down" && <TrendingDown className="w-3 h-3 text-red-500" />}
            <span
              className={cn(
                "text-xs",
                trend === "up" && "text-green-500",
                trend === "down" && "text-red-500",
                trend === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function Dashboard({ projectId, workspaceId }: DashboardProps) {
  const { data: metrics, isLoading } = useQuery<ProjectMetrics>({
    queryKey: ["project-metrics", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/metrics`);
      if (!res.ok) throw new Error("Gagal memuat metrics");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Tidak ada data tersedia</p>
      </div>
    );
  }

  const completionRate = metrics.totalTasks > 0
    ? Math.round((metrics.completedTasks / metrics.totalTasks) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tugas"
          value={metrics.totalTasks}
          icon={Target}
        />
        <StatCard
          title="Selesai"
          value={metrics.completedTasks}
          change={`${completionRate}% completion rate`}
          icon={CheckCircle2}
          trend={completionRate >= 70 ? "up" : completionRate >= 40 ? "neutral" : "down"}
        />
        <StatCard
          title="Sedang Dikerjakan"
          value={metrics.inProgressTasks}
          icon={Zap}
        />
        <StatCard
          title="Terlambat"
          value={metrics.overdueTasks}
          change={metrics.overdueTasks > 0 ? "Perlu perhatian" : "Semua on-track"}
          icon={AlertCircle}
          trend={metrics.overdueTasks > 0 ? "down" : "up"}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by Priority */}
        <Card>
          <CardHeader>
            <CardTitle>Tugas Berdasarkan Prioritas</CardTitle>
            <CardDescription>Distribusi tugas per tingkat prioritas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.tasksByPriority}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {metrics.tasksByPriority.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tasks by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Tugas Berdasarkan Status</CardTitle>
            <CardDescription>Distribusi tugas per kolom</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.tasksByStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6">
                  {metrics.tasksByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Trend Penyelesaian</CardTitle>
            <CardDescription>Tugas selesai vs dibuat (7 hari terakhir)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.completionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#22c55e"
                  name="Selesai"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="created"
                  stroke="#3b82f6"
                  name="Dibuat"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tasks by Assignee */}
        <Card>
          <CardHeader>
            <CardTitle>Tugas Per Anggota</CardTitle>
            <CardDescription>Top 5 anggota dengan tugas terbanyak</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.tasksByAssignee.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="tasks" fill="#3b82f6" name="Total Tugas" />
                <Bar dataKey="completed" fill="#22c55e" name="Selesai" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Rata-rata Waktu Penyelesaian</CardTitle>
            <CardDescription>Waktu rata-rata menyelesaikan satu tugas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Clock className="w-8 h-8 text-muted-foreground" />
              <div>
                <div className="text-3xl font-bold">
                  {metrics.averageCompletionTime > 0
                    ? `${Math.round(metrics.averageCompletionTime)} hari`
                    : "N/A"}
                </div>
                <p className="text-sm text-muted-foreground">
                  Dari dibuat hingga selesai
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Velocity</CardTitle>
            <CardDescription>Tugas selesai per minggu (rata-rata)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Zap className="w-8 h-8 text-muted-foreground" />
              <div>
                <div className="text-3xl font-bold">
                  {metrics.velocity > 0 ? Math.round(metrics.velocity) : "N/A"}
                </div>
                <p className="text-sm text-muted-foreground">
                  Tugas per minggu
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
