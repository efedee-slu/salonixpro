// app/api/billing/setup/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createProduct, createBillingPlan, getPayPalAccessToken } from "@/lib/paypal";

// This endpoint creates the PayPal product and billing plans
// Run this ONCE to get the plan IDs, then save them to your .env file

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow owners to run setup
    if (!session?.user || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized - Owner only" }, { status: 401 });
    }

    // Test PayPal connection first
    console.log("Testing PayPal connection...");
    await getPayPalAccessToken();
    console.log("PayPal connection successful!");

    // Create product
    console.log("Creating PayPal product...");
    const productId = await createProduct();
    console.log("Product created:", productId);

    // Create monthly plan
    console.log("Creating monthly plan...");
    const monthlyPlanId = await createBillingPlan(productId, "monthly");
    console.log("Monthly plan created:", monthlyPlanId);

    // Create yearly plan
    console.log("Creating yearly plan...");
    const yearlyPlanId = await createBillingPlan(productId, "yearly");
    console.log("Yearly plan created:", yearlyPlanId);

    return NextResponse.json({
      success: true,
      message: "PayPal plans created successfully!",
      productId,
      plans: {
        monthly: monthlyPlanId,
        yearly: yearlyPlanId,
      },
      instructions: `
Add these to your .env file:

PAYPAL_PRODUCT_ID="${productId}"
PAYPAL_PLAN_MONTHLY="${monthlyPlanId}"
PAYPAL_PLAN_YEARLY="${yearlyPlanId}"

Then restart your server.
      `,
    });
  } catch (error: any) {
    console.error("Error setting up PayPal:", error);
    return NextResponse.json(
      { error: error.message || "Failed to setup PayPal plans" },
      { status: 500 }
    );
  }
}

// GET endpoint to check if setup is needed
export async function GET() {
  const monthlyPlanId = process.env.PAYPAL_PLAN_MONTHLY;
  const yearlyPlanId = process.env.PAYPAL_PLAN_YEARLY;

  return NextResponse.json({
    isConfigured: !!(monthlyPlanId && yearlyPlanId),
    monthlyPlanId: monthlyPlanId || null,
    yearlyPlanId: yearlyPlanId || null,
  });
}
