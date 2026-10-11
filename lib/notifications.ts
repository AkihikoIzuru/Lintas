import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  data,
}: CreateNotificationParams) {
  try {
    // Check if user has this notification type enabled for in_app
    const setting = await prisma.notificationSetting.findUnique({
      where: {
        userId_channel_eventType: {
          userId,
          channel: "in_app",
          eventType: type,
        },
      },
    });

    // If setting exists and is disabled, don't create notification
    if (setting && !setting.enabled) {
      return null;
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data ? JSON.parse(JSON.stringify(data)) : null,
      },
    });

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

export async function createBulkNotifications(notifications: CreateNotificationParams[]) {
  try {
    const validNotifications = [];

    for (const notif of notifications) {
      const setting = await prisma.notificationSetting.findUnique({
        where: {
          userId_channel_eventType: {
            userId: notif.userId,
            channel: "in_app",
            eventType: notif.type,
          },
        },
      });

      if (!setting || setting.enabled) {
        validNotifications.push({
          userId: notif.userId,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          data: notif.data ? JSON.parse(JSON.stringify(notif.data)) : null,
        });
      }
    }

    if (validNotifications.length === 0) {
      return [];
    }

    await prisma.notification.createMany({
      data: validNotifications,
    });

    return validNotifications;
  } catch (error) {
    console.error("Error creating bulk notifications:", error);
    return [];
  }
}

// Helper functions for common notification scenarios

export async function notifyTaskAssigned(taskId: string, userId: string, assignedByUserId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: { select: { name: true, key: true } },
      creator: { select: { name: true } },
    },
  });

  if (!task) return null;

  const assignedByUser = await prisma.user.findUnique({
    where: { id: assignedByUserId },
    select: { name: true, email: true },
  });

  return createNotification({
    userId,
    type: "ASSIGNED",
    title: "Tugas Baru Ditugaskan",
    message: `${assignedByUser?.name || "Seseorang"} menugaskan Anda ke "${task.title}"`,
    data: {
      taskId: task.id,
      projectId: task.projectId,
      projectKey: task.project.key,
    },
  });
}

export async function notifyTaskMentioned(taskId: string, userId: string, mentionedByUserId: string, commentId: string) {
  const [task, mentionedByUser] = await Promise.all([
    prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { name: true, key: true } } },
    }),
    prisma.user.findUnique({
      where: { id: mentionedByUserId },
      select: { name: true, email: true },
    }),
  ]);

  if (!task) return null;

  return createNotification({
    userId,
    type: "MENTIONED",
    title: "Anda Disebutkan",
    message: `${mentionedByUser?.name || "Seseorang"} menyebutkan Anda di "${task.title}"`,
    data: {
      taskId: task.id,
      projectId: task.projectId,
      projectKey: task.project.key,
      commentId,
    },
  });
}

export async function notifyTaskCommented(taskId: string, userId: string, commentedByUserId: string, commentId: string) {
  const [task, commentedByUser] = await Promise.all([
    prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { name: true, key: true } } },
    }),
    prisma.user.findUnique({
      where: { id: commentedByUserId },
      select: { name: true, email: true },
    }),
  ]);

  if (!task) return null;

  return createNotification({
    userId,
    type: "COMMENTED",
    title: "Komentar Baru",
    message: `${commentedByUser?.name || "Seseorang"} berkomentar di "${task.title}"`,
    data: {
      taskId: task.id,
      projectId: task.projectId,
      projectKey: task.project.key,
      commentId,
    },
  });
}

export async function notifyTaskDueSoon(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: { select: { name: true, key: true } },
      assignees: { include: { user: { select: { id: true } } } },
    },
  });

  if (!task || !task.assignees.length) return [];

  const notifications = task.assignees.map(assignee =>
    createNotification({
      userId: assignee.user.id,
      type: "DUE_SOON",
      title: "Tugas Segera Jatuh Tempo",
      message: `"${task.title}" akan jatuh tempo segera`,
      data: {
        taskId: task.id,
        projectId: task.projectId,
        projectKey: task.project.key,
        dueDate: task.dueDate,
      },
    })
  );

  return Promise.all(notifications);
}

export async function notifyTaskOverdue(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: { select: { name: true, key: true } },
      assignees: { include: { user: { select: { id: true } } } },
    },
  });

  if (!task || !task.assignees.length) return [];

  const notifications = task.assignees.map(assignee =>
    createNotification({
      userId: assignee.user.id,
      type: "OVERDUE",
      title: "Tugas Terlambat",
      message: `"${task.title}" sudah melewati batas waktu`,
      data: {
        taskId: task.id,
        projectId: task.projectId,
        projectKey: task.project.key,
        dueDate: task.dueDate,
      },
    })
  );

  return Promise.all(notifications);
}

export async function notifySprintStarting(sprintId: string) {
  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    include: {
      workspace: { select: { id: true, name: true } },
      project: { select: { id: true, name: true, key: true } },
    },
  });

  if (!sprint) return [];

  // Get all workspace members
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: sprint.workspaceId },
    select: { userId: true },
  });

  const notifications = members.map(member =>
    createNotification({
      userId: member.userId,
      type: "SPRINT_STARTING",
      title: "Sprint Akan Dimulai",
      message: `Sprint "${sprint.name}" akan dimulai besok`,
      data: {
        sprintId: sprint.id,
        workspaceId: sprint.workspaceId,
        projectId: sprint.projectId,
      },
    })
  );

  return Promise.all(notifications);
}

export async function notifySprintEnding(sprintId: string) {
  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    include: {
      workspace: { select: { id: true, name: true } },
      project: { select: { id: true, name: true, key: true } },
    },
  });

  if (!sprint) return [];

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: sprint.workspaceId },
    select: { userId: true },
  });

  const notifications = members.map(member =>
    createNotification({
      userId: member.userId,
      type: "SPRINT_ENDING",
      title: "Sprint Akan Berakhir",
      message: `Sprint "${sprint.name}" akan berakhir besok`,
      data: {
        sprintId: sprint.id,
        workspaceId: sprint.workspaceId,
        projectId: sprint.projectId,
      },
    })
  );

  return Promise.all(notifications);
}