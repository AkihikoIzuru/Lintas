import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { updateTaskSchema } from "@/lib/validations";

export async function PATCH(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { taskIds, ...updateData } = body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        { error: "Task IDs diperlukan" },
        { status: 400 }
      );
    }

    // Verify all tasks belong to projects user has access to
    const tasks = await prisma.task.findMany({
      where: { id: { in: taskIds } },
      select: {
        id: true,
        projectId: true,
        columnId: true,
      },
    });

    if (tasks.length !== taskIds.length) {
      return NextResponse.json(
        { error: "Beberapa tugas tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check access for each project
    const projectIds = [...new Set(tasks.map((t) => t.projectId))];
    for (const projectId of projectIds) {
      const access = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: user.id, projectId } },
      });
      if (!access || access.role === "VIEWER") {
        return NextResponse.json(
          { error: `Tidak memiliki akses ke proyek ${projectId}` },
          { status: 403 }
        );
      }
    }

    // Handle label action separately
    const { labelIds, labelAction, assigneeIds, columnId, ...rest } = updateData;

    // Update tasks in batches
    const updatedTasks = await Promise.all(
      tasks.map(async (task) => {
        const data: any = { ...rest, updaterId: user.id };

        // Handle column change
        if (columnId && task.columnId !== columnId) {
          data.columnId = columnId;
          // Generate new position at end of column
          const lastTask = await prisma.task.findFirst({
            where: { columnId },
            orderBy: { position: "desc" },
            select: { position: true },
          });
          const { generateKeyBetween } = await import("@/lib/fractional-indexing");
          data.position = parseFloat(
            generateKeyBetween(lastTask ? lastTask.position.toString() : null, null)
          );
        }

        // Handle assignees
        if (assigneeIds !== undefined) {
          data.assignees = {
            deleteMany: {},
            create: assigneeIds.map((userId: string) => ({ userId })),
          };
        }

        // Handle labels
        if (labelIds !== undefined) {
          if (labelAction === "add") {
            // Get existing labels
            const existing = await prisma.taskLabel.findMany({
              where: { taskId: task.id },
              select: { labelId: true },
            });
            const existingIds = existing.map((e) => e.labelId);
            const newLabels = labelIds.filter((id: string) => !existingIds.includes(id));
            data.labels = {
              create: newLabels.map((labelId: string) => ({ labelId })),
            };
          } else if (labelAction === "remove") {
            data.labels = {
              deleteMany: { labelId: { in: labelIds } },
            };
          }
        }

        return prisma.task.update({
          where: { id: task.id },
          data,
        });
      })
    );

    // Create activity logs
    await prisma.activity.createMany({
      data: tasks.map((task) => ({
        type: "UPDATED",
        taskId: task.id,
        userId: user.id,
        metadata: updateData,
      })),
    });

    return NextResponse.json({
      tasks: updatedTasks,
      message: `${updatedTasks.length} tugas berhasil diperbarui`,
    });
  } catch (error: any) {
    console.error("Bulk update tasks error:", error);
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { taskIds } = body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        { error: "Task IDs diperlukan" },
        { status: 400 }
      );
    }

    // Verify access
    const tasks = await prisma.task.findMany({
      where: { id: { in: taskIds } },
      select: { id: true, projectId: true },
    });

    if (tasks.length !== taskIds.length) {
      return NextResponse.json(
        { error: "Beberapa tugas tidak ditemukan" },
        { status: 404 }
      );
    }

    const projectIds = [...new Set(tasks.map((t) => t.projectId))];
    for (const projectId of projectIds) {
      const access = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: user.id, projectId } },
      });
      if (!access || access.role === "VIEWER") {
        return NextResponse.json(
          { error: `Tidak memiliki akses ke proyek ${projectId}` },
          { status: 403 }
        );
      }
    }

    await prisma.task.deleteMany({
      where: { id: { in: taskIds } },
    });

    return NextResponse.json({
      message: `${taskIds.length} tugas berhasil dihapus`,
    });
  } catch (error: any) {
    console.error("Bulk delete tasks error:", error);
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}