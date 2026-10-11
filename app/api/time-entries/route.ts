import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/time-entries - List time entries
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");
    const projectId = searchParams.get("projectId");
    const userId = searchParams.get("userId") || session.user.id;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

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

    const [timeEntries, total] = await Promise.all([
      prisma.timeEntry.findMany({
        where,
        include: {
          task: {
            select: {
              id: true,
              title: true,
              project: { select: { id: true, name: true, key: true } },
            },
          },
        },
        orderBy: { startedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.timeEntry.count({ where }),
    ]);

    return NextResponse.json({
      timeEntries,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error("Error fetching time entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch time entries" },
      { status: 500 }
    );
  }
}

// POST /api/time-entries - Create time entry
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId, duration, description, startedAt, endedAt } = await req.json();

    if (!taskId || !duration || !startedAt) {
      return NextResponse.json(
        { error: "Missing required fields: taskId, duration, startedAt" },
        { status: 400 }
      );
    }

    // Verify task access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check project membership
    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: session.user.id, projectId: task.projectId } },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        taskId,
        userId: session.user.id,
        duration,
        description,
        startedAt: new Date(startedAt),
        endedAt: endedAt ? new Date(endedAt) : null,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: { select: { id: true, name: true, key: true } },
          },
        },
      },
    });

    // Update task timeSpent
    await prisma.task.update({
      where: { id: taskId },
      data: { timeSpent: { increment: duration } },
    });

    return NextResponse.json({ timeEntry });
  } catch (error) {
    console.error("Error creating time entry:", error);
    return NextResponse.json(
      { error: "Failed to create time entry" },
      { status: 500 }
    );
  }
}