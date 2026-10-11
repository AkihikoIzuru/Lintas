import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/milestones/[id]/tasks - Get tasks linked to milestone
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

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            task: {
              include: {
                column: true,
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
              },
            },
          },
        },
      },
    });

    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    // Check project access
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId: milestone.projectId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ tasks: milestone.tasks.map(mt => mt.task) });
  } catch (error) {
    console.error("Error fetching milestone tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch milestone tasks" },
      { status: 500 }
    );
  }
}

// POST /api/milestones/[id]/tasks - Link task to milestone
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
    const { taskId } = await req.json();

    if (!taskId) {
      return NextResponse.json(
        { error: "Missing required field: taskId" },
        { status: 400 }
      );
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id },
    });

    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    // Check project access
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId: milestone.projectId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify task belongs to same project
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.projectId !== milestone.projectId) {
      return NextResponse.json(
        { error: "Task not found or belongs to different project" },
        { status: 400 }
      );
    }

    // Link task to milestone
    const milestoneTask = await prisma.milestoneTask.create({
      data: {
        milestoneId: id,
        taskId,
      },
    });

    return NextResponse.json({ milestoneTask });
  } catch (error: any) {
    console.error("Error linking task to milestone:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Task already linked to this milestone" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to link task to milestone" },
      { status: 500 }
    );
  }
}

// DELETE /api/milestones/[id]/tasks - Unlink task from milestone
export async function DELETE(
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
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json(
        { error: "Missing required parameter: taskId" },
        { status: 400 }
      );
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id },
    });

    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    // Check project access
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId: milestone.projectId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Unlink task from milestone
    await prisma.milestoneTask.deleteMany({
      where: {
        milestoneId: id,
        taskId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unlinking task from milestone:", error);
    return NextResponse.json(
      { error: "Failed to unlink task from milestone" },
      { status: 500 }
    );
  }
}
