"use client";

import * as React from "react";
import { redirect } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FolderKanban, Users, Clock } from "lucide-react";
import Link from "next/link";

async function getWorkspaces() {
  const response = await fetch("/api/workspaces");
  if (!response.ok) throw new Error("Failed to fetch workspaces");
  return response.json();
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: getWorkspaces,
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Memuat...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const workspaces = data?.workspaces || [];

  if (workspaces.length === 0) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Selamat Datang di Lintas!</CardTitle>
              <CardDescription>
                Anda belum memiliki workspace. Buat workspace pertama Anda untuk memulai.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/workspaces/new">
                <Button className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Buat Workspace Baru
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Redirect to first workspace if only one exists
  if (workspaces.length === 1) {
    redirect(`/w/${workspaces[0].slug}`);
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Pilih workspace untuk melanjutkan
            </p>
          </div>
          <Link href="/workspaces/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Workspace Baru
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace: any) => (
            <Link key={workspace.id} href={`/w/${workspace.slug}`}>
              <Card className="hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{workspace.name}</CardTitle>
                      {workspace.description && (
                        <CardDescription className="mt-2">
                          {workspace.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                      {workspace.members[0]?.role}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FolderKanban className="h-4 w-4" />
                      <span>{workspace._count.projects} proyek</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{workspace._count.members} anggota</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      Diperbarui{" "}
                      {new Date(workspace.updatedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}