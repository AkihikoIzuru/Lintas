import { NextResponse } from "next/server";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { createSprintSchema } from "@/lib/validations";

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const projectId = searchParams.get("projectId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID diperlukan" },
        { status: 400 }
      );
    }

    await requireWorkspaceAccess(workspaceId, user.id);

    const sprints = await prisma.sprint.findMany({
      where: {
        workspaceId,
        ...(projectId && { projectId }),
      },
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
          select: {
            tasks: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({ sprints });
  } catch (error: any) {
    console.error("Get sprints error:", error);
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
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

    const validatedFields = createSprintSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Data tidak valid", issues: validatedFields.error.issues },
        { status: 400 }
      );
    }

    const { name, goal, startDate, endDate, projectId, workspaceId } = validatedFields.data;

    // Verify workspace access
    await requireWorkspaceAccess(workspaceId, user.id, "MEMBER");

    // If projectId provided, verify project access
    if (projectId) {
      await requireWorkspaceAccess(workspaceId, user.id, "MEMBER");
      // Additional check: project belongs to workspace
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { workspaceId: true },
      });
      if (!project || project.workspaceId !== workspaceId) {
        return NextResponse.json(
          { error: "Proyek tidak valid untuk workspace ini" },
          { status: 400 }
        );
      }
    }

    // Deactivate other active sprints in the same project/workspace
    await prisma.sprint.updateMany({
      where: {
        isActive: true,
        ...(projectId ? { projectId } : { workspaceId, projectId: null }),
      },
      data: { isActive: false },
    });

    const sprint = await prisma.sprint.create({
      data: {
        name,
        goal,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        projectId: projectId || null,
        workspaceId,
      },
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

    return NextResponse.json(
      { sprint, message: "Sprint berhasil dibuat" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create sprint error:", error);
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}