"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, FolderKanban, Users, Clock, Flag, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SprintList } from "@/components/board/sprint-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Project {
  id: string;
  name: string;
  key: string;
  description: string | null;
  color: string;
  icon: string | null;
  _count: {
    tasks: number;
    columns: number;
  };
  updatedAt: string;
}

export default function WorkspacePage({
  params,
}: {
  params: { slug: string };
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"projects" | "sprints">("projects");

  const { data, isLoading, error } = useQuery({
    queryKey: ["projects", params.slug],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${params.slug}/projects`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal memuat proyek");
      }
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-destructive">
          {error instanceof Error ? error.message : "Terjadi kesalahan"}
        </p>
        <Button onClick={() => router.push("/dashboard")}>
          Kembali ke Dashboard
        </Button>
      </div>
    );
  }

  const projects: Project[] = data?.projects || [];

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{activeTab === "projects" ? "Proyek" : "Sprint"}</h1>
          <p className="text-muted-foreground mt-1">
            {activeTab === "projects"
              ? "Kelola semua proyek di workspace ini"
              : "Kelola sprint dan perencanaan iterasi"}
          </p>
        </div>
        {activeTab === "projects" && (
          <Link href={`/w/${params.slug}/projects/new`}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Buat Proyek
            </Button>
          </Link>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="projects">
            <FolderKanban className="w-4 h-4 mr-2" />
            Proyek
            <Badge variant="secondary" className="ml-2">{projects.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="sprints">
            <Flag className="w-4 h-4 mr-2" />
            Sprint
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-4">
          {projects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderKanban className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Belum ada proyek</h3>
                <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                  Mulai dengan membuat proyek pertama Anda untuk mengorganisir tugas
                  dan kolaborasi tim
                </p>
                <Link href={`/w/${params.slug}/projects/new`}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Buat Proyek Pertama
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/w/${params.slug}/projects/${project.id}`}
                >
                  <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: project.color }}
                        >
                          {project.icon || project.key}
                        </div>
                        <Badge variant="secondary">{project.key}</Badge>
                      </div>
                      <CardTitle className="line-clamp-1">{project.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {project.description || "Tidak ada deskripsi"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <FolderKanban className="w-4 h-4" />
                          <span>{project._count.tasks} tugas</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(project.updatedAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sprints" className="mt-4">
          <SprintList
            workspaceId={data?.workspace?.id || ""}
            onSprintClick={(sprintId) => {
              // TODO: Navigate to sprint detail page
              console.log("Sprint clicked:", sprintId);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}