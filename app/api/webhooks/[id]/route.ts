import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateWebhookSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100).optional(),
  url: z.string().url("URL tidak valid").optional(),
  secret: z.string().optional().nullable(),
  events: z.array(z.string()).optional(),
  enabled: z.boolean().optional(),
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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const webhook = await prisma.webhook.findUnique({
      where: { id: params.id },
    });

    if (!webhook) {
      return NextResponse.json({ error: "Webhook tidak ditemukan" }, { status: 404 });
    }

    // Verify access
    if (webhook.projectId) {
      const access = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: user.id, projectId: webhook.projectId } },
      });
      if (!access) return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
    } else if (webhook.workspaceId) {
      const access = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: user.id, workspaceId: webhook.workspaceId } },
      });
      if (!access) return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
    }

    return NextResponse.json({ webhook, availableEvents: WEBHOOK_EVENTS });
  } catch (error: any) {
    console.error("Get webhook error:", error);
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
    const validated = updateWebhookSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Data tidak valid", issues: validated.error.issues },
        { status: 400 }
      );
    }

    const webhook = await prisma.webhook.findUnique({
      where: { id: params.id },
    });

    if (!webhook) {
      return NextResponse.json({ error: "Webhook tidak ditemukan" }, { status: 404 });
    }

    // Verify access (need ADMIN or OWNER)
    if (webhook.projectId) {
      const access = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: user.id, projectId: webhook.projectId } },
      });
      if (!access || access.role === "VIEWER") {
        return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
      }
    } else if (webhook.workspaceId) {
      const access = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: user.id, workspaceId: webhook.workspaceId } },
      });
      if (!access || access.role === "VIEWER") {
        return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
      }
    }

    const { events, ...data } = validated.data;

    if (events) {
      const invalidEvents = events.filter((e) => !WEBHOOK_EVENTS.includes(e));
      if (invalidEvents.length > 0) {
        return NextResponse.json(
          { error: `Event tidak valid: ${invalidEvents.join(", ")}` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.webhook.update({
      where: { id: params.id },
      data: { ...data, events },
    });

    return NextResponse.json({ webhook: updated, message: "Webhook diperbarui" });
  } catch (error: any) {
    console.error("Update webhook error:", error);
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

    const webhook = await prisma.webhook.findUnique({
      where: { id: params.id },
    });

    if (!webhook) {
      return NextResponse.json({ error: "Webhook tidak ditemukan" }, { status: 404 });
    }

    // Verify access (need ADMIN or OWNER)
    if (webhook.projectId) {
      const access = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: user.id, projectId: webhook.projectId } },
      });
      if (!access || access.role === "VIEWER") {
        return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
      }
    } else if (webhook.workspaceId) {
      const access = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: user.id, workspaceId: webhook.workspaceId } },
      });
      if (!access || access.role === "VIEWER") {
        return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
      }
    }

    await prisma.webhook.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Webhook dihapus" });
  } catch (error: any) {
    console.error("Delete webhook error:", error);
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}