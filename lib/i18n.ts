export const i18n = {
  id: {
    // Common
    common: {
      save: "Simpan",
      cancel: "Batal",
      delete: "Hapus",
      edit: "Edit",
      create: "Buat",
      update: "Perbarui",
      close: "Tutup",
      back: "Kembali",
      next: "Lanjut",
      previous: "Sebelumnya",
      search: "Cari",
      filter: "Filter",
      sort: "Urutkan",
      loading: "Memuat...",
      error: "Terjadi kesalahan",
      success: "Berhasil",
      confirm: "Konfirmasi",
      yes: "Ya",
      no: "Tidak",
    },

    // Auth
    auth: {
      login: "Masuk",
      logout: "Keluar",
      register: "Daftar",
      email: "Email",
      password: "Password",
      confirmPassword: "Konfirmasi Password",
      forgotPassword: "Lupa Password?",
      resetPassword: "Reset Password",
      rememberMe: "Ingat Saya",
      alreadyHaveAccount: "Sudah punya akun?",
      dontHaveAccount: "Belum punya akun?",
      emailRequired: "Email wajib diisi",
      passwordRequired: "Password wajib diisi",
      passwordMinLength: "Password minimal 8 karakter",
      passwordsDontMatch: "Password tidak cocok",
      invalidCredentials: "Email atau password salah",
      emailAlreadyExists: "Email sudah terdaftar",
    },

    // Workspace
    workspace: {
      workspace: "Workspace",
      workspaces: "Workspaces",
      createWorkspace: "Buat Workspace",
      workspaceName: "Nama Workspace",
      workspaceSlug: "Slug",
      workspaceDescription: "Deskripsi",
      members: "Anggota",
      inviteMember: "Undang Anggota",
      role: "Peran",
      owner: "Pemilik",
      admin: "Admin",
      member: "Anggota",
      viewer: "Penampil",
    },

    // Project
    project: {
      project: "Proyek",
      projects: "Proyek",
      createProject: "Buat Proyek",
      projectName: "Nama Proyek",
      projectKey: "Kunci Proyek",
      projectDescription: "Deskripsi Proyek",
      projectColor: "Warna",
      projectIcon: "Ikon",
      archived: "Diarsipkan",
      archive: "Arsipkan",
      restore: "Pulihkan",
    },

    // Task
    task: {
      task: "Tugas",
      tasks: "Tugas",
      createTask: "Buat Tugas",
      taskTitle: "Judul Tugas",
      taskDescription: "Deskripsi",
      assignee: "Ditugaskan ke",
      assignees: "Ditugaskan ke",
      priority: "Prioritas",
      dueDate: "Tenggat",
      estimate: "Estimasi",
      labels: "Label",
      subtasks: "Subtugas",
      comments: "Komentar",
      attachments: "Lampiran",
      activity: "Aktivitas",
      urgent: "Mendesak",
      high: "Tinggi",
      medium: "Sedang",
      low: "Rendah",
      backlog: "Backlog",
      todo: "Siap",
      inProgress: "Dalam Proses",
      inReview: "Review",
      done: "Selesai",
    },

    // Sprint
    sprint: {
      sprint: "Sprint",
      sprints: "Sprints",
      createSprint: "Buat Sprint",
      sprintName: "Nama Sprint",
      sprintGoal: "Tujuan Sprint",
      startDate: "Tanggal Mulai",
      endDate: "Tanggal Selesai",
      active: "Aktif",
      completed: "Selesai",
      burndown: "Burndown Chart",
    },

    // Views
    views: {
      board: "Board",
      list: "List",
      calendar: "Kalender",
      timeline: "Timeline",
    },

    // Notifications
    notifications: {
      notifications: "Notifikasi",
      markAllRead: "Tandai Semua Sudah Dibaca",
      noNotifications: "Tidak ada notifikasi",
      assigned: "Anda ditugaskan ke",
      mentioned: "Anda disebutkan di",
      commented: "berkomentar di",
      dueSoon: "Tugas akan jatuh tempo",
      overdue: "Tugas lewat tenggat",
    },

    // Settings
    settings: {
      settings: "Pengaturan",
      profile: "Profil",
      appearance: "Tampilan",
      notifications: "Notifikasi",
      theme: "Tema",
      language: "Bahasa",
      lightMode: "Mode Terang",
      darkMode: "Mode Gelap",
      systemMode: "Ikuti Sistem",
    },

    // Errors
    errors: {
      notFound: "Tidak ditemukan",
      unauthorized: "Tidak diizinkan",
      forbidden: "Akses ditolak",
      serverError: "Kesalahan server",
      networkError: "Kesalahan jaringan",
      tryAgain: "Coba lagi",
    },
  },

  en: {
    // Common
    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      create: "Create",
      update: "Update",
      close: "Close",
      back: "Back",
      next: "Next",
      previous: "Previous",
      search: "Search",
      filter: "Filter",
      sort: "Sort",
      loading: "Loading...",
      error: "An error occurred",
      success: "Success",
      confirm: "Confirm",
      yes: "Yes",
      no: "No",
    },

    // Auth
    auth: {
      login: "Login",
      logout: "Logout",
      register: "Register",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      forgotPassword: "Forgot Password?",
      resetPassword: "Reset Password",
      rememberMe: "Remember Me",
      alreadyHaveAccount: "Already have an account?",
      dontHaveAccount: "Don't have an account?",
      emailRequired: "Email is required",
      passwordRequired: "Password is required",
      passwordMinLength: "Password must be at least 8 characters",
      passwordsDontMatch: "Passwords don't match",
      invalidCredentials: "Invalid email or password",
      emailAlreadyExists: "Email already registered",
    },

    // Add more English translations as needed...
  },
} as const;

export type Locale = keyof typeof i18n;
export type TranslationKey = keyof typeof i18n.id;

export function t(locale: Locale, key: string): string {
  const keys = key.split(".");
  let value: any = i18n[locale];

  for (const k of keys) {
    value = value?.[k];
  }

  return value || key;
}