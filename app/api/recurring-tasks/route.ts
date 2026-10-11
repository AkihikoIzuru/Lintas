import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/recurring-tasks - List recurring tasks
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const isActive = searchParams.get("isActive");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = {
      project: {
        members: { some: { userId: session.user.id } },
      },
    };

    if (projectId) where.projectId = projectId;
    if (isActive !== null) where.isActive = isActive === "true";

    const [recurringTasks, total] = await Promise.all([
      prisma.recurringTask.findMany({
        where,
        include: {
          project: { select: { id: true, name: true, key: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { nextOccurrence: "asc" },
        take: limit,
        skip: offset,
      }),
      prisma.recurringTask.count({ where }),
    ]);

    return NextResponse.json({
      recurringTasks,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error("Error fetching recurring tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch recurring tasks" },
      { status: 500 }
    );
  }
}

// POST /api/recurring-tasks - Create recurring task
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      name,
      templateData,
      frequency,
      interval = 1,
      daysOfWeek,
      dayOfMonth,
      nextOccurrence,
      projectId,
    } = await req.json();

    if (!name || !templateData || !frequency || !nextOccurrence || !projectId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify project access
    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: session.user.id, projectId } },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const recurringTask = await prisma.recurringTask.create({
      data: {
        name,
        templateData,
        frequency,
        interval,
        daysOfWeek,
        dayOfMonth,
        nextOccurrence: new Date(nextOccurrence),
        projectId,
        createdById: session.user.id,
      },
      include: {
        project: { select: { id: true, name: true, key: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ recurringTask });
  } catch (error) {
    console.error("Error creating recurring task:", error);
    return NextResponse.json(
      { error: "Failed to create recurring task" },
      { status: 500 }
    );
  }
}