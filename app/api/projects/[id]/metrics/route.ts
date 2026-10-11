import { NextResponse } from "next/server";
import { requireAuth, requireProjectAccess } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, endOfDay, format } from "date-fns";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    await requireProjectAccess(params.id, user.id);

    const projectId = params.id;

    // Get all tasks for the project
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        isArchived: false,
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        column: {
          select: {
            status: true,
          },
        },
      },
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.column.status === "DONE").length;
    const inProgressTasks = tasks.filter((t) => t.column.status === "IN_PROGRESS").length;
    const now = new Date();
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.column.status !== "DONE"
    ).length;

    // Tasks by Priority
    const priorityOrder = ["URGENT", "HIGH", "MEDIUM", "LOW"];
    const tasksByPriority = priorityOrder.map((priority) => ({
      name: priority,
      value: tasks.filter((t) => t.priority === priority).length,
      color: {
        URGENT: "#ef4444",
        HIGH: "#f97316",
        MEDIUM: "#eab308",
        LOW: "#3b82f6",
      }[priority],
    }));

    // Tasks by Status
    const statusOrder = ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
    const tasksByStatus = statusOrder.map((status) => ({
      name: status,
      value: tasks.filter((t) => t.column.status === status).length,
      color: {
        BACKLOG: "#6b7280",
        TODO: "#3b82f6",
        IN_PROGRESS: "#eab308",
        IN_REVIEW: "#a855f7",
        DONE: "#22c55e",
      }[status],
    }));

    // Tasks by Assignee
    const assigneeMap = new Map();
    tasks.forEach((task) => {
      task.assignees.forEach(({ user }) => {
        const key = user.id;
        if (!assigneeMap.has(key)) {
          assigneeMap.set(key, {
            id: user.id,
            name: user.name || user.email,
            tasks: 0,
            completed: 0,
          });
        }
        const assignee = assigneeMap.get(key);
        assignee.tasks++;
        if (task.column.status === "DONE") {
          assignee.completed++;
        }
      });
    });
    const tasksByAssignee = Array.from(assigneeMap.values())
      .sort((a, b) => b.tasks - a.tasks);

    // Completion Trend (last 7 days)
    const completionTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const completed = tasks.filter(
        (t) => t.completedAt && new Date(t.completedAt) >= dayStart && new Date(t.completedAt) <= dayEnd
      ).length;

      const created = tasks.filter(
        (t) => new Date(t.createdAt) >= dayStart && new Date(t.createdAt) <= dayEnd
      ).length;

      completionTrend.push({
        date: format(date, "EEE"),
        completed,
        created,
      });
    }

    // Average completion time (in days)
    const completedTasksWithDates = tasks.filter(
      (t) => t.completedAt && t.column.status === "DONE"
    );
    let averageCompletionTime = 0;
    if (completedTasksWithDates.length > 0) {
      const totalDays = completedTasksWithDates.reduce((sum, task) => {
        const created = new Date(task.createdAt).getTime();
        const completed = new Date(task.completedAt!).getTime();
        return sum + (completed - created) / (1000 * 60 * 60 * 24);
      }, 0);
      averageCompletionTime = totalDays / completedTasksWithDates.length;
    }

    // Velocity (tasks completed per week over last 4 weeks)
    const fourWeeksAgo = subDays(new Date(), 28);
    const recentCompleted = tasks.filter(
      (t) => t.completedAt && new Date(t.completedAt) >= fourWeeksAgo && t.column.status === "DONE"
    ).length;
    const velocity = recentCompleted / 4;

    return NextResponse.json({
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      tasksByPriority,
      tasksByStatus,
      tasksByAssignee,
      completionTrend,
      averageCompletionTime,
      velocity,
    });
  } catch (error: any) {
    console.error("Get project metrics error:", error);
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}