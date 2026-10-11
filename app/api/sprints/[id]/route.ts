import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { updateSprintSchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const sprint = await prisma.sprint.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true,
            color: true,
          },
        },
        tasks: {
          include: {
            column: {
              select: {
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
            _count: {
              select: {
                subtasks: true,
              },
            },
          },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });

    if (!sprint) {
      return NextResponse.json(
        { error: "Sprint tidak ditemukan" },
        { status: 404 }
      );
    }

    // Verify access
    const workspaceId = sprint.workspaceId;
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: user.id, workspaceId } },
    });

    if (!workspaceMember) {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    return NextResponse.json({ sprint });
  } catch (error: any) {
    console.error("Get sprint error:", error);
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const existingSprint = await prisma.sprint.findUnique({
      where: { id: params.id },
    });

    if (!existingSprint) {
      return NextResponse.json(
        { error: "Sprint tidak ditemukan" },
        { status: 404 }
      );
    }

    // Verify access
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: user.id, workspaceId: existingSprint.workspaceId } },
    });

    if (!workspaceMember || workspaceMember.role === "VIEWER") {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    const validatedFields = updateSprintSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Data tidak valid", issues: validatedFields.error.issues },
        { status: 400 }
      );
    }

    const sprint = await prisma.sprint.update({
      where: { id: params.id },
      data: validatedFields.data,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true,
            color: true,
          },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });

    return NextResponse.json({ sprint, message: "Sprint berhasil diperbarui" });
  } catch (error: any) {
    console.error("Update sprint error:", error);
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

    const existingSprint = await prisma.sprint.findUnique({
      where: { id: params.id },
      include: { workspace: { select: { members: true } } },
    });

    if (!existingSprint) {
      return NextResponse.json(
        { error: "Sprint tidak ditemukan" },
        { status: 404 }
      );
    }

    const member = existingSprint.workspace.members.find(
      (m) => m.userId === user.id
    );

    if (!member || member.role === "VIEWER") {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    await prisma.sprint.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Sprint berhasil dihapus" });
  } catch (error: any) {
    console.error("Delete sprint error:", error);
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}