// app/api/billing/cancel/route.ts
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { cancelSubscription } from "@/lib/paypal";

export async function POST() {
  try {
    const { session, error } = await requireRole("OWNER");
    if (error) return error;

    const business = await prisma.business.findUnique({
      where: { id: session.user.businessId },
      select: {
        paypalSubscriptionId: true,
        subscriptionStatus: true,
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (!business.paypalSubscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 }
      );
    }

    // Cancel subscription in PayPal
    await cancelSubscription(
      business.paypalSubscriptionId,
      "Customer requested cancellation"
    );

    // Update business status
    await prisma.business.update({
      where: { id: session.user.businessId },
      data: {
        subscriptionStatus: "CANCELLED",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled successfully",
    });
  } catch (error: any) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
