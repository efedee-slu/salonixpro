// app/api/billing/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature, getSubscription } from "@/lib/paypal";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers: Record<string, string> = {};
    
    // Get PayPal headers
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    // Verify webhook signature (optional in sandbox, required in production)
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (webhookId && process.env.PAYPAL_MODE === "live") {
      const isValid = await verifyWebhookSignature(webhookId, headers, body);
      if (!isValid) {
        console.error("Invalid webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(body);
    const eventType = event.event_type;
    const resource = event.resource;

    console.log("PayPal webhook event:", eventType);

    switch (eventType) {
      case "BILLING.SUBSCRIPTION.ACTIVATED":
      case "BILLING.SUBSCRIPTION.RENEWED": {
        // Subscription activated or renewed
        const subscriptionId = resource.id;
        const businessId = resource.custom_id;

        if (businessId) {
          const subscription = await getSubscription(subscriptionId);
          const isYearly = subscription.plan_id === process.env.PAYPAL_PLAN_YEARLY;
          
          const endDate = new Date();
          if (isYearly) {
            endDate.setFullYear(endDate.getFullYear() + 1);
          } else {
            endDate.setMonth(endDate.getMonth() + 1);
          }

          await prisma.business.update({
            where: { id: businessId },
            data: {
              subscriptionStatus: "ACTIVE",
              paypalSubscriptionId: subscriptionId,
              subscriptionEndDate: endDate,
            },
          });
        }
        break;
      }

      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.EXPIRED": {
        // Subscription cancelled or expired
        const businessId = resource.custom_id;

        if (businessId) {
          await prisma.business.update({
            where: { id: businessId },
            data: {
              subscriptionStatus: eventType.includes("CANCELLED") ? "CANCELLED" : "EXPIRED",
            },
          });
        }
        break;
      }

      case "BILLING.SUBSCRIPTION.SUSPENDED": {
        // Payment failed
        const businessId = resource.custom_id;

        if (businessId) {
          await prisma.business.update({
            where: { id: businessId },
            data: {
              subscriptionStatus: "PAST_DUE",
            },
          });
        }
        break;
      }

      case "PAYMENT.SALE.COMPLETED": {
        // Payment received - could be used for logging
        console.log("Payment received:", resource.id);
        break;
      }

      default:
        console.log("Unhandled PayPal event:", eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
