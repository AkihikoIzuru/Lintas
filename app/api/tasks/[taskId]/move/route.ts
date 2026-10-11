import { NextResponse } from "next/server";
import { requireAuth, requireProjectAccess } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { moveTaskSchema } from "@/lib/validations";
import { generateKeyBetween } from "@/lib/fractional-indexing";

export async function POST(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const task = await prisma.task.findUnique({
      where: { id: params.taskId },
      select: { projectId: true, columnId: true },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Tugas tidak ditemukan" },
        { status: 404 }
      );
    }

    await requireProjectAccess(task.projectId, user.id, "MEMBER");

    const validatedFields = moveTaskSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Data tidak valid", issues: validatedFields.error.issues },
        { status: 400 }
      );
    }

    const { taskId, columnId, position } = validatedFields.data;

    // Get tasks around the target position
    const tasksInColumn = await prisma.task.findMany({
      where: { columnId },
      orderBy: { position: "asc" },
      select: { id: true, position: true },
    });

    let newPosition: number;

    if (tasksInColumn.length === 0) {
      // First task in column
      newPosition = parseFloat(generateKeyBetween(null, null));
    } else {
      const targetIndex = Math.min(position, tasksInColumn.length);
      const prevTask = targetIndex > 0 ? tasksInColumn[targetIndex - 1] : null;
      const nextTask = targetIndex < tasksInColumn.length ? tasksInColumn[targetIndex] : null;

      newPosition = parseFloat(
        generateKeyBetween(
          prevTask ? prevTask.position.toString() : null,
          nextTask ? nextTask.position.toString() : null
        )
      );
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        columnId,
        position: newPosition,
        updaterId: user.id,
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        labels: {
          include: {
            label: true,
          },
        },
      },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: "MOVED",
        taskId,
        userId: user.id,
        metadata: {
          fromColumn: task.columnId,
          toColumn: columnId,
        },
      },
    });

    return NextResponse.json({
      task: updatedTask,
      message: "Tugas berhasil dipindahkan",
    });
  } catch (error: any) {
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Move task error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}