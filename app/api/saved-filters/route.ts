import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { savedFilterSchema } from "@/lib/validations";

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const workspaceId = searchParams.get("workspaceId");

    const filters = await prisma.savedFilter.findMany({
      where: {
        userId: user.id,
        ...(projectId && { projectId }),
        ...(workspaceId && { workspaceId }),
      },
      orderBy: [
        { isDefault: "desc" },
        { updatedAt: "desc" },
      ],
    });

    return NextResponse.json({ filters });
  } catch (error: any) {
    console.error("Get saved filters error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const validatedFields = savedFilterSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Data tidak valid", issues: validatedFields.error.issues },
        { status: 400 }
      );
    }

    const { name, filters, projectId, workspaceId, isDefault } = validatedFields.data;

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.savedFilter.updateMany({
        where: {
          userId: user.id,
          ...(projectId && { projectId }),
          ...(workspaceId && { workspaceId }),
        },
        data: { isDefault: false },
      });
    }

    const savedFilter = await prisma.savedFilter.create({
      data: {
        name,
        filters,
        userId: user.id,
        projectId: projectId || null,
        workspaceId: workspaceId || null,
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json(
      { filter: savedFilter, message: "Filter berhasil disimpan" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create saved filter error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
