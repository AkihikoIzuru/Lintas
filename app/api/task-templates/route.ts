import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/task-templates - List task templates
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const workspaceId = searchParams.get("workspaceId");
    const isPublic = searchParams.get("isPublic");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = {
      OR: [
        { project: { members: { some: { userId: session.user.id } } } },
        { workspace: { members: { some: { userId: session.user.id } } } },
        { isPublic: true },
      ],
    };

    if (projectId) where.projectId = projectId;
    if (workspaceId) where.workspaceId = workspaceId;
    if (isPublic !== null) where.isPublic = isPublic === "true";

    const [templates, total] = await Promise.all([
      prisma.taskTemplate.findMany({
        where,
        include: {
          project: { select: { id: true, name: true, key: true } },
          workspace: { select: { id: true, name: true, slug: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.taskTemplate.count({ where }),
    ]);

    return NextResponse.json({
      templates,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error("Error fetching task templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch task templates" },
      { status: 500 }
    );
  }
}

// POST /api/task-templates - Create task template
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, templateData, projectId, workspaceId, isPublic = false } = await req.json();

    if (!name || !templateData) {
      return NextResponse.json(
        { error: "Missing required fields: name, templateData" },
        { status: 400 }
      );
    }

    // Verify access
    if (projectId) {
      const membership = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: session.user.id, projectId } },
      });
      if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (workspaceId) {
      const membership = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: session.user.id, workspaceId } },
      });
      if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const template = await prisma.taskTemplate.create({
      data: {
        name,
        description,
        templateData,
        projectId,
        workspaceId,
        isPublic,
        createdById: session.user.id,
      },
      include: {
        project: { select: { id: true, name: true, key: true } },
        workspace: { select: { id: true, name: true, slug: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error creating task template:", error);
    return NextResponse.json(
      { error: "Failed to create task template" },
      { status: 500 }
    );
  }
}