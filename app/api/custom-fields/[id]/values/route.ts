import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const setCustomFieldValueSchema = z.object({
  customFieldId: z.string().cuid(),
  taskId: z.string().cuid(),
  value: z.any(),
});

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validated = setCustomFieldValueSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Data tidak valid", issues: validated.error.issues },
        { status: 400 }
      );
    }

    const { customFieldId, taskId, value } = validated.data;

    // Verify task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { workspaceId: true } } },
    });

    if (!task) {
      return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
    }

    // Verify access
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: user.id, workspaceId: task.project.workspaceId } },
    });

    if (!workspaceMember || workspaceMember.role === "VIEWER") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
    }

    // Verify custom field exists and belongs to same project/workspace
    const field = await prisma.customField.findUnique({
      where: { id: customFieldId },
    });

    if (!field) {
      return NextResponse.json({ error: "Custom field tidak ditemukan" }, { status: 404 });
    }

    // Verify field belongs to same project or workspace
    if (field.projectId && field.projectId !== task.projectId) {
      return NextResponse.json(
        { error: "Custom field tidak milik proyek yang sama" },
        { status: 400 }
      );
    }
    if (field.workspaceId && field.workspaceId !== task.project.workspaceId) {
      return NextResponse.json(
        { error: "Custom field tidak milik workspace yang sama" },
        { status: 400 }
      );
    }

    // Upsert value
    const fieldValue = await prisma.customFieldValue.upsert({
      where: {
        customFieldId_taskId: { customFieldId, taskId },
      },
      create: { customFieldId, taskId, value },
      update: { value },
    });

    return NextResponse.json({ value: fieldValue, message: "Nilai custom field disimpan" });
  } catch (error: any) {
    console.error("Set custom field value error:", error);
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json({ error: "taskId diperlukan" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { workspaceId: true } } },
    });

    if (!task) {
      return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
    }

    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: user.id, workspaceId: task.project.workspaceId } },
    });

    if (!workspaceMember) {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
    }

    const values = await prisma.customFieldValue.findMany({
      where: { taskId },
      include: { customField: true },
    });

    return NextResponse.json({ values });
  } catch (error: any) {
    console.error("Get custom field values error:", error);
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}