import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/recurring-tasks/[id]/history - Get history of tasks generated from recurring task
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const recurringTask = await prisma.recurringTask.findUnique({
      where: { id },
    });

    if (!recurringTask) {
      return NextResponse.json({ error: "Recurring task not found" }, { status: 404 });
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

    const [history, total] = await Promise.all([
      prisma.recurringTaskHistory.findMany({
        where: { recurringTaskId: id },
        include: {
          task: {
            select: {
              id: true,
              title: true,
              status: true,
              column: { select: { name: true, status: true } },
              createdAt: true,
              completedAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.recurringTaskHistory.count({ where: { recurringTaskId: id } }),
    ]);

    return NextResponse.json({
      history,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error("Error fetching recurring task history:", error);
    return NextResponse.json(
      { error: "Failed to fetch recurring task history" },
      { status: 500 }
    );
  }
}