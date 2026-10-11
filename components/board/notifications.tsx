"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Bell, BellOff, Check, X, Filter, ChevronDown, MoreHorizontal, Mail, Smartphone, Bell as BellIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { cn, formatRelativeTime, getInitials } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

const NOTIFICATION_EVENTS = [
  "ASSIGNED", "MENTIONED", "COMMENTED", "DUE_SOON", "OVERDUE",
  "SPRINT_STARTING", "SPRINT_ENDING", "TASK_MOVED", "TASK_UPDATED", "DEPENDENCY_BLOCKED",
];

const EVENT_LABELS: Record<string, string> = {
  ASSIGNED: "Ditugaskan",
  MENTIONED: "Disebutkan",
  COMMENTED: "Komentar Baru",
  DUE_SOON: "Segera Jatuh Tempo",
  OVERDUE: "Terlambat",
  SPRINT_STARTING: "Sprint Dimulai",
  SPRINT_ENDING: "Sprint Berakhir",
  TASK_MOVED: "Tugas Dipindahkan",
  TASK_UPDATED: "Tugas Diperbarui",
  DEPENDENCY_BLOCKED: "Dependensi Diblokir",
};

const EVENT_ICONS: Record<string, React.ReactNode> = {
  ASSIGNED: <Mail className="w-4 h-4 text-blue-500" />,
  MENTIONED: <Smartphone className="w-4 h-4 text-purple-500" />,
  COMMENTED: <BellIcon className="w-4 h-4 text-green-500" />,
  DUE_SOON: <BellIcon className="w-4 h-4 text-yellow-500" />,
  OVERDUE: <BellIcon className="w-4 h-4 text-red-500" />,
  SPRINT_STARTING: <BellIcon className="w-4 h-4 text-indigo-500" />,
  SPRINT_ENDING: <BellIcon className="w-4 h-4 text-orange-500" />,
  TASK_MOVED: <BellIcon className="w-4 h-4 text-cyan-500" />,
  TASK_UPDATED: <BellIcon className="w-4 h-4 text-gray-500" />,
  DEPENDENCY_BLOCKED: <BellIcon className="w-4 h-4 text-pink-500" />,
};

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  createdAt: string;
}

interface NotificationsProps {
  projectId?: string;
  workspaceId?: string;
}

export function Notifications({ projectId, workspaceId }: NotificationsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", { unreadOnly: showUnreadOnly }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (showUnreadOnly) params.append("unreadOnly", "true");
      params.append("limit", "50");
      const res = await fetch(`/api/notifications?${params}`);
      if (!res.ok) throw new Error("Gagal memuat notifikasi");
      return res.json();
    },
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
      if (!res.ok) throw new Error("Gagal menandai sebagai dibaca");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-all-read" }),
      });
      if (!res.ok) throw new Error("Gagal menandai semua sebagai dibaca");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({ title: "Berhasil", description: "Semua notifikasi ditandai sebagai dibaca" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus notifikasi");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({ title: "Berhasil", description: "Notifikasi dihapus" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const notifications: Notification[] = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

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
              <Bell className="w-5 h-5" />
              Notifikasi
              {unreadCount > 0 && (
                <Badge variant="default" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Aktivitas terbaru di proyek Anda</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={cn(showUnreadOnly && "bg-primary text-primary-foreground")}
            >
              <Filter className="w-4 h-4 mr-1" />
              {showUnreadOnly ? "Belum Dibaca" : "Semua"}
            </Button>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={() => markAllAsRead.mutate()}>
                <Check className="w-4 h-4 mr-1" />
                Tandai Semua
              </Button>
            )}
            <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <NotificationSettings />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BellOff className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">{showUnreadOnly ? "Tidak ada notifikasi belum dibaca" : "Belum ada notifikasi"}</p>
            <p className="text-sm mt-1">
              {showUnreadOnly
                ? "Semua notifikasi sudah dibaca"
                : "Notifikasi akan muncul di sini saat ada aktivitas baru"}
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[600px]">
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={() => markAsRead.mutate(notification.id)}
                  onDelete={() => deleteNotification.mutate(notification.id)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: Notification;
  onMarkRead: () => void;
  onDelete: () => void;
}) {
  const Icon = EVENT_ICONS[notification.type] || EVENT_ICONS.COMMENTED;

  return (
    <div
      className={cn(
        "p-4 hover:bg-muted/50 transition-colors",
        !notification.read && "bg-primary/5"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {Icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className={cn("font-medium text-sm", !notification.read && "font-semibold")}>
                {notification.title}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                {notification.message}
              </p>
              {notification.data?.taskId && (
                <p className="text-xs text-muted-foreground mt-1">
                  Tugas: {notification.data.taskId}
                  {notification.data.projectKey && ` • ${notification.data.projectKey}`}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={onMarkRead}
                  aria-label="Tandai sebagai dibaca"
                >
                  <Check className="w-4 h-4 text-green-500" />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Opsi</DropdownMenuLabel>
                  {!notification.read && (
                    <DropdownMenuItem onClick={onMarkRead}>
                      <Check className="w-4 h-4 mr-2" />
                      Tandai Dibaca
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <X className="w-4 h-4 mr-2" />
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent              </DropdownMenu>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {formatRelativeTime(new Date(notification.createdAt))}
          </p>
        </div>
      </div>
    </div>
  );
}

function NotificationSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const { data: settingsData } = useQuery({
    queryKey: ["notification-settings"],
    queryFn: async () => {
      const res = await fetch("/api/notification-settings");
      if (!res.ok) throw new Error("Gagal memuat pengaturan");
      return res.json();
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (settings: any) => {
      const res = await fetch("/api/notification-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan pengaturan");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-settings"] });
      toast({ title: "Berhasil", description: "Pengaturan notifikasi disimpan" });
      setSaving(false);
    },
    onError: (error: Error) => {
      setSaving(false);
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const handleToggle = (channel: string, eventType: string, enabled: boolean) => {
    const newSettings = {
      ...settingsData?.settings,
      [channel]: {
        ...settingsData?.settings?.[channel],
        [eventType]: enabled,
      },
    };
    setSaving(true);
    updateSettings.mutate(newSettings);
  };

  if (!settingsData) {
    return (
      <div className="p-4 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  const { settings, channels, events } = settingsData;

  return (
    <div className="space-y-4 p-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <div className="w-32">Event</div>
        {channels.map((channel: string) => (
          <div key={channel} className="flex-1 text-center capitalize">
            {channel === "in_app" ? "In-App" : channel}
          </div>
        ))}
      </div>
      <Separator />
      <div className="space-y-2 max-h-80 overflow-auto">
        {events.map((event: string) => (
          <div key={event} className="flex items-center gap-2 py-2">
            <div className="w-32 text-sm font-medium">
              {EVENT_LABELS[event] || event}
            </div>
            {channels.map((channel: string) => (
              <div key={channel} className="flex-1 flex justify-center">
                <DropdownMenuCheckboxItem
                  checked={settings[channel]?.[event] || false}
                  onCheckedChange={(checked) => handleToggle(channel, event, checked)}
                  disabled={saving}
                  className="flex items-center justify-center"
                >
                  {settings[channel]?.[event] ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : null}
                </DropdownMenuCheckboxItem>
              </div>
            ))}
          </div>
        ))}
      </div>
      <Separator />
      <Button onClick={() => setSaving(true) && handleToggle} disabled={saving} className="w-full">
        {saving ? "Menyimpan..." : "Simpan"}
      </Button>
    </div>
  );
}