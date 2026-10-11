import { NextResponse } from "next/server";
import { requireAuth, requireProjectAccess } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { updateTaskSchema, moveTaskSchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const user = await requireAuth();

    const task = await prisma.task.findUnique({
      where: { id: params.taskId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true,
            workspaceId: true,
          },
        },
        column: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
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
        subtasks: {
          orderBy: { position: "asc" },
        },
        comments: {
          orderBy: { createdAt: "desc" },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
            mentions: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        attachments: {
          orderBy: { createdAt: "desc" },
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 50,
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
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        updater: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Tugas tidak ditemukan" },
        { status: 404 }
      );
    }

    await requireProjectAccess(task.projectId, user.id);

    return NextResponse.json({ task });
  } catch (error: any) {
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Get task error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const task = await prisma.task.findUnique({
      where: { id: params.taskId },
      select: { projectId: true },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Tugas tidak ditemukan" },
        { status: 404 }
      );
    }

    await requireProjectAccess(task.projectId, user.id, "MEMBER");

    const validatedFields = updateTaskSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Data tidak valid", issues: validatedFields.error.issues },
        { status: 400 }
      );
    }

    const { assigneeIds, labelIds, ...updateData } = validatedFields.data;

    const updatedTask = await prisma.task.update({
      where: { id: params.taskId },
      data: {
        ...updateData,
        updaterId: user.id,
        ...(assigneeIds !== undefined && {
          assignees: {
            deleteMany: {},
            create: assigneeIds.map((userId: string) => ({
              userId,
            })),
          },
        }),
        ...(labelIds !== undefined && {
          labels: {
            deleteMany: {},
            create: labelIds.map((labelId: string) => ({
              labelId,
            })),
          },
        }),
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
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
        subtasks: {
          orderBy: { position: "asc" },
        },
      },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: "UPDATED",
        taskId: params.taskId,
        userId: user.id,
        metadata: updateData,
      },
    });

    return NextResponse.json({
      task: updatedTask,
      message: "Tugas berhasil diperbarui",
    });
  } catch (error: any) {
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Update task error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const user = await requireAuth();

    const task = await prisma.task.findUnique({
      where: { id: params.taskId },
      select: { projectId: true },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Tugas tidak ditemukan" },
        { status: 404 }
      );
    }

    await requireProjectAccess(task.projectId, user.id, "MEMBER");

    await prisma.task.delete({
      where: { id: params.taskId },
    });

    return NextResponse.json({ message: "Tugas berhasil dihapus" });
  } catch (error: any) {
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Delete task error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}