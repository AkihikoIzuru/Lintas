"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Clock, Flag, RotateCcw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeTracking } from "@/components/board/time-tracking";
import { Milestones } from "@/components/board/milestones";
import { RecurringTasks } from "@/components/board/recurring-tasks";
import { Templates } from "@/components/board/templates";
import Link from "next/link";

export default function ProjectFeaturesPage({
  params,
}: {
  params: { slug: string; projectId: string };
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("time-tracking");

  const { data, isLoading, error } = useQuery({
    queryKey: ["project", params.projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${params.projectId}`);
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
        <Button onClick={() => router.push(`/w/${params.slug}`)}>
          Kembali ke Workspace
        </Button>
      </div>
    );
  }

  const project = data?.project;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/w/${params.slug}/projects/${params.projectId}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali ke Board
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: project.color }}
                >
                  {project.key}
                </div>
                <div>
                  <h1 className="text-xl font-bold">{project.name}</h1>
                  <p className="text-sm text-muted-foreground">Fitur Lanjutan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="time-tracking">
              <Clock className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Time Tracking</span>
              <span className="sm:hidden">Waktu</span>
            </TabsTrigger>
            <TabsTrigger value="milestones">
              <Flag className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Milestones</span>
              <span className="sm:hidden">Target</span>
            </TabsTrigger>
            <TabsTrigger value="recurring-tasks">
              <RotateCcw className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Recurring Tasks</span>
              <span className="sm:hidden">Berulang</span>
            </TabsTrigger>
            <TabsTrigger value="templates">
              <FileText className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Templates</span>
              <span className="sm:hidden">Template</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="time-tracking" className="space-y-4">
            <TimeTracking projectId={params.projectId} />
          </TabsContent>

          <TabsContent value="milestones" className="space-y-4">
            <Milestones projectId={params.projectId} />
          </TabsContent>

          <TabsContent value="recurring-tasks" className="space-y-4">
            <RecurringTasks projectId={params.projectId} />
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <Templates projectId={params.projectId} workspaceId={project.workspace.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
