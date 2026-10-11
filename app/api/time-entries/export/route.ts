import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/time-entries/export - Export time entries as CSV
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const taskId = searchParams.get("taskId");
    const userId = searchParams.get("userId") || session.user.id;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const format = searchParams.get("format") || "csv"; // csv or json

    const where: any = {
      userId,
    };

    if (taskId) where.taskId = taskId;
    if (projectId) where.task = { projectId };
    if (startDate || endDate) {
      where.startedAt = {};
      if (startDate) where.startedAt.gte = new Date(startDate);
      if (endDate) where.startedAt.lte = new Date(endDate);
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: { select: { id: true, name: true, key: true } },
            column: { select: { name: true } },
          },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    if (format === "json") {
      return NextResponse.json({ timeEntries });
    }

    // Generate CSV
    const headers = [
      "ID",
      "Task ID",
      "Task Title",
      "Project Key",
      "Project Name",
      "Column",
      "Duration (minutes)",
      "Duration (hours)",
      "Description",
      "Started At",
      "Ended At",
      "Created At",
    ];

    const rows = timeEntries.map((entry) => [
      entry.id,
      entry.task.id,
      `"${entry.task.title.replace(/"/g, '""')}"`,
      entry.task.project.key,
      `"${entry.task.project.name.replace(/"/g, '""')}"`,
      entry.task.column.name,
      entry.duration.toString(),
      (entry.duration / 60).toFixed(2),
      entry.description ? `"${entry.description.replace(/"/g, '""')}"` : "",
      new Date(entry.startedAt).toISOString(),
      entry.endedAt ? new Date(entry.endedAt).toISOString() : "",
      new Date(entry.createdAt).toISOString(),
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="time-entries-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting time entries:", error);
    return NextResponse.json(
      { error: "Failed to export time entries" },
      { status: 500 }
    );
  }
}