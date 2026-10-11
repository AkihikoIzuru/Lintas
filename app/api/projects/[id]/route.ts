import { NextResponse } from "next/server";
import { requireAuth, requireProjectAccess } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { updateProjectSchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const access = await requireProjectAccess(params.id, user.id);

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        columns: {
          orderBy: { position: "asc" },
          include: {
            tasks: {
              where: { isArchived: false },
              orderBy: { position: "asc" },
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
                _count: {
                  select: {
                    comments: true,
                    attachments: true,
                  },
                },
              },
            },
          },
        },
        labels: {
          orderBy: { name: "asc" },
        },
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Proyek tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ project, role: access.role });
  } catch (error: any) {
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Get project error:", error);
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
    await requireProjectAccess(params.id, user.id, "MEMBER");

    const body = await request.json();
    const validatedFields = updateProjectSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Data tidak valid", issues: validatedFields.error.issues },
        { status: 400 }
      );
    }

    const project = await prisma.project.update({
      where: { id: params.id },
      data: validatedFields.data,
    });

    return NextResponse.json({
      project,
      message: "Proyek berhasil diperbarui",
    });
  } catch (error: any) {
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Update project error:", error);
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
    await requireProjectAccess(params.id, user.id, "ADMIN");

    await prisma.project.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Proyek berhasil dihapus" });
  } catch (error: any) {
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Delete project error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}