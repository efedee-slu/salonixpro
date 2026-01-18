// app/api/business/trial/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await prisma.business.findUnique({
      where: { id: session.user.businessId },
      select: {
        subscriptionStatus: true,
        trialEndsAt: true,
        subscriptionPlan: true,
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Calculate days remaining in trial
    let daysRemaining = null;
    if (business.subscriptionStatus === "TRIAL" && business.trialEndsAt) {
      const now = new Date();
      const trialEnd = new Date(business.trialEndsAt);
      const diffTime = trialEnd.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (daysRemaining < 0) daysRemaining = 0;
    }

    return NextResponse.json({
      subscriptionStatus: business.subscriptionStatus,
      trialEndsAt: business.trialEndsAt,
      subscriptionPlan: business.subscriptionPlan,
      daysRemaining,
    });
  } catch (error) {
    console.error("Error fetching trial info:", error);
    return NextResponse.json(
      { error: "Failed to fetch trial info" },
      { status: 500 }
    );
  }
}
