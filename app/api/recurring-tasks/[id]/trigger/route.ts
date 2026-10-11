import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/recurring-tasks/[id]/trigger - Manually trigger recurring task (create task now)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const recurringTask = await prisma.recurringTask.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            columns: true,
          },
        },
      },
    });

    if (!recurringTask) {
      return NextResponse.json(
        { error: "Recurring task not found" },
        { status: 404 }
      );
    }

    // Check project access
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId: recurringTask.projectId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get template data
    const templateData = recurringTask.templateData as any;

    // Find the column to create the task in
    let targetColumnId = templateData.columnId;
    if (!targetColumnId) {
      // Default to first column
      targetColumnId = recurringTask.project.columns[0]?.id;
    }

    if (!targetColumnId) {
      return NextResponse.json(
        { error: "No columns available in project" },
        { status: 400 }
      );
    }

    // Calculate position (add to bottom of column)
    const tasksInColumn = await prisma.task.findMany({
      where: { columnId: targetColumnId },
      orderBy: { position: "desc" },
      take: 1,
    });

    const newPosition = tasksInColumn.length > 0 ? tasksInColumn[0].position + 1 : 0;

    // Create task from template
    const task = await prisma.task.create({
      data: {
        title: templateData.title || `${recurringTask.name} - ${new Date().toLocaleDateString('id-ID')}`,
        description: templateData.description || null,
        priority: templateData.priority || "MEDIUM",
        position: newPosition,
        projectId: recurringTask.projectId,
        columnId: targetColumnId,
        creatorId: session.user.id,
        updaterId: session.user.id,
        // Optionally set assignees and labels from template
        assignees: templateData.assignees
          ? {
              create: templateData.assignees.map((userId: string) => ({
                userId,
              })),
            }
          : undefined,
        labels: templateData.labels
          ? {
              create: templateData.labels.map((labelId: string) => ({
                labelId,
              })),
            }
          : undefined,
      },
      include: {
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
        labels: {
          include: {
            label: true,
          },
        },
        column: true,
      },
    });

    // Calculate next occurrence based on frequency
    let nextOccurrence = new Date(recurringTask.nextOccurrence);

    switch (recurringTask.frequency) {
      case "daily":
        nextOccurrence.setDate(nextOccurrence.getDate() + recurringTask.interval);
        break;
      case "weekly":
        nextOccurrence.setDate(nextOccurrence.getDate() + (7 * recurringTask.interval));
        break;
      case "monthly":
        nextOccurrence.setMonth(nextOccurrence.getMonth() + recurringTask.interval);
        break;
    }

    // Update recurring task with next occurrence AND create history record
    await prisma.$transaction([
      prisma.recurringTask.update({
        where: { id },
        data: {
          nextOccurrence,
        },
      }),
      prisma.recurringTaskHistory.create({
        data: {
          recurringTaskId: id,
          taskId: task.id,
        },
      }),
    ]);

    return NextResponse.json({ task, nextOccurrence });
  } catch (error) {
    console.error("Error triggering recurring task:", error);
    return NextResponse.json(
      { error: "Failed to trigger recurring task" },
      { status: 500 }
    );
  }
}
