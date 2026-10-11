import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const sprint = await prisma.sprint.findUnique({
      where: { id: params.id },
    });

    if (!sprint) {
      return NextResponse.json(
        { error: "Sprint tidak ditemukan" },
        { status: 404 }
      );
    }

    // Verify access
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: user.id, workspaceId: sprint.workspaceId } },
    });

    if (!workspaceMember) {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    // Fetch tasks in the sprint
    const sprintTasks = await prisma.sprintTask.findMany({
      where: { sprintId: params.id },
      include: {
        task: {
          include: {
            column: {
              select: { status: true },
            },
            assignees: {
              include: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    // Generate burndown data
    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Total tasks
    const totalTasks = sprintTasks.length;

    // For each day, calculate completed tasks
    const burndownData = [];

    for (let i = 0; i <= totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const completedByDay = sprintTasks.filter(st => {
        if (!st.task.completedAt) return false;
        return st.task.completedAt >= currentDate && st.task.completedAt < nextDate;
      }).length;

      const cumulativeCompleted = burndownData.length > 0
        ? burndownData[burndownData.length - 1].cumulativeCompleted + completedByDay
        : completedByDay;

      burndownData.push({
        date: currentDate.toISOString().split('T')[0],
        totalTasks,
        remaining: totalTasks - cumulativeCompleted,
        completed: cumulativeCompleted,
        idealRemaining: Math.max(0, totalTasks - (totalTasks / totalDays) * (i + 1)),
      });
    }

    return NextResponse.json({
      data: burndownData,
      totalTasks,
      completedTasks: sprintTasks.filter(st => st.task.column.status === "DONE").length,
    });
  } catch (error: any) {
    console.error("Get burndown error:", error);
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
