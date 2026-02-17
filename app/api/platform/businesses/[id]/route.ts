// app/api/platform/businesses/[id]/route.ts
import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { sendTrialExtended } from "@/lib/email";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const business = await prisma.business.findUnique({
    where: { id: params.id },
    include: {
      _count: {
        select: {
          users: true,
          clients: true,
          appointments: true,
          services: true,
          stylists: true,
        },
      },
      users: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  return NextResponse.json({ business });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const data = await request.json();

  const allowedFields = [
    "isActive",
    "subscriptionStatus",
    "subscriptionPlan",
    "trialEndsAt",
    "subscriptionStartDate",
    "subscriptionEndDate",
  ];

  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      if (field.includes("At") || field.includes("Date")) {
        updateData[field] = data[field] ? new Date(data[field]) : null;
      } else {
        updateData[field] = data[field];
      }
    }
  }

  const business = await prisma.business.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json({ success: true, business });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  try {
    // Check business exists
    const business = await prisma.business.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, email: true, isPlatform: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Prevent deletion of platform pseudo-business
    if (business.isPlatform) {
      return NextResponse.json(
        { error: "Cannot delete the SalonixPro Platform business." },
        { status: 403 }
      );
    }

    // Delete the business (cascade will handle all related data)
    await prisma.business.delete({
      where: { id: params.id },
    });

    // Update BetaSignup if exists
    if (business.email) {
      try {
        await prisma.betaSignup.updateMany({
          where: { email: business.email },
          data: { status: "DELETED", rejectedAt: new Date() },
        });
      } catch {
        // BetaSignup might not exist, that's fine
      }
    }

    return NextResponse.json({ success: true, deleted: business.name });
  } catch (err) {
    console.error("Delete business error:", err);
    return NextResponse.json(
      { error: "Failed to delete business. Please try again." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  // PUT is used for extend-trial
  const { error } = await requireSuperAdmin();
  if (error) return error;

  try {
    const { extendDays, customDate } = await request.json();

    const business = await prisma.business.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        trialEndsAt: true,
        users: {
          where: { role: "OWNER" },
          select: { email: true, firstName: true },
          take: 1,
        },
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    let newTrialEnd: Date;
    if (customDate) {
      newTrialEnd = new Date(customDate);
    } else {
      // Extend from current trial end or from now, whichever is later
      const base = business.trialEndsAt && new Date(business.trialEndsAt) > new Date()
        ? new Date(business.trialEndsAt)
        : new Date();
      newTrialEnd = new Date(base);
      newTrialEnd.setDate(newTrialEnd.getDate() + (extendDays || 30));
    }

    await prisma.business.update({
      where: { id: params.id },
      data: {
        trialEndsAt: newTrialEnd,
        subscriptionStatus: "TRIAL",
      },
    });

    // Send email to owner
    const owner = business.users[0];
    if (owner?.email) {
      try {
        await sendTrialExtended({
          to: owner.email,
          name: owner.firstName || "there",
          salonName: business.name,
          newTrialEnd,
        });
      } catch (emailErr) {
        console.error("Failed to send trial extension email:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      newTrialEnd: newTrialEnd.toISOString(),
    });
  } catch (err) {
    console.error("Extend trial error:", err);
    return NextResponse.json(
      { error: "Failed to extend trial." },
      { status: 500 }
    );
  }
}
