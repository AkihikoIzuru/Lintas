import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@lintas.app" },
    update: {},
    create: {
      email: "demo@lintas.app",
      name: "Demo User",
      passwordHash: await bcrypt.hash("demo1234", 10),
      emailVerified: new Date(),
    },
  });

  console.log("✅ Created demo user:", demoUser.email);

  // Create demo workspace
  const demoWorkspace = await prisma.workspace.upsert({
    where: { slug: "demo-workspace" },
    update: {},
    create: {
      name: "Demo Workspace",
      slug: "demo-workspace",
      description: "Workspace demo untuk mencoba Lintas",
      ownerId: demoUser.id,
    },
  });

  console.log("✅ Created demo workspace:", demoWorkspace.name);

  // Add user as workspace member
  await prisma.workspaceMember.upsert({
    where: {
      userId_workspaceId: {
        userId: demoUser.id,
        workspaceId: demoWorkspace.id,
      },
    },
    update: {},
    create: {
      userId: demoUser.id,
      workspaceId: demoWorkspace.id,
      role: "OWNER",
    },
  });

  // Create demo project
  const demoProject = await prisma.project.upsert({
    where: {
      workspaceId_key: {
        workspaceId: demoWorkspace.id,
        key: "DEMO",
      },
    },
    update: {},
    create: {
      name: "Proyek Demo",
      key: "DEMO",
      description: "Proyek demo untuk mencoba fitur-fitur Lintas",
      color: "#3B82F6",
      icon: "rocket",
      workspaceId: demoWorkspace.id,
    },
  });

  console.log("✅ Created demo project:", demoProject.name);

  // Create columns
  const columns = [
    { name: "Backlog", status: "BACKLOG", position: 0, color: "#6B7280" },
    { name: "Siap", status: "TODO", position: 1, color: "#3B82F6" },
    { name: "Dalam Proses", status: "IN_PROGRESS", position: 2, color: "#F59E0B" },
    { name: "Review", status: "IN_REVIEW", position: 3, color: "#8B5CF6" },
    { name: "Selesai", status: "DONE", position: 4, color: "#10B981" },
  ];

  for (const col of columns) {
    await prisma.column.upsert({
      where: { status: col.status as any },
      update: {},
      create: {
        ...col,
        projectId: demoProject.id,
      },
    });
  }

  console.log("✅ Created 5 columns");

  // Create labels
  const labels = [
    { name: "Bug", color: "#EF4444" },
    { name: "Feature", color: "#3B82F6" },
    { name: "Dokumentasi", color: "#10B981" },
    { name: "Tech Debt", color: "#F97316" },
  ];

  for (const label of labels) {
    await prisma.label.upsert({
      where: {
        name_workspaceId_projectId: {
          name: label.name,
          workspaceId: demoWorkspace.id,
          projectId: demoProject.id,
        },
      },
      update: {},
      create: {
        ...label,
        workspaceId: demoWorkspace.id,
        projectId: demoProject.id,
      },
    });
  }

  console.log("✅ Created 4 labels");

  // Create demo tasks
  const backlogColumn = await prisma.column.findFirst({
    where: { status: "BACKLOG", projectId: demoProject.id },
  });

  const todoColumn = await prisma.column.findFirst({
    where: { status: "TODO", projectId: demoProject.id },
  });

  if (backlogColumn && todoColumn) {
    const tasks = [
      {
        title: "Setup repository dan CI/CD",
        description: "Inisialisasi git repository dan setup GitHub Actions untuk CI/CD pipeline",
        columnId: todoColumn.id,
        priority: "HIGH" as const,
        position: 1,
      },
      {
        title: "Desain sistem autentikasi",
        description: "Membuat desain sistem autentikasi menggunakan NextAuth.js",
        columnId: todoColumn.id,
        priority: "HIGH" as const,
        position: 2,
      },
      {
        title: "Implementasi Kanban board",
        description: "Membuat komponen board dengan drag-and-drop menggunakan dnd-kit",
        columnId: backlogColumn.id,
        priority: "MEDIUM" as const,
        position: 1,
      },
      {
        title: "Buat halaman dashboard",
        description: "Dashboard dengan chart progress dan aktivitas terbaru",
        columnId: backlogColumn.id,
        priority: "MEDIUM" as const,
        position: 2,
      },
      {
        title: "Tulis dokumentasi API",
        description: "Dokumentasi lengkap untuk semua API endpoints",
        columnId: backlogColumn.id,
        priority: "LOW" as const,
        position: 3,
      },
    ];

    for (const task of tasks) {
      await prisma.task.create({
        data: {
          ...task,
          projectId: demoProject.id,
          creatorId: demoUser.id,
          updaterId: demoUser.id,
        },
      });
    }

    console.log("✅ Created 5 demo tasks");
  }

  console.log("🎉 Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });