"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

interface AppLayoutProps {
  children: React.ReactNode;
  workspace?: { id: string; name: string; slug: string } | null;
  user?: { id: string; name: string | null; email: string; avatarUrl?: string | null } | null;
}

export function AppLayout({ children, workspace, user }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar workspace={workspace} user={user} />
      <div className={cn("flex-1 flex flex-col min-w-0", workspace ? "lg:ml-64" : "lg:ml-16")}>
        <TopBar workspace={workspace} user={user} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}