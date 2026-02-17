// app/api/platform/beta/route.ts
import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { sendBetaRejected } from "@/lib/email";

export async function GET(request: Request) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { salonName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [signups, total, pending, approved, rejected] = await Promise.all([
    prisma.betaSignup.findMany({
      where,
      orderBy: { createdAt: "desc" },
    }),
    prisma.betaSignup.count(),
    prisma.betaSignup.count({ where: { status: "PENDING" } }),
    prisma.betaSignup.count({ where: { status: "APPROVED" } }),
    prisma.betaSignup.count({ where: { status: "REJECTED" } }),
  ]);

  return NextResponse.json({
    signups,
    stats: { total, pending, approved, rejected },
  });
}

export async function PATCH(request: Request) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { id, action } = await request.json();

  if (!id || !["reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const now = new Date();

  if (action === "reject") {
    const signup = await prisma.betaSignup.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectedAt: now,
      },
    });

    // Deactivate the associated business if one exists
    const existingUser = await prisma.user.findFirst({
      where: { email: signup.email, role: "OWNER" },
    });
    if (existingUser) {
      await prisma.business.update({
        where: { id: existingUser.businessId },
        data: { isActive: false },
      });
    }

    // Send rejection email
    try {
      await sendBetaRejected({
        to: signup.email,
        name: signup.name,
        salonName: signup.salonName,
      });
    } catch (emailErr) {
      console.error("Failed to send beta rejection email:", emailErr);
    }

    return NextResponse.json({ success: true, signup });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
