// app/api/orders/[id]/status/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH update order status
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = ["PENDING", "CONFIRMED", "READY", "COMPLETED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
      include: {
        items: true,
        client: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Handle status transitions
    const now = new Date();
    let updateData: any = { status };

    switch (status) {
      case "CONFIRMED":
        updateData.confirmedAt = now;
        break;
      case "READY":
        updateData.readyAt = now;
        break;
      case "COMPLETED":
        updateData.completedAt = now;
        break;
      case "CANCELLED":
        updateData.cancelledAt = now;
        break;
    }

    // Handle inventory changes in a transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // If completing the order, move stock from reserved to sold (decrement both)
      if (status === "COMPLETED") {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockOnHand: { decrement: item.quantity },
              stockReserved: { decrement: item.quantity },
            },
          });
        }

        // Update client stats if there's a client
        if (order.clientId) {
          await tx.client.update({
            where: { id: order.clientId },
            data: {
              totalSpent: { increment: Number(order.total) },
              totalVisits: { increment: 1 },
              lastVisitAt: now,
            },
          });
        }
      }

      // If cancelling, release reserved stock
      if (status === "CANCELLED" && order.status !== "COMPLETED") {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockReserved: { decrement: item.quantity },
            },
          });
        }
      }

      // Update the order
      return tx.order.update({
        where: { id: params.id },
        data: updateData,
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
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
