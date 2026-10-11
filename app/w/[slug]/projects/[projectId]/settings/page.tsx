"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, ArrowLeft, Link2, Zap, ExternalLink, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomFieldsManager } from "@/components/board/custom-fields";
import { AutomationRulesManager } from "@/components/board/automation-rules";
import { WebhookManager } from "@/components/board/webhook-manager";
import { GlobalSearch } from "@/components/board/global-search";

export default function ProjectSettingsPage() {
  const params = useParams() as Promise<{ slug: string; projectId: string }>;
  const [activeTab, setActiveTab] = useState<"general" | "custom-fields" | "automation" | "webhooks" | "search">("general");

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Link href={`/w/${params.slug}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <Link href={`/w/${params.slug}/projects/${params.projectId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Pengaturan Proyek</h1>
              <p className="text-sm text-muted-foreground">Kelola fitur lanjutan proyek</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">
              <Search className="w-4 h-4 mr-2" />
              Umum
            </TabsTrigger>
            <TabsTrigger value="custom-fields">
              <Link2 className="w-4 h-4 mr-2" />
              Custom Fields
            </TabsTrigger>
            <TabsTrigger value="automation">
              <Zap className="w-4 h-4 mr-2" />
              Otomasi
            </TabsTrigger>
            <TabsTrigger value="webhooks">
              <ExternalLink className="w-4 h-4 mr-2" />
              Webhook
            </TabsTrigger>
            <TabsTrigger value="search">
              <Search className="w-4 h-4 mr-2" />
              Pencarian
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Umum</CardTitle>
                <CardDescription>Pengaturan dasar proyek</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Pencarian Global (Cmd+K)</h3>
                    <p className="text-sm text-muted-foreground mb-4">Tekan Cmd+K (atau Ctrl+K di Windows) dari mana saja untuk mencari tugas, proyek, dan komentar.</p>
                    <GlobalSearch projectId={params.projectId} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom-fields" className="space-y-6 mt-6">
            <CustomFieldsManager projectId={params.projectId} />
          </TabsContent>

          <TabsContent value="automation" className="space-y-6 mt-6">
            <AutomationRulesManager projectId={params.projectId} />
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6 mt-6">
            <WebhookManager projectId={params.projectId} />
          </TabsContent>

          <TabsContent value="search" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Pencarian Lanjutan</CardTitle>
                <CardDescription>Kelola indeks pencarian dan preferensi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Indeks Pencarian</h3>
                    <p className="text-sm text-muted-foreground mb-4">Pencarian global mencakup: tugas, proyek, komentar, sprint, dan pengguna workspace.</p>
                    <GlobalSearch projectId={params.projectId} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}