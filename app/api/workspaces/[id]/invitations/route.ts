import { NextResponse } from "next/server";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { inviteMemberSchema } from "@/lib/validations";
import { generateId } from "@/lib/utils";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    await requireWorkspaceAccess(params.id, user.id, "ADMIN");

    const body = await request.json();
    const validatedFields = inviteMemberSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Data tidak valid", issues: validatedFields.error.issues },
        { status: 400 }
      );
    }

    const { email, role } = validatedFields.data;

    // Check if user exists
    const invitedUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!invitedUser) {
      return NextResponse.json(
        { error: "User dengan email tersebut tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: invitedUser.id,
          workspaceId: params.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User sudah menjadi anggota workspace ini" },
        { status: 400 }
      );
    }

    // Create invitation
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const invitation = await prisma.invitation.create({
      data: {
        email,
        workspaceId: params.id,
        role,
        invitedById: user.id,
        expiresAt,
      },
    });

    // TODO: Send email notification
    // For now, auto-accept the invitation
    await prisma.workspaceMember.create({
      data: {
        userId: invitedUser.id,
        workspaceId: params.id,
        role,
      },
    });

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });

    return NextResponse.json({
      invitation,
      message: "Undangan berhasil dikirim",
    });
  } catch (error: any) {
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Invite member error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}