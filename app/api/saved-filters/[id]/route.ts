import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const filter = await prisma.savedFilter.findUnique({
      where: { id: params.id },
    });

    if (!filter) {
      return NextResponse.json(
        { error: "Filter tidak ditemukan" },
        { status: 404 }
      );
    }

    if (filter.userId !== user.id) {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    await prisma.savedFilter.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Filter berhasil dihapus" });
  } catch (error: any) {
    console.error("Delete saved filter error:", error);
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

    const filter = await prisma.savedFilter.findUnique({
      where: { id: params.id },
    });

    if (!filter) {
      return NextResponse.json(
        { error: "Filter tidak ditemukan" },
        { status: 404 }
      );
    }

    if (filter.userId !== user.id) {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    // Set as default - unset other defaults first
    await prisma.savedFilter.updateMany({
      where: {
        userId: user.id,
        ...(filter.projectId && { projectId: filter.projectId }),
        ...(filter.workspaceId && { workspaceId: filter.workspaceId }),
      },
      data: { isDefault: false },
    });

    const updatedFilter = await prisma.savedFilter.update({
      where: { id: params.id },
      data: { isDefault: true },
    });

    return NextResponse.json({
      filter: updatedFilter,
      message: "Filter default berhasil diatur",
    });
  } catch (error: any) {
    console.error("Update saved filter error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}