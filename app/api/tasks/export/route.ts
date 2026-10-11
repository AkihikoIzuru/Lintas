import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const format = searchParams.get("format") || "csv";
    const filter = searchParams.get("filter") || "all";

    if (!projectId) {
      return NextResponse.json(
        { error: "ProjectId diperlukan" },
        { status: 400 }
      );
    }

    // Verify project access
    const projectAccess = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: user.id, projectId } },
    });

    if (!projectAccess) {
      return NextResponse.json(
        { error: "Tidak memiliki akses ke proyek ini" },
        { status: 403 }
      );
    }

    // Get tasks based on filter
    const where: any = { projectId };

    // Build column query to get status
    const tasks = await prisma.task.findMany({
      where,
      include: {
        column: { select: { id: true, name: true, status: true } },
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        labels: {
          include: { label: { select: { id: true, name: true, color: true } } },
        },
        sprint: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, email: true } },
        _count: { select: { subtasks: true, comments: true, attachments: true } },
      },
      orderBy: [{ column: { order: "asc" } }, { position: "asc" }],
    });

    // Transform data for export
    const exportData = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      status: task.column.status,
      column: task.column.name,
      dueDate: task.dueDate ? task.dueDate.toISOString().split("T")[0] : "",
      startDate: task.startDate ? task.startDate.toISOString().split("T")[0] : "",
      completedAt: task.completedAt ? task.completedAt.toISOString().split("T")[0] : "",
      assignees: task.assignees.map((a) => a.user.email).join("; "),
      labels: task.labels.map((l) => l.label.name).join("; "),
      sprint: task.sprint?.name || "",
      createdBy: task.creator.name || task.creator.email,
      createdAt: task.createdAt.toISOString().split("T")[0],
      updatedAt: task.updatedAt.toISOString().split("T")[0],
      subtasksCount: task._count.subtasks,
      commentsCount: task._count.comments,
      attachmentsCount: task._count.attachments,
    }));

    if (format === "json") {
      return NextResponse.json({ data: exportData });
    }

    // CSV format
    const headers = [
      "id",
      "title",
      "description",
      "priority",
      "status",
      "column",
      "dueDate",
      "startDate",
      "completedAt",
      "assignees",
      "labels",
      "sprint",
      "createdBy",
      "createdAt",
      "updatedAt",
      "subtasksCount",
      "commentsCount",
      "attachmentsCount",
    ];

    const csvRows = [
      headers.join(","),
      ...exportData.map((row) =>
        headers
          .map((h) => {
            const value = row[h as keyof typeof row];
            // Escape quotes and wrap in quotes if contains comma, newline, or quote
            const str = String(value ?? "");
            if (str.includes(",") || str.includes("\n") || str.includes('"')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(",")
      ),
    ];

    const csv = csvRows.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="tasks-${projectId}-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Export tasks error:", error);
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}