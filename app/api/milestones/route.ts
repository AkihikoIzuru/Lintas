import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/milestones - List milestones
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = {
      project: {
        members: { some: { userId: session.user.id } },
      },
    };

    if (projectId) where.projectId = projectId;

    const [milestones, total] = await Promise.all([
      prisma.milestone.findMany({
        where,
        include: {
          project: { select: { id: true, name: true, key: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { dueDate: "asc" },
        take: limit,
        skip: offset,
      }),
      prisma.milestone.count({ where }),
    ]);

    return NextResponse.json({
      milestones,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error("Error fetching milestones:", error);
    return NextResponse.json(
      { error: "Failed to fetch milestones" },
      { status: 500 }
    );
  }
}

// POST /api/milestones - Create milestone
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, dueDate, projectId } = await req.json();

    if (!name || !dueDate || !projectId) {
      return NextResponse.json(
        { error: "Missing required fields: name, dueDate, projectId" },
        { status: 400 }
      );
    }

    // Verify project access
    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: session.user.id, projectId } },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const milestone = await prisma.milestone.create({
      data: {
        name,
        description,
        dueDate: new Date(dueDate),
        projectId,
        createdById: session.user.id,
      },
      include: {
        project: { select: { id: true, name: true, key: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ milestone });
  } catch (error) {
    console.error("Error creating milestone:", error);
    return NextResponse.json(
      { error: "Failed to create milestone" },
      { status: 500 }
    );
  }
}