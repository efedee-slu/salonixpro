// app/api/billing/status/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSubscription } from "@/lib/paypal";

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
        subscriptionPlan: true,
        trialEndsAt: true,
        paypalSubscriptionId: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Calculate trial days remaining
    let trialDaysRemaining = null;
    if (business.subscriptionStatus === "TRIAL" && business.trialEndsAt) {
      const now = new Date();
      const trialEnd = new Date(business.trialEndsAt);
      const diffTime = trialEnd.getTime() - now.getTime();
      trialDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (trialDaysRemaining < 0) trialDaysRemaining = 0;
    }

    // Get PayPal subscription details if active
    let paypalSubscription = null;
    if (business.paypalSubscriptionId) {
      try {
        paypalSubscription = await getSubscription(business.paypalSubscriptionId);
      } catch (e) {
        console.error("Failed to fetch PayPal subscription:", e);
      }
    }

    return NextResponse.json({
      status: business.subscriptionStatus,
      plan: business.subscriptionPlan,
      trialEndsAt: business.trialEndsAt,
      trialDaysRemaining,
      subscriptionStartDate: business.subscriptionStartDate,
      subscriptionEndDate: business.subscriptionEndDate,
      paypalSubscriptionId: business.paypalSubscriptionId,
      paypalStatus: paypalSubscription?.status || null,
      nextBillingDate: paypalSubscription?.billing_info?.next_billing_time || null,
    });
  } catch (error) {
    console.error("Error fetching billing status:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing status" },
      { status: 500 }
    );
  }
}
