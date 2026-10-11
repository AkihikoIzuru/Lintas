"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Loader2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { cn, formatRelativeTime, getInitials } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Notifications } from "./notifications";

export function NotificationBell() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [popoverOpen, setPopoverOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", { unreadOnly: false }],
    queryFn: async () => {
      const res = await fetch("/api/notifications?limit=5");
      if (!res.ok) throw new Error("Gagal memuat notifikasi");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const unreadCount = data?.unreadCount || 0;
  const recentNotifications = data?.notifications?.slice(0, 5) || [];

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

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-medium flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={5} className="w-80 sm:w-96">
        <div className="space-y-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Notifikasi</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="default" className="text-xs">
                  {unreadCount} belum dibaca
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllAsRead.mutate()}
                  className="h-8"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Baca Semua
                </Button>
              )}
            </div>
          </div>

          {/* Notification List */}
          {isLoading ? (
            <CardContent className="py-6">
              <div className="h-20 bg-muted animate-pulse rounded" />
            </CardContent>
          ) : recentNotifications.length === 0 ? (
            <CardContent className="py-8 text-center text-muted-foreground">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada notifikasi</p>
            </CardContent>
          ) : (
            <ScrollArea className="max-h-[400px] p-2">
              <div className="space-y-1">
                {recentNotifications.map((notification: any) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={() => markAsRead.mutate(notification.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}

          <Separator className="my-2" />

          {/* Footer */}
          <div className="p-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setPopoverOpen(false);
                // Navigate to notifications page or settings
              }}
            >
              Lihat Semua Notifikasi
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: any;
  onMarkRead: () => void;
}) {
  const typeIcons: Record<string, string> = {
    ASSIGNED: "📧",
    MENTIONED: "📱",
    COMMENTED: "💬",
    DUE_SOON: "⏰",
    OVERDUE: "⚠️",
    SPRINT_STARTING: "🏃",
    SPRINT_ENDING: "🏁",
    TASK_MOVED: "➡️",
    TASK_UPDATED: "🔄",
    DEPENDENCY_BLOCKED: "🔗",
  };

  const icon = typeIcons[notification.type] || "🔔";

  return (
    <div
      className={cn(
        "p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer",
        !notification.read && "bg-primary/5"
      )}
      onClick={onMarkRead}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn("font-medium text-sm flex-1", !notification.read && "font-semibold")}>
              {notification.title}
            </p>
            {!notification.read && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead();
                }}
                aria-label="Tandai dibaca"
              >
                <Check className="w-3 h-3 text-green-500" />
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatRelativeTime(new Date(notification.createdAt))}
          </p>
        </div>
      </div>
    </div>
  );
}