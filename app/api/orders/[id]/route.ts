// app/api/orders/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

// GET single order
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requirePermission("viewOrders");
    if (error) return error;

    const order = await prisma.order.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// DELETE order (only if pending and unpaid)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requirePermission("manageOrders");
    if (error) return error;

    const order = await prisma.order.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentStatus === "PAID") {
      return NextResponse.json(
        { error: "Cannot delete a paid order" },
        { status: 400 }
      );
    }

    // Release reserved stock and delete order in transaction
    await prisma.$transaction(async (tx) => {
      // Release stock for each item
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockReserved: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Delete order items
      await tx.orderItem.deleteMany({
        where: { orderId: params.id },
      });

      // Delete order
      await tx.order.delete({
        where: { id: params.id },
      });
    });

    return NextResponse.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}
