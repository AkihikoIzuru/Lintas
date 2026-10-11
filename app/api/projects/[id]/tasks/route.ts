import { NextResponse } from "next/server";
import { requireAuth, requireProjectAccess } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { createTaskSchema } from "@/lib/validations";
import { generateKeyBetween } from "@/lib/fractional-indexing";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    await requireProjectAccess(params.id, user.id, "MEMBER");

    const body = await request.json();
    const validatedFields = createTaskSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Data tidak valid", issues: validatedFields.error.issues },
        { status: 400 }
      );
    }

    const { columnId, assigneeIds, labelIds, ...taskData } = validatedFields.data;

    // Get last task in column to generate position
    const lastTask = await prisma.task.findFirst({
      where: { columnId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const position = parseFloat(
      generateKeyBetween(
        lastTask ? lastTask.position.toString() : null,
        null
      )
    );

    // Create task
    const task = await prisma.task.create({
      data: {
        ...taskData,
        position,
        projectId: params.id,
        columnId,
        creatorId: user.id,
        updaterId: user.id,
        ...(assigneeIds && {
          assignees: {
            create: assigneeIds.map((userId: string) => ({
              userId,
            })),
          },
        }),
        ...(labelIds && {
          labels: {
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
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: "CREATED",
        taskId: task.id,
        userId: user.id,
      },
    });

    return NextResponse.json(
      { task, message: "Tugas berhasil dibuat" },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Create task error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}