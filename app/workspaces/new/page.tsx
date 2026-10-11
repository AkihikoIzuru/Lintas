"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createWorkspaceSchema, type CreateWorkspaceInput } from "@/lib/validations";
import { toast } from "sonner";
import { slugify } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewWorkspacePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateWorkspaceInput>({
    resolver: zodResolver(createWorkspaceSchema),
  });

  const name = watch("name");

  // Auto-generate slug from name
  React.useEffect(() => {
    if (name) {
      setValue("slug", slugify(name));
    }
  }, [name, setValue]);

  const onSubmit = async (data: CreateWorkspaceInput) => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Terjadi kesalahan");
        return;
      }

      toast.success("Workspace berhasil dibuat!");
      router.push(`/w/${result.workspace.slug}`);
    } catch (error) {
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto py-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Buat Workspace Baru</CardTitle>
            <CardDescription>
              Workspace adalah ruang kolaborasi untuk tim Anda. Anda dapat membuat proyek dan mengundang anggota tim.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Workspace</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Nama Tim atau Perusahaan"
                  {...register("name")}
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">
                  Slug <span className="text-muted-foreground text-sm">(URL workspace)</span>
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">lintas.app/w/</span>
                  <Input
                    id="slug"
                    type="text"
                    placeholder="nama-workspace"
                    {...register("slug")}
                    disabled={isLoading}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Hanya huruf kecil, angka, dan dash (-)
                </p>
                {errors.slug && (
                  <p className="text-sm text-destructive">{errors.slug.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Deskripsi <span className="text-muted-foreground text-sm">(opsional)</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Deskripsikan workspace Anda..."
                  rows={3}
                  {...register("description")}
                  disabled={isLoading}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading} loading={isLoading} className="flex-1">
                  Buat Workspace
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}