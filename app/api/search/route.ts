import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "all"; // all, tasks, projects, comments
    const workspaceId = searchParams.get("workspaceId");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results: any = {
      tasks: [],
      projects: [],
      comments: [],
    };

    // Get user's accessible workspaces
    const userWorkspaces = await prisma.workspaceMember.findMany({
      where: { userId: user.id },
      select: { workspaceId: true },
    });
    const workspaceIds = userWorkspaces.map((w) => w.workspaceId);

    const whereWorkspace = workspaceId
      ? { workspaceId }
      : { workspaceId: { in: workspaceIds } };

    // Search tasks
    if (type === "all" || type === "tasks") {
      const tasks = await prisma.task.findMany({
        where: {
          project: whereWorkspace,
          isArchived: false,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              key: true,
              color: true,
              workspace: { select: { id: true, name: true, slug: true } },
            },
          },
          column: { select: { id: true, name: true, status: true } },
          assignees: {
            include: {
              user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            },
          },
          labels: {
            include: { label: { select: { id: true, name: true, color: true } } },
          },
        },
        take: limit,
        orderBy: { updatedAt: "desc" },
      });
      results.tasks = tasks;
    }

    // Search projects
    if (type === "all" || type === "projects") {
      const projects = await prisma.project.findMany({
        where: {
          ...whereWorkspace,
          isArchived: false,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { key: { contains: query, mode: "insensitive" } },
          ],
        },
        include: {
          workspace: { select: { id: true, name: true, slug: true } },
          _count: { select: { tasks: true } },
        },
        take: limit,
        orderBy: { updatedAt: "desc" },
      });
      results.projects = projects;
    }

    // Search comments
    if (type === "all" || type === "comments") {
      const comments = await prisma.comment.findMany({
        where: {
          task: {
            project: whereWorkspace,
            isArchived: false,
          },
          content: { contains: query, mode: "insensitive" },
        },
        include: {
          author: { select: { id: true, name: true, email: true, avatarUrl: true } },
          task: {
            select: {
              id: true,
              title: true,
              project: {
                select: {
                  id: true,
                  name: true,
                  key: true,
                  workspace: { select: { id: true, name: true, slug: true } },
                },
              },
            },
          },
        },
        take: limit,
        orderBy: { createdAt: "desc" },
      });
      results.comments = comments;
    }

    return NextResponse.json({
      query,
      results,
      total:
        results.tasks.length + results.projects.length + results.comments.length,
    });
  } catch (error: any) {
    console.error("Search error:", error);
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}