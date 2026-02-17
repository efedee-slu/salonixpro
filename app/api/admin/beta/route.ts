// app/api/admin/beta/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendBetaApproved, sendBetaRejected } from "@/lib/email";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["OWNER", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
  } catch (error) {
    console.error("Error fetching beta signups:", error);
    return NextResponse.json(
      { error: "Failed to fetch beta signups" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["OWNER", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, action } = await request.json();

    if (!id || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    const now = new Date();

    const signup = await prisma.betaSignup.update({
      where: { id },
      data: {
        status: action === "approve" ? "APPROVED" : "REJECTED",
        approvedAt: action === "approve" ? now : null,
        rejectedAt: action === "reject" ? now : null,
      },
    });

    // Send email notification
    try {
      if (action === "approve") {
        await sendBetaApproved({
          to: signup.email,
          name: signup.name,
          salonName: signup.salonName,
        });
      } else {
        await sendBetaRejected({
          to: signup.email,
          name: signup.name,
          salonName: signup.salonName,
        });
      }
    } catch (emailErr) {
      console.error(`Failed to send beta ${action} email:`, emailErr);
    }

    return NextResponse.json({ success: true, signup });
  } catch (error) {
    console.error("Error updating beta signup:", error);
    return NextResponse.json(
      { error: "Failed to update beta signup" },
      { status: 500 }
    );
  }
}
