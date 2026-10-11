import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      theme: true,
      locale: true,
      createdAt: true,
    },
  });

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function checkWorkspaceAccess(workspaceId: string, userId: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  return member;
}

export async function requireWorkspaceAccess(workspaceId: string, userId: string, minRole?: Role) {
  const member = await checkWorkspaceAccess(workspaceId, userId);

  if (!member) {
    throw new Error("Forbidden: Not a workspace member");
  }

  if (minRole) {
    const roleHierarchy: Record<Role, number> = {
      OWNER: 4,
      ADMIN: 3,
      MEMBER: 2,
      VIEWER: 1,
    };

    if (roleHierarchy[member.role] < roleHierarchy[minRole]) {
      throw new Error(`Forbidden: Requires ${minRole} role`);
    }
  }

  return member;
}

export async function checkProjectAccess(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      workspace: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
    },
  });

  if (!project) {
    return null;
  }

  const workspaceMember = project.workspace.members[0];

  if (!workspaceMember) {
    return null;
  }

  return { project, role: workspaceMember.role };
}

export async function requireProjectAccess(projectId: string, userId: string, minRole?: Role) {
  const access = await checkProjectAccess(projectId, userId);

  if (!access) {
    throw new Error("Forbidden: Not a project member");
  }

  if (minRole) {
    const roleHierarchy: Record<Role, number> = {
      OWNER: 4,
      ADMIN: 3,
      MEMBER: 2,
      VIEWER: 1,
    };

    if (roleHierarchy[access.role] < roleHierarchy[minRole]) {
      throw new Error(`Forbidden: Requires ${minRole} role`);
    }
  }

  return access;
}