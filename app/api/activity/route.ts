import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/activity - Get activity feed
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const taskId = searchParams.get("taskId");
    const workspaceId = searchParams.get("workspaceId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const userId = searchParams.get("userId") || session.user.id;

    // Build where clause
    const where: any = {};

    if (taskId) {
      where.taskId = taskId;
    } else if (projectId) {
      where.task = { projectId };
    } else if (workspaceId) {
      where.task = { project: { workspaceId } };
    } else {
      // Default to user's workspaces
      const userWorkspaces = await prisma.workspaceMember.findMany({
        where: { userId: session.user.id },
        select: { workspaceId: true },
      });
      where.task = { project: { workspaceId: { in: userWorkspaces.map(w => w.workspaceId) } } };
    }

    // If specific userId requested and different from current user, check access
    if (userId !== session.user.id) {
      // Could add permission check here
    }
    where.userId = userId;

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
              project: {
                select: { id: true, name: true, key: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.activity.count({ where }),
    ]);

    return NextResponse.json({
      activities,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}