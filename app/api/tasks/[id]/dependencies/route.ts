import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: {
            id: true,
            workspaceId: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Tugas tidak ditemukan" },
        { status: 404 }
      );
    }

    // Verify access
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId: user.id, workspaceId: task.project.workspaceId },
      },
    });

    if (!workspaceMember) {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    // Get dependencies (tasks this task blocks)
    const dependencies = await prisma.taskDependency.findMany({
      where: { taskId: params.id },
      include: {
        dependsOnTask: {
          include: {
            column: { select: { name: true, status: true } },
            project: { select: { key: true } },
            assignees: {
              include: {
                user: { select: { id: true, name: true, email: true, avatarUrl: true } },
              },
            },
          },
        },
      },
    });

    // Get dependents (tasks that block this task)
    const dependents = await prisma.taskDependency.findMany({
      where: { dependsOnTaskId: params.id },
      include: {
        task: {
          include: {
            column: { select: { name: true, status: true } },
            project: { select: { key: true } },
            assignees: {
              include: {
                user: { select: { id: true, name: true, email: true, avatarUrl: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      dependencies: dependencies.map((d) => ({
        id: d.id,
        type: d.type,
        task: d.dependsOnTask,
      })),
      dependents: dependents.map((d) => ({
        id: d.id,
        type: d.type,
        task: d.task,
      })),
    });
  } catch (error: any) {
    console.error("Get dependencies error:", error);
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { dependsOnTaskId, type = "blocks" } = body;

    if (!dependsOnTaskId) {
      return NextResponse.json(
        { error: "ID tugas yang dibutuhkan diperlukan" },
        { status: 400 }
      );
    }

    if (dependsOnTaskId === params.id) {
      return NextResponse.json(
        { error: "Tugas tidak bisa bergantung pada dirinya sendiri" },
        { status: 400 }
      );
    }

    // Get both tasks
    const [task, dependsOnTask] = await Promise.all([
      prisma.task.findUnique({
        where: { id: params.id },
        include: { project: { select: { workspaceId: true } } },
      }),
      prisma.task.findUnique({
        where: { id: dependsOnTaskId },
        include: { project: { select: { workspaceId: true } } },
      }),
    ]);

    if (!task || !dependsOnTask) {
      return NextResponse.json(
        { error: "Tugas tidak ditemukan" },
        { status: 404 }
      );
    }

    // Verify access to both tasks
    const workspaceIds = [task.project.workspaceId, dependsOnTask.project.workspaceId];
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: {
        userId: user.id,
        workspaceId: { in: workspaceIds },
        role: { not: "VIEWER" },
      },
    });

    if (!workspaceMember) {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    // Check for circular dependency
    const visited = new Set<string>();
    const queue = [dependsOnTaskId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (currentId === params.id) {
        return NextResponse.json(
          { error: "Membuat dependensi sirkular tidak diizinkan" },
          { status: 400 }
        );
      }
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const deps = await prisma.taskDependency.findMany({
        where: { taskId: currentId },
        select: { dependsOnTaskId: true },
      });
      queue.push(...deps.map((d) => d.dependsOnTaskId));
    }

    // Create dependency
    const dependency = await prisma.taskDependency.create({
      data: {
        taskId: params.id,
        dependsOnTaskId,
        type,
      },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: "DEPENDENCY_ADDED",
        taskId: params.id,
        userId: user.id,
        metadata: { dependsOnTaskId, type },
      },
    });

    return NextResponse.json({ dependency, message: "Dependensi berhasil ditambahkan" });
  } catch (error: any) {
    console.error("Create dependency error:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Dependensi sudah ada" },
        { status: 409 }
      );
    }
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const dependencyId = searchParams.get("dependencyId");

    if (!dependencyId) {
      return NextResponse.json(
        { error: "Dependency ID diperlukan" },
        { status: 400 }
      );
    }

    const dependency = await prisma.taskDependency.findUnique({
      where: { id: dependencyId },
      include: {
        task: { include: { project: { select: { workspaceId: true } } } },
      },
    });

    if (!dependency) {
      return NextResponse.json(
        { error: "Dependensi tidak ditemukan" },
        { status: 404 }
      );
    }

    // Verify access
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: dependency.task.project.workspaceId,
        },
      },
    });

    if (!workspaceMember || workspaceMember.role === "VIEWER") {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    await prisma.taskDependency.delete({
      where: { id: dependencyId },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: "DEPENDENCY_REMOVED",
        taskId: dependency.taskId,
        userId: user.id,
        metadata: { dependsOnTaskId: dependency.dependsOnTaskId },
      },
    });

    return NextResponse.json({ message: "Dependensi berhasil dihapus" });
  } catch (error: any) {
    console.error("Delete dependency error:", error);
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}