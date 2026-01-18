// app/api/billing/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSubscription } from "@/lib/paypal";

// Plan IDs - These need to be created in PayPal first
// For now, we'll use environment variables
const PLAN_IDS = {
  monthly: process.env.PAYPAL_PLAN_MONTHLY || "",
  yearly: process.env.PAYPAL_PLAN_YEARLY || "",
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { plan } = body; // "monthly" or "yearly"

    if (!plan || !["monthly", "yearly"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'monthly' or 'yearly'" },
        { status: 400 }
      );
    }

    const planId = PLAN_IDS[plan as keyof typeof PLAN_IDS];
    
    if (!planId) {
      return NextResponse.json(
        { error: "Plan not configured. Please contact support." },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const returnUrl = `${appUrl}/api/billing/success?businessId=${session.user.businessId}`;
    const cancelUrl = `${appUrl}/settings?tab=billing&cancelled=true`;

    const { subscriptionId, approvalUrl } = await createSubscription(
      planId,
      session.user.businessId,
      returnUrl,
      cancelUrl
    );

    return NextResponse.json({
      subscriptionId,
      approvalUrl,
    });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
