import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createAutomationRuleSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100),
  description: z.string().max(500).optional(),
  trigger: z.enum([
    "TASK_CREATED", "TASK_UPDATED", "TASK_MOVED", "TASK_COMPLETED", "TASK_OVERDUE",
    "SPRINT_STARTED", "SPRINT_ENDED", "COMMENT_ADDED", "MENTION_ADDED"
  ]),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(["equals", "not_equals", "contains", "not_contains", "greater_than", "less_than", "in", "not_in"]),
    value: z.any(),
  })).optional(),
  actions: z.array(z.object({
    type: z.enum([
      "ASSIGN_USER", "CHANGE_PRIORITY", "CHANGE_STATUS", "ADD_LABEL", "REMOVE_LABEL",
      "SET_DUE_DATE", "ADD_TO_SPRINT", "REMOVE_FROM_SPRINT", "SEND_NOTIFICATION",
      "CREATE_TASK", "WEBHOOK"
    ]),
    config: z.record(z.any()),
  })).min(1, "Minimal 1 aksi diperlukan"),
  enabled: z.boolean().default(true),
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

    const rules = await prisma.automationRule.findMany({
      where: {
        OR: [
          projectId ? { projectId } : {},
          workspaceId ? { workspaceId } : {},
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ rules });
  } catch (error: any) {
    console.error("Get automation rules error:", error);
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
    const validated = createAutomationRuleSchema.safeParse(body);

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

    const rule = await prisma.automationRule.create({
      data: {
        ...data,
        projectId,
        workspaceId,
        createdById: user.id,
      },
    });

    return NextResponse.json({ rule, message: "Aturan otomatisasi berhasil dibuat" }, { status: 201 });
  } catch (error: any) {
    console.error("Create automation rule error:", error);
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}