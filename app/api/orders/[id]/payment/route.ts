// app/api/orders/[id]/payment/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

// POST process payment
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requirePermission("manageOrders");
    if (error) return error;

    const body = await request.json();
    const { paymentMethod } = body;

    // Validate payment method
    const validMethods = ["CASH", "CARD", "TRANSFER"];
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentStatus === "PAID") {
      return NextResponse.json(
        { error: "Order is already paid" },
        { status: 400 }
      );
    }

    if (order.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot process payment for cancelled order" },
        { status: 400 }
      );
    }

    // Update order with payment info
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        paymentStatus: "PAID",
        paymentMethod: paymentMethod as any,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        items: true,
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    );
  }
}
