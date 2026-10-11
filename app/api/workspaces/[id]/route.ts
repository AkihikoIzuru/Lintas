import { NextResponse } from "next/server";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { updateWorkspaceSchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    await requireWorkspaceAccess(params.id, user.id);

    const workspace = await prisma.workspace.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        members: {
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
          orderBy: {
            joinedAt: "asc",
          },
        },
        projects: {
          where: {
            isArchived: false,
          },
          orderBy: {
            updatedAt: "desc",
          },
        },
        _count: {
          select: {
            members: true,
            projects: true,
          },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ workspace });
  } catch (error: any) {
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Get workspace error:", error);
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
    await requireWorkspaceAccess(params.id, user.id, "ADMIN");

    const body = await request.json();
    const validatedFields = updateWorkspaceSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Data tidak valid", issues: validatedFields.error.issues },
        { status: 400 }
      );
    }

    const workspace = await prisma.workspace.update({
      where: { id: params.id },
      data: validatedFields.data,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      workspace,
      message: "Workspace berhasil diperbarui",
    });
  } catch (error: any) {
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Update workspace error:", error);
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
    await requireWorkspaceAccess(params.id, user.id, "OWNER");

    await prisma.workspace.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Workspace berhasil dihapus" });
  } catch (error: any) {
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Delete workspace error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}