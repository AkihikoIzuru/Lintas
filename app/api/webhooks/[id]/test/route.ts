import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(
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

    // Send test payload
    const testPayload = {
      event: "webhook.test",
      timestamp: new Date().toISOString(),
      data: {
        message: "Ini adalah pesan uji coba webhook dari Lintas",
        webhookId: webhook.id,
        webhookName: webhook.name,
      },
    };

    const body = JSON.stringify(testPayload);
    const signature = webhook.secret
      ? crypto.createHmac("sha256", webhook.secret).update(body).digest("hex")
      : undefined;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "Lintas-Webhook/1.0",
      "X-Lintas-Event": "webhook.test",
      "X-Lintas-Delivery": crypto.randomUUID(),
    };

    if (signature) {
      headers["X-Lintas-Signature"] = `sha256=${signature}`;
    }

    const response = await fetch(webhook.url, {
      method: "POST",
      headers,
      body,
    });

    const responseText = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        { error: `Webhook gagal: ${response.status} ${response.statusText}`, response: responseText },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Webhook uji coba berhasil dikirim",
      status: response.status,
      response: responseText,
    });
  } catch (error: any) {
    console.error("Test webhook error:", error);
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}