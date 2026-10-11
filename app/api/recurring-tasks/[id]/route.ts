import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/recurring-tasks/[id] - Get recurring task
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

    const recurringTask = await prisma.recurringTask.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, key: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!recurringTask) {
      return NextResponse.json({ error: "Recurring task not found" }, { status: 404 });
    }

    // Check project access
    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: session.user.id, projectId: recurringTask.projectId } },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ recurringTask });
  } catch (error) {
    console.error("Error fetching recurring task:", error);
    return NextResponse.json(
      { error: "Failed to fetch recurring task" },
      { status: 500 }
    );
  }
}

// PATCH /api/recurring-tasks/[id] - Update recurring task
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const updates = await req.json();

    const recurringTask = await prisma.recurringTask.findUnique({
      where: { id },
    });

    if (!recurringTask) {
      return NextResponse.json({ error: "Recurring task not found" }, { status: 404 });
    }

    // Check project access
    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: session.user.id, projectId: recurringTask.projectId } },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.recurringTask.update({
      where: { id },
      data: {
        name: updates.name,
        templateData: updates.templateData,
        frequency: updates.frequency,
        interval: updates.interval,
        daysOfWeek: updates.daysOfWeek,
        dayOfMonth: updates.dayOfMonth,
        nextOccurrence: updates.nextOccurrence ? new Date(updates.nextOccurrence) : undefined,
        isActive: updates.isActive,
      },
      include: {
        project: { select: { id: true, name: true, key: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ recurringTask: updated });
  } catch (error) {
    console.error("Error updating recurring task:", error);
    return NextResponse.json(
      { error: "Failed to update recurring task" },
      { status: 500 }
    );
  }
}

// DELETE /api/recurring-tasks/[id] - Delete recurring task
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

    const recurringTask = await prisma.recurringTask.findUnique({
      where: { id },
    });

    if (!recurringTask) {
      return NextResponse.json({ error: "Recurring task not found" }, { status: 404 });
    }

    // Check project access
    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: session.user.id, projectId: recurringTask.projectId } },
    });

    if (!membership || (membership.role === "VIEWER" || membership.role === "MEMBER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.recurringTask.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting recurring task:", error);
    return NextResponse.json(
      { error: "Failed to delete recurring task" },
      { status: 500 }
    );
  }
}