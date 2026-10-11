import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/project-templates/[id]/use - Track template usage and return template data
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const template = await prisma.projectTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Check access
    const hasAccess = template.isPublic ||
      (template.workspaceId && await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: session.user.id, workspaceId: template.workspaceId } },
      }));

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Track usage
    await prisma.templateUsage.create({
      data: {
        templateId: id,
        templateType: "project",
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      columns: template.columns,
      labels: template.labels,
    });
  } catch (error) {
    console.error("Error using project template:", error);
    return NextResponse.json(
      { error: "Failed to use template" },
      { status: 500 }
    );
  }
}