import { formatDate, formatDateTime, formatRelativeTime } from "@/lib/utils";

export const PRIORITY_LABELS = {
  URGENT: "Mendesak",
  HIGH: "Tinggi",
  MEDIUM: "Sedang",
  LOW: "Rendah",
} as const;

export const PRIORITY_COLORS = {
  URGENT: "#EF4444",
  HIGH: "#F97316",
  MEDIUM: "#3B82F6",
  LOW: "#22C55E",
} as const;

export const STATUS_LABELS = {
  BACKLOG: "Backlog",
  TODO: "Siap",
  IN_PROGRESS: "Dalam Proses",
  IN_REVIEW: "Review",
  DONE: "Selesai",
} as const;

export const ROLE_LABELS = {
  OWNER: "Pemilik",
  ADMIN: "Admin",
  MEMBER: "Anggota",
  VIEWER: "Penampil",
} as const;

export const ROLE_HIERARCHY = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
} as const;

export function hasPermission(userRole: keyof typeof ROLE_HIERARCHY, requiredRole: keyof typeof ROLE_HIERARCHY): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canManageWorkspace(userRole: keyof typeof ROLE_HIERARCHY): boolean {
  return hasPermission(userRole, "ADMIN");
}

export function canManageProject(userRole: keyof typeof ROLE_HIERARCHY): boolean {
  return hasPermission(userRole, "MEMBER");
}

export function canViewWorkspace(userRole: keyof typeof ROLE_HIERARCHY): boolean {
  return hasPermission(userRole, "VIEWER");
}

export function formatIdnDate(date: Date | string): string {
  return formatDate(date, "id-ID");
}

export function formatIdnDateTime(date: Date | string): string {
  return formatDateTime(date, "id-ID");
}

export function formatIdnRelativeTime(date: Date | string): string {
  return formatRelativeTime(date, "id-ID");
}

export const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

export const DATETIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

export function getPriorityColor(priority: keyof typeof PRIORITY_COLORS): string {
  return PRIORITY_COLORS[priority] || PRIORITY_COLORS.MEDIUM;
}

export function getStatusLabel(status: keyof typeof STATUS_LABELS): string {
  return STATUS_LABELS[status] || status;
}

export function getRoleLabel(role: keyof typeof ROLE_LABELS): string {
  return ROLE_LABELS[role] || role;
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `Ukuran file melebihi ${MAX_FILE_SIZE / 1024 / 1024}MB` };
  }
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: "Tipe file tidak diizinkan" };
  }
  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const KEYBOARD_SHORTCUTS = {
  NEW_TASK: "c",
  SEARCH: "k",
  COMMAND_PALETTE: "k",
  BOARD_VIEW: "1",
  LIST_VIEW: "2",
  CALENDAR_VIEW: "3",
  TIMELINE_VIEW: "4",
  OPEN_TASK: "Enter",
  CLOSE_MODAL: "Escape",
  TOGGLE_SIDEBAR: "b",
  NEXT_COLUMN: "ArrowRight",
  PREV_COLUMN: "ArrowLeft",
} as const;

export function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
}

export function getShortcutDisplay(shortcut: string): string {
  if (isMac()) {
    return shortcut.replace("Ctrl", "⌘").replace("Shift", "⇧").replace("Alt", "⌥");
  }
  return shortcut;
}

export const TEMPLATES = [
  {
    id: "software-sprint",
    name: "Software Sprint",
    description: "Template untuk tim pengembangan software dengan sprint 2 minggu",
    icon: "code",
    color: "#3B82F6",
    columns: [
      { name: "Backlog", status: "BACKLOG" },
      { name: "Siap Sprint", status: "TODO" },
      { name: "Dalam Proses", status: "IN_PROGRESS" },
      { name: "Code Review", status: "IN_REVIEW" },
      { name: "Selesai", status: "DONE" },
    ],
    labels: [
      { name: "Bug", color: "#EF4444" },
      { name: "Feature", color: "#3B82F6" },
      { name: "Tech Debt", color: "#F97316" },
      { name: "Documentation", color: "#22C55E" },
    ],
  },
  {
    id: "marketing-campaign",
    name: "Kampanye Pemasaran",
    description: "Template untuk kampanye pemasaran dan konten",
    icon: "megaphone",
    color: "#EC4899",
    columns: [
      { name: "Ide", status: "BACKLOG" },
      { name: "Direncanakan", status: "TODO" },
      { name: "Dalam Produksi", status: "IN_PROGRESS" },
      { name: "Review", status: "IN_REVIEW" },
      { name: "Dipublikasikan", status: "DONE" },
    ],
    labels: [
      { name: "Konten", color: "#EC4899" },
      { name: "Iklan", color: "#F97316" },
      { name: "SEO", color: "#3B82F6" },
      { name: "Social Media", color: "#22C55E" },
    ],
  },
  {
    id: "personal-todo",
    name: "Daftar Tugas Pribadi",
    description: "Template sederhana untuk manajemen tugas pribadi",
    icon: "user",
    color: "#8B5CF6",
    columns: [
      { name: "Nanti", status: "BACKLOG" },
      { name: "Hari Ini", status: "TODO" },
      { name: "Sedang Dikerjakan", status: "IN_PROGRESS" },
      { name: "Menunggu", status: "IN_REVIEW" },
      { name: "Selesai", status: "DONE" },
    ],
    labels: [
      { name: "Pribadi", color: "#8B5CF6" },
      { name: "Kerja", color: "#3B82F6" },
      { name: "Belanja", color: "#22C55E" },
      { name: "Kesehatan", color: "#EF4444" },
    ],
  },
] as const;