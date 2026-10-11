import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createWebhookSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100),
  url: z.string().url("URL tidak valid"),
  secret: z.string().optional(),
  events: z.array(z.string()).min(1, "Minimal 1 event diperlukan"),
  enabled: z.boolean().default(true),
  projectId: z.string().cuid().optional(),
  workspaceId: z.string().cuid().optional(),
});

const WEBHOOK_EVENTS = [
  "task.created", "task.updated", "task.moved", "task.completed", "task.deleted",
  "comment.created", "comment.updated", "comment.deleted",
  "sprint.created", "sprint.started", "sprint.completed",
  "user.assigned", "user.unassigned",
  "label.added", "label.removed",
  "custom_field.changed",
  "dependency.added", "dependency.removed",
];

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

    const webhooks = await prisma.webhook.findMany({
      where: {
        OR: [
          projectId ? { projectId } : {},
          workspaceId ? { workspaceId } : {},
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ webhooks, availableEvents: WEBHOOK_EVENTS });
  } catch (error: any) {
    console.error("Get webhooks error:", error);
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
    const validated = createWebhookSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Data tidak valid", issues: validated.error.issues },
        { status: 400 }
      );
    }

    const { projectId, workspaceId, events, ...data } = validated.data;

    // Verify events are valid
    const invalidEvents = events.filter((e) => !WEBHOOK_EVENTS.includes(e));
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { error: `Event tidak valid: ${invalidEvents.join(", ")}` },
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

    const webhook = await prisma.webhook.create({
      data: {
        ...data,
        events,
        projectId,
        workspaceId,
        createdById: user.id,
      },
    });

    return NextResponse.json({ webhook, message: "Webhook berhasil dibuat" }, { status: 201 });
  } catch (error: any) {
    console.error("Create webhook error:", error);
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}