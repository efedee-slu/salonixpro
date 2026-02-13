// app/api/staff/invite/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { STAFF_PRESET, MANAGER_PRESET, PRESETS } from "@/lib/permissions";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendTeamInvite } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { session, error } = await requirePermission("manageTeam");
    if (error) return error;

    const body = await request.json();
    const { firstName, lastName, email, role, phone } = body;

    // Validate required fields
    if (!firstName || !email || !role) {
      return NextResponse.json(
        { error: "First name, email, and role are required" },
        { status: 400 }
      );
    }

    // Validate role (only MANAGER, STYLIST, ASSISTANT allowed)
    if (!["MANAGER", "STYLIST", "ASSISTANT"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be MANAGER, STYLIST, or ASSISTANT" },
        { status: 400 }
      );
    }

    const businessId = session.user.businessId;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user with this email already exists in the business
    const existing = await prisma.user.findFirst({
      where: { businessId, email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A team member with this email already exists" },
        { status: 400 }
      );
    }

    // Generate a username from email (ensure unique within business)
    let username = normalizedEmail.split("@")[0];
    const usernameExists = await prisma.user.findFirst({
      where: { businessId, username },
    });
    if (usernameExists) {
      username = `${username}${Date.now().toString(36).slice(-4)}`;
    }

    // Generate a temporary password
    const tempPassword = crypto.randomBytes(4).toString("hex"); // 8-char hex string
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Get the permission preset for the role
    const preset = role === "MANAGER" ? MANAGER_PRESET : STAFF_PRESET;

    // Create user and permissions in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          businessId,
          email: normalizedEmail,
          username,
          passwordHash,
          firstName: firstName.trim(),
          lastName: lastName?.trim() || null,
          phone: phone?.trim() || null,
          role,
          mustChangePassword: true,
        },
      });

      await tx.staffPermission.create({
        data: {
          userId: newUser.id,
          ...preset,
        },
      });

      return newUser;
    });

    // Get business name for email
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true },
    });

    // Send invite email (non-blocking)
    sendTeamInvite({
      to: normalizedEmail,
      firstName: firstName.trim(),
      businessName: business?.name || "your salon",
      username,
      tempPassword,
      role,
    }).catch((err) => console.error("Failed to send invite email:", err));

    return NextResponse.json(
      {
        id: user.id,
        name: [user.firstName, user.lastName].filter(Boolean).join(" "),
        email: user.email,
        role: user.role,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error inviting team member:", error);
    return NextResponse.json(
      { error: "Failed to invite team member" },
      { status: 500 }
    );
  }
}
