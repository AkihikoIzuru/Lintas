export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl?: string | null;
  theme?: string;
  locale?: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  joinedAt: Date;
  user?: User;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description?: string | null;
  color: string;
  icon: string;
  isArchived: boolean;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Column {
  id: string;
  name: string;
  status: "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
  position: number;
  wipLimit?: number | null;
  color: string;
  projectId: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  position: number;
  priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  dueDate?: Date | null;
  estimate?: number | null;
  timeSpent: number;
  isArchived: boolean;
  completedAt?: Date | null;
  projectId: string;
  columnId: string;
  creatorId: string;
  updaterId: string;
  createdAt: Date;
  updatedAt: Date;
  assignees?: TaskAssignee[];
  labels?: TaskLabel[];
  subtasks?: Subtask[];
  comments?: Comment[];
  attachments?: Attachment[];
}

export interface TaskAssignee {
  id: string;
  taskId: string;
  userId: string;
  assignedAt: Date;
  user?: User;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  workspaceId?: string | null;
  projectId?: string | null;
}

export interface TaskLabel {
  id: string;
  taskId: string;
  labelId: string;
  label?: Label;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  position: number;
  taskId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  author?: User;
  mentions?: Mention[];
}

export interface Mention {
  id: string;
  commentId: string;
  userId: string;
  taskId: string;
  createdAt: Date;
  user?: User;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  taskId: string;
  uploadedById: string;
  createdAt: Date;
  uploadedBy?: User;
}

export interface Activity {
  id: string;
  type: string;
  metadata?: any;
  taskId: string;
  userId: string;
  createdAt: Date;
  user?: User;
}

export interface Sprint {
  id: string;
  name: string;
  goal?: string | null;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isCompleted: boolean;
  workspaceId: string;
  projectId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  userId: string;
  createdAt: Date;
}

export interface SavedFilter {
  id: string;
  name: string;
  filters: any;
  userId: string;
  workspaceId?: string | null;
  projectId?: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type Role = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
export type TaskPriority = "URGENT" | "HIGH" | "MEDIUM" | "LOW";
export type TaskStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";