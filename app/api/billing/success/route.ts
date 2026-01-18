// app/api/billing/success/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSubscription } from "@/lib/paypal";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get("subscription_id");
    const businessId = searchParams.get("businessId");

    if (!subscriptionId || !businessId) {
      return NextResponse.redirect(
        new URL("/settings?tab=billing&error=missing_params", request.url)
      );
    }

    // Verify subscription with PayPal
    const subscription = await getSubscription(subscriptionId);

    if (subscription.status !== "ACTIVE" && subscription.status !== "APPROVED") {
      return NextResponse.redirect(
        new URL("/settings?tab=billing&error=subscription_not_active", request.url)
      );
    }

    // Verify the subscription is for this business
    if (subscription.custom_id !== businessId) {
      return NextResponse.redirect(
        new URL("/settings?tab=billing&error=invalid_subscription", request.url)
      );
    }

    // Determine plan type from subscription
    const planId = subscription.plan_id;
    const isYearly = planId === process.env.PAYPAL_PLAN_YEARLY;
    const planName = isYearly ? "yearly" : "monthly";

    // Calculate subscription end date
    const startDate = new Date();
    const endDate = new Date();
    if (isYearly) {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Update business subscription status
    await prisma.business.update({
      where: { id: businessId },
      data: {
        subscriptionStatus: "ACTIVE",
        subscriptionPlan: planName,
        paypalSubscriptionId: subscriptionId,
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDate,
        trialEndsAt: null, // Clear trial
      },
    });

    // Redirect to success page
    return NextResponse.redirect(
      new URL("/settings?tab=billing&success=true", request.url)
    );
  } catch (error: any) {
    console.error("Error processing subscription success:", error);
    return NextResponse.redirect(
      new URL("/settings?tab=billing&error=processing_failed", request.url)
    );
  }
}
