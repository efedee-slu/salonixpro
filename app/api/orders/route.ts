// app/api/orders/route.ts
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmation } from "@/lib/email";

const VALID_ORDER_STATUSES = ["CART", "PENDING", "CONFIRMED", "READY", "COMPLETED", "CANCELLED"];

// Generate order number
function generateOrderNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${year}${month}${day}-${random}`;
}

// GET all orders for the business
export async function GET(request: Request) {
  try {
    const { session, error } = await requirePermission("viewOrders");
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const skip = (page - 1) * limit;

    const validStatus = status && status !== "all" && VALID_ORDER_STATUSES.includes(status)
      ? (status as "CART" | "PENDING" | "CONFIRMED" | "READY" | "COMPLETED" | "CANCELLED")
      : undefined;

    const where = {
      businessId: session.user.businessId,
      status: validStatus,
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST create new order
export async function POST(request: Request) {
  try {
    const { session, error } = await requirePermission("createOrders");
    if (error) return error;

    const body = await request.json();
    const {
      clientId,
      customerName,
      customerPhone,
      items,
      discount,
      staffNotes,
    } = body;

    // Validate items
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 }
      );
    }

    // Get product details
    const productIds = items.map((item: any) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        businessId: session.user.businessId,
      },
    });

    if (products.length !== items.length) {
      return NextResponse.json(
        { error: "One or more products not found" },
        { status: 400 }
      );
    }

    // Validate stock availability
    const insufficientStock: { name: string; available: number; requested: number }[] = [];
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)!;
      const available = product.stockOnHand - product.stockReserved;
      if (available < item.quantity) {
        insufficientStock.push({
          name: product.name,
          available: Math.max(0, available),
          requested: item.quantity,
        });
      }
    }

    if (insufficientStock.length > 0) {
      const details = insufficientStock
        .map((p) => `${p.name}: ${p.available} available, ${p.requested} requested`)
        .join("; ");
      return NextResponse.json(
        { error: `Insufficient stock: ${details}`, insufficientStock },
        { status: 400 }
      );
    }

    // Calculate totals and prepare order items
    let subtotal = 0;
    const orderItems = items.map((item: any) => {
      const product = products.find((p) => p.id === item.productId)!;
      const price = product.isOnSale && product.salePrice
        ? Number(product.salePrice)
        : Number(product.retailPrice);
      const lineTotal = price * item.quantity;
      subtotal += lineTotal;

      return {
        productId: product.id,
        productSku: product.sku,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.retailPrice,
        salePrice: product.isOnSale ? product.salePrice : null,
        lineTotal,
      };
    });

    const discountAmount = discount || 0;
    const total = Math.max(0, subtotal - discountAmount);

    // Create order with items in a transaction (order number generated inside to prevent race conditions)
    const order = await prisma.$transaction(async (tx) => {
      // Generate unique order number inside transaction
      let orderNumber = generateOrderNumber();
      let attempts = 0;
      while (attempts < 10) {
        const existing = await tx.order.findUnique({
          where: { orderNumber },
        });
        if (!existing) break;
        orderNumber = generateOrderNumber();
        attempts++;
      }

      // Create the order
      const newOrder = await tx.order.create({
        data: {
          businessId: session.user.businessId,
          orderNumber,
          clientId: clientId || null,
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          subtotal,
          discount: discountAmount,
          total,
          staffNotes: staffNotes || null,
          status: "PENDING",
          paymentStatus: "UNPAID",
          items: {
            create: orderItems,
          },
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
          items: true,
        },
      });

      // Reserve stock for each item
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockReserved: {
              increment: item.quantity,
            },
          },
        });
      }

      return newOrder;
    });

    // Send order confirmation email if customer has email
    const customerEmail = order.client?.email || body.customerEmail;
    if (customerEmail) {
      const business = await prisma.business.findUnique({
        where: { id: session.user.businessId },
        select: { name: true, currencySymbol: true },
      });
      sendOrderConfirmation({
        to: customerEmail,
        customerName: order.client
          ? `${order.client.firstName} ${order.client.lastName}`
          : order.customerName || "Customer",
        businessName: business?.name || "Salon",
        orderNumber: order.orderNumber,
        items: order.items.map((item) => ({
          name: item.productName,
          quantity: item.quantity,
          price: Number(item.lineTotal),
        })),
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        total: Number(order.total),
        currencySymbol: business?.currencySymbol || "EC$",
        paymentMethod: body.paymentMethod,
        pickupDate: body.pickupDate ? new Date(body.pickupDate) : undefined,
      }).catch((err) => console.error("Failed to send order confirmation:", err));
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
