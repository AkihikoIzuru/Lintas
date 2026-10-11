"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, LayoutDashboard, Kanban, List, Calendar, BarChart3, Settings, Users, FolderKanban, Plus, LogOut, Menu, X, Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Proyek", href: "/projects", icon: FolderKanban },
  { name: "Tugas Saya", href: "/tasks", icon: List },
  { name: "Kalender", href: "/calendar", icon: Calendar },
  { name: "Timeline", href: "/timeline", icon: BarChart3 },
];

const userNavigation = [
  { name: "Profil", href: "/settings/profile", icon: Users },
  { name: "Pengaturan", href: "/settings", icon: Settings },
];

export function Sidebar({ workspace, user }: { workspace?: { id: string; name: string; slug: string } | null; user?: { id: string; name: string | null; email: string; avatarUrl?: string | null } | null }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo / Workspace Switcher */}
      <div className={cn("flex h-16 items-center justify-between px-4 border-b border-border", collapsed && "justify-center")}>
        {!collapsed && (
          <Link href={workspace ? `/w/${workspace.slug}` : "/dashboard"} className="flex items-center gap-2 font-bold text-xl text-primary">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <span>Lintas</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
          aria-label={collapsed ? "Perluas sidebar" : "Lipat sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1" role="navigation" aria-label="Navigasi utama">
        {workspace ? (
          <>
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {collapsed ? "" : workspace.name}
            </div>
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={workspace ? `/w/${workspace.slug}${item.href}` : item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === (workspace ? `/w/${workspace.slug}${item.href}` : item.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  collapsed && "justify-center"
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            ))}
            <Separator className="my-2" />
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {collapsed ? "" : "Akun"}
            </div>
            {userNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  collapsed && "justify-center"
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            ))}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-4">
            <svg className="h-12 w-12 mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <h3 className="text-lg font-semibold mb-1">Belum ada workspace</h3>
            <p className="text-sm mb-4">Buat atau bergabung workspace untuk memulai</p>
            <Link href="/onboarding">
              <Button className="w-full" size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Mulai
              </Button>
            </Link>
          </div>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-border p-3">
        {user && !collapsed && (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.avatarUrl || undefined} alt={user.name || "User"} />
              <AvatarFallback name={user.name || user.email} />
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name || "Pengguna"}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}
        <div className={cn("mt-3 flex items-center gap-2", collapsed && "justify-center")}>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 flex-1"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={theme === "dark" ? "Mode terang" : "Mode gelap"}
            title={collapsed ? (theme === "dark" ? "Mode terang" : "Mode gelap") : undefined}
          >
            {theme === "dark" ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 flex-1" asChild>
            <Link href="/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 flex-1" asChild>
            <Link href="/auth/logout">
              <LogOut className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </aside>
  );
}