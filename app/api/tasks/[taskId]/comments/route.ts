import { NextResponse } from "next/server";
import { requireAuth, requireProjectAccess } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { createCommentSchema } from "@/lib/validations";

export async function GET(
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

    await requireProjectAccess(task.projectId, user.id);

    const comments = await prisma.comment.findMany({
      where: { taskId: params.taskId },
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
    });

    return NextResponse.json({ comments });
  } catch (error: any) {
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Get comments error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function POST(
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

    await requireProjectAccess(task.projectId, user.id);

    const validatedFields = createCommentSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Data tidak valid", issues: validatedFields.error.issues },
        { status: 400 }
      );
    }

    const { content, mentionUserIds } = validatedFields.data;

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId: params.taskId,
        authorId: user.id,
        ...(mentionUserIds && {
          mentions: {
            create: mentionUserIds.map((userId: string) => ({
              userId,
            })),
          },
        }),
      },
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
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: "COMMENTED",
        taskId: params.taskId,
        userId: user.id,
      },
    });

    return NextResponse.json(
      { comment, message: "Komentar berhasil ditambahkan" },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Create comment error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}