import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    if (!workspaceMember || workspaceMember.role === "VIEWER") {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    // Verify all tasks belong to the same project (if sprint has projectId)
    if (sprint.projectId) {
      const tasks = await prisma.task.findMany({
        where: { id: { in: taskIds } },
        select: { projectId: true },
      });

      const invalidTasks = tasks.filter((t) => t.projectId !== sprint.projectId);
      if (invalidTasks.length > 0) {
        return NextResponse.json(
          { error: "Beberapa tugas tidak berada di proyek sprint ini" },
          { status: 400 }
        );
      }
    }

    // Add tasks to sprint
    await prisma.sprintTask.createMany({
      data: taskIds.map((taskId: string) => ({
        sprintId: params.id,
        taskId,
      })),
      skipDuplicates: true,
    });

    // Update task column to IN_PROGRESS if in backlog/todo
    await prisma.task.updateMany({
      where: {
        id: { in: taskIds },
        column: { status: { in: ["BACKLOG", "TODO"] } },
      },
      data: {
        columnId: await prisma.column.findFirst({
          where: {
            projectId: sprint.projectId || "",
            status: "IN_PROGRESS",
          },
          select: { id: true },
        }).then((col) => col?.id).catch(() => undefined),
      },
    });

    return NextResponse.json({ message: "Tugas berhasil ditambahkan ke sprint" });
  } catch (error: any) {
    console.error("Add tasks to sprint error:", error);
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const taskIds = searchParams.get("taskIds")?.split(",") || [];

    if (taskIds.length === 0) {
      return NextResponse.json(
        { error: "Task IDs diperlukan" },
        { status: 400 }
      );
    }

    const sprint = await prisma.sprint.findUnique({
      where: { id: params.id },
    });

    if (!sprint) {
      return NextResponse.json(
        { error: "Sprint tidak ditemukan" },
        { status: 404 }
      );
    }

    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: user.id, workspaceId: sprint.workspaceId } },
    });

    if (!workspaceMember || workspaceMember.role === "VIEWER") {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    await prisma.sprintTask.deleteMany({
      where: {
        sprintId: params.id,
        taskId: { in: taskIds },
      },
    });

    return NextResponse.json({ message: "Tugas berhasil dihapus dari sprint" });
  } catch (error: any) {
    console.error("Remove tasks from sprint error:", error);
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}