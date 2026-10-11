import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { createTaskSchema } from "@/lib/validations";
import { generateKeyBetween } from "@/lib/fractional-indexing";

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const projectId = formData.get("projectId") as string;

    if (!file || !projectId) {
      return NextResponse.json(
        { error: "File dan projectId diperlukan" },
        { status: 400 }
      );
    }

    // Verify project access
    const projectAccess = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: user.id, projectId } },
    });

    if (!projectAccess || projectAccess.role === "VIEWER") {
      return NextResponse.json(
        { error: "Tidak memiliki akses ke proyek ini" },
        { status: 403 }
      );
    }

    // Get project columns for validation
    const columns = await prisma.column.findMany({
      where: { projectId },
      select: { id: true, name: true },
    });
    const columnIds = new Set(columns.map((c) => c.id));
    const columnNameToId = new Map(columns.map((c) => [c.name.toLowerCase(), c.id]));

    // Get project members for assignee validation
    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: { user: { select: { id: true, email: true } } },
    });
    const emailToUserId = new Map(
      members.map((m) => [m.user.email.toLowerCase(), m.user.id])
    );

    // Get project labels for validation
    const labels = await prisma.label.findMany({
      where: { projectId },
      select: { id: true, name: true },
    });
    const labelNameToId = new Map(labels.map((l) => [l.name.toLowerCase(), l.id]));

    // Parse CSV
    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV harus memiliki header dan minimal 1 baris data" },
        { status: 400 }
      );
    }

    const headers = lines[0]
      .split(",")
      .map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());

    const requiredHeaders = ["title", "columnid"];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { error: `Kolom wajib hilang: ${missingHeaders.join(", ")}` },
        { status: 400 }
      );
    }

    const results: Array<{
      row: number;
      success: boolean;
      task?: any;
      error?: string;
    }> = [];

    let imported = 0;
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV parsing (handles quoted fields)
      const values: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim().replace(/^"|"$/g, ""));
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^"|"$/g, ""));

      const rowData: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowData[h] = values[idx] || "";
      });

      const rowNum = i + 1;

      try {
        // Validate required fields
        const title = rowData.title;
        let columnId = rowData.columnid;

        if (!title) {
          throw new Error("Title tidak boleh kosong");
        }

        // Resolve columnId (could be ID or name)
        if (!columnIds.has(columnId)) {
          const matchedId = columnNameToId.get(columnId.toLowerCase());
          if (matchedId) {
            columnId = matchedId;
          } else {
            throw new Error(`Kolom "${columnId}" tidak ditemukan`);
          }
        }

        // Parse priority
        let priority = "MEDIUM";
        if (rowData.priority) {
          const p = rowData.priority.toUpperCase();
          if (["LOW", "MEDIUM", "HIGH", "URGENT"].includes(p)) {
            priority = p;
          }
        }

        // Parse dueDate
        let dueDate: Date | null = null;
        if (rowData.duedate) {
          const parsed = new Date(rowData.duedate);
          if (!isNaN(parsed.getTime())) {
            dueDate = parsed;
          }
        }

        // Parse startDate
        let startDate: Date | null = null;
        if (rowData.startdate) {
          const parsed = new Date(rowData.startdate);
          if (!isNaN(parsed.getTime())) {
            startDate = parsed;
          }
        }

        // Parse assignees
        let assigneeIds: string[] = [];
        if (rowData.assigneeemails) {
          const emails = rowData.assigneeemails
            .split(";")
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean);
          for (const email of emails) {
            const userId = emailToUserId.get(email);
            if (userId) {
              assigneeIds.push(userId);
            }
          }
        }

        // Parse labels
        let labelIds: string[] = [];
        if (rowData.labels) {
          const labelNames = rowData.labels
            .split(";")
            .map((l) => l.trim().toLowerCase())
            .filter(Boolean);
          for (const name of labelNames) {
            const labelId = labelNameToId.get(name);
            if (labelId) {
              labelIds.push(labelId);
            }
          }
        }

        // Generate position at end of column
        const lastTask = await prisma.task.findFirst({
          where: { columnId },
          orderBy: { position: "desc" },
          select: { position: true },
        });
        const position = parseFloat(
          generateKeyBetween(lastTask ? lastTask.position.toString() : null, null)
        );

        // Create task
        const task = await prisma.task.create({
          data: {
            title,
            description: rowData.description || null,
            priority: priority as any,
            dueDate,
            startDate,
            columnId,
            projectId,
            position,
            creatorId: user.id,
            assignees: assigneeIds.length > 0
              ? { create: assigneeIds.map((userId) => ({ userId })) }
              : undefined,
            labels: labelIds.length > 0
              ? { create: labelIds.map((labelId) => ({ labelId })) }
              : undefined,
          },
          include: {
            assignees: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
            labels: { include: { label: true } },
            column: { select: { id: true, name: true, status: true } },
          },
        });

        results.push({ row: rowNum, success: true, task });
        imported++;
      } catch (error: any) {
        results.push({ row: rowNum, success: false, error: error.message });
        skipped++;
      }
    }

    return NextResponse.json({
      imported,
      skipped,
      results,
    });
  } catch (error: any) {
    console.error("Import CSV error:", error);
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}