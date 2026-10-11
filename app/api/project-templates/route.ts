import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/project-templates - List project templates
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");
    const isPublic = searchParams.get("isPublic");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = {
      OR: [
        { workspace: { members: { some: { userId: session.user.id } } } },
        { isPublic: true },
      ],
    };

    if (workspaceId) where.workspaceId = workspaceId;
    if (isPublic !== null) where.isPublic = isPublic === "true";

    const [templates, total] = await Promise.all([
      prisma.projectTemplate.findMany({
        where,
        include: {
          workspace: { select: { id: true, name: true, slug: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.projectTemplate.count({ where }),
    ]);

    return NextResponse.json({
      templates,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error("Error fetching project templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch project templates" },
      { status: 500 }
    );
  }
}

// POST /api/project-templates - Create project template
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, columns, labels, workspaceId, isPublic = false } = await req.json();

    if (!name || !columns || !workspaceId) {
      return NextResponse.json(
        { error: "Missing required fields: name, columns, workspaceId" },
        { status: 400 }
      );
    }

    // Verify workspace access
    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: session.user.id, workspaceId } },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const template = await prisma.projectTemplate.create({
      data: {
        name,
        description,
        columns,
        labels,
        workspaceId,
        isPublic,
        createdById: session.user.id,
      },
      include: {
        workspace: { select: { id: true, name: true, slug: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error creating project template:", error);
    return NextResponse.json(
      { error: "Failed to create project template" },
      { status: 500 }
    );
  }
}