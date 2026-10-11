import { NextResponse } from "next/server";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { createProjectSchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await requireAuth();

    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.slug },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace tidak ditemukan" },
        { status: 404 }
      );
    }

    await requireWorkspaceAccess(workspace.id, user.id);

    const projects = await prisma.project.findMany({
      where: {
        workspaceId: workspace.id,
        isArchived: false,
      },
      include: {
        _count: {
          select: {
            tasks: true,
            columns: true,
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({ projects, workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug } });
  } catch (error: any) {
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Get projects error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await requireAuth();

    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.slug },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace tidak ditemukan" },
        { status: 404 }
      );
    }

    await requireWorkspaceAccess(workspace.id, user.id, "MEMBER");

    const body = await request.json();
    const validatedFields = createProjectSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Data tidak valid", issues: validatedFields.error.issues },
        { status: 400 }
      );
    }

    const { name, key, description, color, icon } = validatedFields.data;

    // Check if key already exists in workspace
    const existingProject = await prisma.project.findUnique({
      where: {
        workspaceId_key: {
          workspaceId: workspace.id,
          key,
        },
      },
    });

    if (existingProject) {
      return NextResponse.json(
        { error: "Kunci proyek sudah digunakan di workspace ini" },
        { status: 400 }
      );
    }

    // Create project with default columns
    const project = await prisma.project.create({
      data: {
        name,
        key,
        description,
        color,
        icon,
        workspaceId: workspace.id,
        columns: {
          create: [
            { name: "Backlog", status: "BACKLOG", position: 0, color: "#6B7280" },
            { name: "Siap", status: "TODO", position: 1, color: "#3B82F6" },
            { name: "Dalam Proses", status: "IN_PROGRESS", position: 2, color: "#F59E0B" },
            { name: "Review", status: "IN_REVIEW", position: 3, color: "#8B5CF6" },
            { name: "Selesai", status: "DONE", position: 4, color: "#10B981" },
          ],
        },
      },
      include: {
        columns: {
          orderBy: { position: "asc" },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    return NextResponse.json(
      { project, message: "Proyek berhasil dibuat" },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Create project error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}