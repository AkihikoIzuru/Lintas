import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/time-entries/[id] - Update time entry
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

    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!timeEntry) {
      return NextResponse.json({ error: "Time entry not found" }, { status: 404 });
    }

    if (timeEntry.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If duration changed, update task timeSpent
    if (updates.duration && updates.duration !== timeEntry.duration) {
      const diff = updates.duration - timeEntry.duration;
      await prisma.task.update({
        where: { id: timeEntry.taskId },
        data: { timeSpent: { increment: diff } },
      });
    }

    const updated = await prisma.timeEntry.update({
      where: { id },
      data: {
        duration: updates.duration,
        description: updates.description,
        startedAt: updates.startedAt ? new Date(updates.startedAt) : undefined,
        endedAt: updates.endedAt ? new Date(updates.endedAt) : undefined,
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

    return NextResponse.json({ timeEntry: updated });
  } catch (error) {
    console.error("Error updating time entry:", error);
    return NextResponse.json(
      { error: "Failed to update time entry" },
      { status: 500 }
    );
  }
}

// DELETE /api/time-entries/[id] - Delete time entry
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

    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id },
    });

    if (!timeEntry) {
      return NextResponse.json({ error: "Time entry not found" }, { status: 404 });
    }

    if (timeEntry.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update task timeSpent
    await prisma.task.update({
      where: { id: timeEntry.taskId },
      data: { timeSpent: { decrement: timeEntry.duration } },
    });

    await prisma.timeEntry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting time entry:", error);
    return NextResponse.json(
      { error: "Failed to delete time entry" },
      { status: 500 }
    );
  }
}