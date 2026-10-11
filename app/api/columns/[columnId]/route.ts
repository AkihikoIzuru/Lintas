import { NextResponse } from "next/server";
import { requireAuth, requireProjectAccess } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { updateColumnSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: { columnId: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const column = await prisma.column.findUnique({
      where: { id: params.columnId },
      select: { projectId: true },
    });

    if (!column) {
      return NextResponse.json(
        { error: "Kolom tidak ditemukan" },
        { status: 404 }
      );
    }

    await requireProjectAccess(column.projectId, user.id, "MEMBER");

    const validatedFields = updateColumnSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Data tidak valid", issues: validatedFields.error.issues },
        { status: 400 }
      );
    }

    const updatedColumn = await prisma.column.update({
      where: { id: params.columnId },
      data: validatedFields.data,
    });

    return NextResponse.json({
      column: updatedColumn,
      message: "Kolom berhasil diperbarui",
    });
  } catch (error: any) {
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Update column error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { columnId: string } }
) {
  try {
    const user = await requireAuth();

    const column = await prisma.column.findUnique({
      where: { id: params.columnId },
      select: { projectId: true, _count: { select: { tasks: true } } },
    });

    if (!column) {
      return NextResponse.json(
        { error: "Kolom tidak ditemukan" },
        { status: 404 }
      );
    }

    await requireProjectAccess(column.projectId, user.id, "ADMIN");

    if (column._count.tasks > 0) {
      return NextResponse.json(
        { error: "Tidak bisa menghapus kolom yang masih memiliki tugas" },
        { status: 400 }
      );
    }

    await prisma.column.delete({
      where: { id: params.columnId },
    });

    return NextResponse.json({ message: "Kolom berhasil dihapus" });
  } catch (error: any) {
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Delete column error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}