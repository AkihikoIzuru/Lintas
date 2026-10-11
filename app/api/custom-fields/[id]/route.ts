import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateCustomFieldSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100).optional(),
  type: z.enum(["TEXT", "NUMBER", "DATE", "SELECT", "MULTI_SELECT", "CHECKBOX", "URL", "EMAIL"]).optional(),
  options: z.array(z.object({ value: z.string(), label: z.string(), color: z.string().optional() })).optional(),
  description: z.string().max(500).optional().nullable(),
  isRequired: z.boolean().optional(),
  position: z.number().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const field = await prisma.customField.findUnique({
      where: { id: params.id },
    });

    if (!field) {
      return NextResponse.json({ error: "Custom field tidak ditemukan" }, { status: 404 });
    }

    // Verify access
    if (field.projectId) {
      const access = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: user.id, projectId: field.projectId } },
      });
      if (!access) return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
    } else if (field.workspaceId) {
      const access = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: user.id, workspaceId: field.workspaceId } },
      });
      if (!access) return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
    }

    return NextResponse.json({ field });
  } catch (error: any) {
    console.error("Get custom field error:", error);
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validated = updateCustomFieldSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Data tidak valid", issues: validated.error.issues },
        { status: 400 }
      );
    }

    const field = await prisma.customField.findUnique({
      where: { id: params.id },
    });

    if (!field) {
      return NextResponse.json({ error: "Custom field tidak ditemukan" }, { status: 404 });
    }

    // Verify access (need ADMIN or OWNER)
    if (field.projectId) {
      const access = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: user.id, projectId: field.projectId } },
      });
      if (!access || access.role === "VIEWER") {
        return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
      }
    } else if (field.workspaceId) {
      const access = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: user.id, workspaceId: field.workspaceId } },
      });
      if (!access || access.role === "VIEWER") {
        return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
      }
    }

    const updated = await prisma.customField.update({
      where: { id: params.id },
      data: validated.data,
    });

    return NextResponse.json({ field: updated, message: "Custom field diperbarui" });
  } catch (error: any) {
    console.error("Update custom field error:", error);
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const field = await prisma.customField.findUnique({
      where: { id: params.id },
    });

    if (!field) {
      return NextResponse.json({ error: "Custom field tidak ditemukan" }, { status: 404 });
    }

    // Verify access (need ADMIN or OWNER)
    if (field.projectId) {
      const access = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: user.id, projectId: field.projectId } },
      });
      if (!access || access.role === "VIEWER") {
        return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
      }
    } else if (field.workspaceId) {
      const access = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: user.id, workspaceId: field.workspaceId } },
      });
      if (!access || access.role === "VIEWER") {
        return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
      }
    }

    await prisma.customField.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Custom field dihapus" });
  } catch (error: any) {
    console.error("Delete custom field error:", error);
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}