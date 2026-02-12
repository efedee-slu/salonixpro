// app/api/portal/orders/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPortalToken } from "@/lib/portal-auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const portal = await verifyPortalToken();
    if (!portal) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: params.id,
        clientId: { in: portal.clientIds },
      },
      include: {
        business: {
          select: { name: true, currencySymbol: true, address: true, phone: true },
        },
        items: {
          select: {
            productName: true,
            productSku: true,
            quantity: true,
            unitPrice: true,
            salePrice: true,
            lineTotal: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      date: order.createdAt,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      total: Number(order.total),
      business: order.business,
      items: order.items.map((i) => ({
        name: i.productName,
        sku: i.productSku,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        salePrice: i.salePrice ? Number(i.salePrice) : null,
        total: Number(i.lineTotal),
      })),
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({ error: "Failed to load order" }, { status: 500 });
  }
}
