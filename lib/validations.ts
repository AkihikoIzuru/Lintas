import { z } from "zod";

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password minimal 8 karakter"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

// Workspace schemas
export const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Nama workspace minimal 2 karakter").max(100),
  slug: z.string().min(2, "Slug minimal 2 karakter").max(50).regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan dash"),
  description: z.string().max(500).optional(),
});

export const updateWorkspaceSchema = createWorkspaceSchema.partial();

export const inviteMemberSchema = z.object({
  email: z.string().email("Email tidak valid"),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
});

// Project schemas
export const createProjectSchema = z.object({
  name: z.string().min(2, "Nama proyek minimal 2 karakter").max(100),
  key: z.string().min(2, "Kunci proyek minimal 2 karakter").max(10).regex(/^[A-Z0-9]+$/, "Kunci hanya huruf besar dan angka"),
  description: z.string().max(1000).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#3B82F6"),
  icon: z.string().default("folder"),
});

export const updateProjectSchema = createProjectSchema.partial();

// Column schemas
export const createColumnSchema = z.object({
  name: z.string().min(1, "Nama kolom wajib diisi").max(50),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]),
  wipLimit: z.number().int().positive().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6B7280"),
});

export const updateColumnSchema = createColumnSchema.partial().extend({
  position: z.number().optional(),
});

// Task schemas
export const createTaskSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(200),
  description: z.string().max(10000).optional(),
  columnId: z.string().cuid(),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  dueDate: z.string().datetime().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  estimate: z.number().int().positive().optional(),
  assigneeIds: z.array(z.string().cuid()).optional(),
  labelIds: z.array(z.string().cuid()).optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string().cuid(),
  position: z.number().optional(),
  columnId: z.string().cuid().optional(),
  isArchived: z.boolean().optional(),
});

export const moveTaskSchema = z.object({
  taskId: z.string().cuid(),
  columnId: z.string().cuid(),
  position: z.number(),
});

// Subtask schemas
export const createSubtaskSchema = z.object({
  title: z.string().min(1, "Judul subtugas wajib diisi").max(200),
  taskId: z.string().cuid(),
  position: z.number().optional(),
});

export const updateSubtaskSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).max(200).optional(),
  completed: z.boolean().optional(),
  position: z.number().optional(),
});

// Comment schemas
export const createCommentSchema = z.object({
  content: z.string().min(1, "Komentar tidak boleh kosong").max(5000),
  taskId: z.string().cuid(),
  mentionUserIds: z.array(z.string().cuid()).optional(),
});

export const updateCommentSchema = z.object({
  id: z.string().cuid(),
  content: z.string().min(1).max(5000),
});

// Label schemas
export const createLabelSchema = z.object({
  name: z.string().min(1, "Nama label wajib diisi").max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6B7280"),
  projectId: z.string().cuid().optional(),
  workspaceId: z.string().cuid().optional(),
}).refine((data) => data.projectId || data.workspaceId, {
  message: "Harus memiliki projectId atau workspaceId",
});

export const updateLabelSchema = createLabelSchema.partial();

// Sprint schemas
export const createSprintSchema = z.object({
  name: z.string().min(1, "Nama sprint wajib diisi").max(100),
  goal: z.string().max(1000).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  projectId: z.string().cuid().optional(),
}).refine((data) => new Date(data.startDate) < new Date(data.endDate), {
  message: "Tanggal mulai harus sebelum tanggal akhir",
  path: ["startDate"],
});

export const updateSprintSchema = createSprintSchema.partial();

// Notification schemas
export const notificationPreferencesSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  desktopNotifications: z.boolean(),
  digestFrequency: z.enum(["never", "daily", "weekly"]),
});

// User settings schemas
export const updateUserSettingsSchema = z.object({
  theme: z.enum(["system", "light", "dark"]).optional(),
  locale: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  desktopNotifications: z.boolean().optional(),
  digestFrequency: z.enum(["never", "daily", "weekly"]).optional(),
  compactMode: z.boolean().optional(),
  sidebarCollapsed: z.boolean().optional(),
});

// Filter schemas
export const taskFilterSchema = z.object({
  assigneeIds: z.array(z.string().cuid()).optional(),
  labelIds: z.array(z.string().cuid()).optional(),
  priorities: z.array(z.enum(["URGENT", "HIGH", "MEDIUM", "LOW"])).optional(),
  statuses: z.array(z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"])).optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
  search: z.string().optional(),
  projectId: z.string().cuid().optional(),
  sprintId: z.string().cuid().optional(),
});

export const savedFilterSchema = z.object({
  name: z.string().min(1, "Nama filter wajib diisi").max(100),
  filters: taskFilterSchema,
  workspaceId: z.string().cuid().optional(),
  projectId: z.string().cuid().optional(),
  isDefault: z.boolean().optional(),
});

// CSV Import schemas
export const csvImportPreviewSchema = z.object({
  file: z.instanceof(File),
  projectId: z.string().cuid(),
  columnMapping: z.record(z.string()).optional(),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>;
export type UpdateSubtaskInput = z.infer<typeof updateSubtaskSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;
export type CreateSprintInput = z.infer<typeof createSprintSchema>;
export type UpdateSprintInput = z.infer<typeof updateSprintSchema>;
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;
export type TaskFilterInput = z.infer<typeof taskFilterSchema>;
export type SavedFilterInput = z.infer<typeof savedFilterSchema>;
export type CsvImportPreviewInput = z.infer<typeof csvImportPreviewSchema>;