import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createCustomFieldSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100),
  type: z.enum(["TEXT", "NUMBER", "DATE", "SELECT", "MULTI_SELECT", "CHECKBOX", "URL", "EMAIL"]),
  options: z.array(z.object({ value: z.string(), label: z.string(), color: z.string().optional() })).optional(),
  description: z.string().max(500).optional(),
  isRequired: z.boolean().default(false),
  projectId: z.string().cuid().optional(),
  workspaceId: z.string().cuid().optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const workspaceId = searchParams.get("workspaceId");

    if (!projectId && !workspaceId) {
      return NextResponse.json(
        { error: "projectId atau workspaceId diperlukan" },
        { status: 400 }
      );
    }

    // Verify access
    if (projectId) {
      const access = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: user.id, projectId } },
      });
      if (!access || access.role === "VIEWER") {
        return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
      }
    } else if (workspaceId) {
      const access = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: user.id, workspaceId } },
      });
      if (!access || access.role === "VIEWER") {
        return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
      }
    }

    const fields = await prisma.customField.findMany({
      where: {
        OR: [
          projectId ? { projectId } : {},
          workspaceId ? { workspaceId } : {},
        ],
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json({ fields });
  } catch (error: any) {
    console.error("Get custom fields error:", error);
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validated = createCustomFieldSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Data tidak valid", issues: validated.error.issues },
        { status: 400 }
      );
    }

    const { projectId, workspaceId, ...data } = validated.data;

    // Verify access
    if (projectId) {
      const access = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: user.id, projectId } },
      });
      if (!access || access.role === "VIEWER") {
        return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
      }
    } else if (workspaceId) {
      const access = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: user.id, workspaceId } },
      });
      if (!access || access.role === "VIEWER") {
        return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
      }
    }

    // Get max position
    const lastField = await prisma.customField.findFirst({
      where: { OR: [{ projectId }, { workspaceId }] },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const field = await prisma.customField.create({
      data: {
        ...data,
        projectId,
        workspaceId,
        position: (lastField?.position || 0) + 1,
        createdById: user.id,
      },
    });

    return NextResponse.json({ field, message: "Custom field berhasil dibuat" }, { status: 201 });
  } catch (error: any) {
    console.error("Create custom field error:", error);
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}