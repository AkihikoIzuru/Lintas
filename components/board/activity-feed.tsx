"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Clock, User, MessageSquare, Tag, ArrowRight, ChevronRight, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatRelativeTime, getInitials } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ACTIVITY_TYPES = [
  "CREATED", "UPDATED", "MOVED", "ASSIGNED", "UNASSIGNED",
  "COMMENTED", "MENTIONED", "LABEL_ADDED", "LABEL_REMOVED",
  "PRIORITY_CHANGED", "DUE_DATE_CHANGED", "SUBTASK_ADDED",
  "SUBTASK_COMPLETED", "ATTACHMENT_ADDED", "ATTACHMENT_REMOVED",
  "SPRINT_ADDED", "SPRINT_REMOVED", "ARCHIVED", "RESTORED", "DELETED",
  "DEPENDENCY_ADDED", "DEPENDENCY_REMOVED",
];

const ACTIVITY_LABELS: Record<string, string> = {
  CREATED: "membuat tugas",
  UPDATED: "memperbarui tugas",
  MOVED: "memindahkan tugas",
  ASSIGNED: "menugaskan",
  UNASSIGNED: "melepas tugas dari",
  COMMENTED: "berkomentar di",
  MENTIONED: "menyebutkan",
  LABEL_ADDED: "menambah label ke",
  LABEL_REMOVED: "menghapus label dari",
  PRIORITY_CHANGED: "mengubah prioritas",
  DUE_DATE_CHANGED: "mengubah jatuh tempo",
  SUBTASK_ADDED: "menambah subtask ke",
  SUBTASK_COMPLETED: "menyelesaikan subtask di",
  ATTACHMENT_ADDED: "menambah lampiran ke",
  ATTACHMENT_REMOVED: "menghapus lampiran dari",
  SPRINT_ADDED: "menambah ke sprint",
  SPRINT_REMOVED: "menghapus dari sprint",
  ARCHIVED: "mengarsipkan",
  RESTORED: "memulihkan",
  DELETED: "menghapus",
  DEPENDENCY_ADDED: "menambah dependensi ke",
  DEPENDENCY_REMOVED: "menghapus dependensi dari",
};

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  CREATED: <div className="w-2 h-2 rounded-full bg-green-500" />,
  UPDATED: <div className="w-2 h-2 rounded-full bg-blue-500" />,
  MOVED: <ArrowRight className="w-4 h-4 text-purple-500" />,
  ASSIGNED: <User className="w-4 h-4 text-blue-500" />,
  UNASSIGNED: <User className="w-4 h-4 text-gray-500" />,
  COMMENTED: <MessageSquare className="w-4 h-4 text-green-500" />,
  MENTIONED: <MessageSquare className="w-4 h-4 text-purple-500" />,
  LABEL_ADDED: <Tag className="w-4 h-4 text-orange-500" />,
  LABEL_REMOVED: <Tag className="w-4 h-4 text-gray-500" />,
  PRIORITY_CHANGED: <div className="w-2 h-2 rounded-full bg-red-500" />,
  DUE_DATE_CHANGED: <Clock className="w-4 h-4 text-yellow-500" />,
  SUBTASK_ADDED: <div className="w-2 h-2 rounded-full bg-indigo-500" />,
  SUBTASK_COMPLETED: <div className="w-2 h-2 rounded-full bg-green-500" />,
  ATTACHMENT_ADDED: <div className="w-2 h-2 rounded-full bg-pink-500" />,
  ATTACHMENT_REMOVED: <div className="w-2 h-2 rounded-full bg-gray-500" />,
  SPRINT_ADDED: <div className="w-2 h-2 rounded-full bg-cyan-500" />,
  SPRINT_REMOVED: <div className="w-2 h-2 rounded-full bg-gray-500" />,
  ARCHIVED: <div className="w-2 h-2 rounded-full bg-gray-400" />,
  RESTORED: <div className="w-2 h-2 rounded-full bg-green-500" />,
  DELETED: <div className="w-2 h-2 rounded-full bg-red-500" />,
  DEPENDENCY_ADDED: <div className="w-2 h-2 rounded-full bg-purple-500" />,
  DEPENDENCY_REMOVED: <div className="w-2 h-2 rounded-full bg-gray-500" />,
};

interface Activity {
  id: string;
  type: string;
  metadata: any;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  task: {
    id: string;
    title: string;
    project: {
      id: string;
      name: string;
      key: string;
    };
  };
  createdAt: string;
}

interface ActivityFeedProps {
  projectId?: string;
  workspaceId?: string;
  taskId?: string;
  limit?: number;
}

export function ActivityFeed({ projectId, workspaceId, taskId, limit = 50 }: ActivityFeedProps) {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");

  const params = new URLSearchParams();
  if (projectId) params.append("projectId", projectId);
  if (workspaceId) params.append("workspaceId", workspaceId);
  if (taskId) params.append("taskId", taskId);
  params.append("limit", limit.toString());

  const { data, isLoading } = useQuery({
    queryKey: ["activity", { projectId, workspaceId, taskId, limit, filterType, filterUser }],
    queryFn: async () => {
      const res = await fetch(`/api/activity?${params}`);
      if (!res.ok) throw new Error("Gagal memuat aktivitas");
      return res.json();
    },
  });

  const activities: Activity[] = data?.activities || [];

  // Get unique users for filter
  const users = Array.from(
    new Map(activities.map(a => [a.user.id, a.user])).values()
  );

  // Filter activities
  const filteredActivities = activities.filter(a => {
    if (filterType !== "all" && a.type !== filterType) return false;
    if (filterUser !== "all" && a.user.id !== filterUser) return false;
    return true;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="h-20 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Aktivitas
            </CardTitle>
            <CardDescription>Riwayat perubahan dan aktivitas tim</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Aktivitas</SelectItem>
                {ACTIVITY_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {ACTIVITY_LABELS[type] || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {users.length > 0 && (
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter pengguna" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Pengguna</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {(filterType !== "all" || filterUser !== "all") && (
              <Button variant="ghost" size="icon" onClick={() => { setFilterType("all"); setFilterUser("all"); }}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Tidak ada aktivitas</p>
            <p className="text-sm mt-1">
              {filterType !== "all" || filterUser !== "all"
                ? "Coba ubah filter untuk melihat aktivitas"
                : "Belum ada aktivitas di proyek ini"}
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[600px]">
            <div className="divide-y">
              {filteredActivities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </ScrollArea>
        )}
      </Card>
    </Card>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  const Icon = ACTIVITY_ICONS[activity.type] || ACTIVITY_ICONS.UPDATED;
  const label = ACTIVITY_LABELS[activity.type] || activity.type.toLowerCase();

  return (
    <div className="p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            {Icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={activity.user.avatarUrl || undefined} />
              <AvatarFallback className="text-xs">
                {getInitials(activity.user.name || activity.user.email)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm">{activity.user.name || activity.user.email}</span>
            <span className="text-muted-foreground text-sm">{label}</span>
            {activity.task && (
              <>
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                <span className="font-medium text-sm text-primary hover:underline cursor-pointer">
                  {activity.task.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({activity.task.project.key})
                </span>
              </>
            )}
          </div>
          {activity.metadata && (
            <div className="mt-1 ml-8 text-xs text-muted-foreground flex flex-wrap gap-2">
              {Object.entries(activity.metadata).map(([key, value]) => (
                <span key={key}>{key}: {String(value)}</span>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2 ml-8">
            {formatRelativeTime(new Date(activity.createdAt))}
          </p>
        </div>
      </div>
    </div>
  );
}