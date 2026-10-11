import { NextResponse } from "next/server";
import { requireAuth, requireProjectAccess } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { createColumnSchema } from "@/lib/validations";
import { generateKeyBetween } from "@/lib/fractional-indexing";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    await requireProjectAccess(params.id, user.id, "MEMBER");

    const body = await request.json();
    const validatedFields = createColumnSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Data tidak valid", issues: validatedFields.error.issues },
        { status: 400 }
      );
    }

    // Get last column in project to generate position
    const lastColumn = await prisma.column.findFirst({
      where: { projectId: params.id },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const position = parseFloat(
      generateKeyBetween(
        lastColumn ? lastColumn.position.toString() : null,
        null
      )
    );

    const column = await prisma.column.create({
      data: {
        ...validatedFields.data,
        position,
        projectId: params.id,
      },
      include: {
        tasks: {
          where: { isArchived: false },
          orderBy: { position: "asc" },
        },
      },
    });

    return NextResponse.json(
      { column, message: "Kolom berhasil dibuat" },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Create column error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}