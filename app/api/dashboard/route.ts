// app/api/dashboard/route.ts
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const businessId = session.user.businessId;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      todayAppointments,
      yesterdayAppointmentCount,
      activeClientCount,
      newClientsThisMonth,
      todayOrders,
      pendingOrderCount,
      readyOrderCount,
      recentOrders,
      lowStockProducts,
      recentClients,
      recentCompletedAppointments,
    ] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          businessId,
          requestedDate: { gte: startOfToday, lte: endOfToday },
          status: { notIn: ["CANCELLED", "AUTO_CANCELLED"] },
        },
        include: {
          client: { select: { firstName: true, lastName: true, phone: true } },
          stylist: { select: { firstName: true, lastName: true } },
          services: { select: { serviceName: true, price: true, duration: true } },
        },
        orderBy: { requestedDate: "asc" },
      }),

      prisma.appointment.count({
        where: {
          businessId,
          requestedDate: { gte: startOfYesterday, lte: endOfYesterday },
          status: { notIn: ["CANCELLED", "AUTO_CANCELLED"] },
        },
      }),

      prisma.client.count({
        where: { businessId, totalVisits: { gte: 1 } },
      }),

      prisma.client.count({
        where: { businessId, createdAt: { gte: startOfMonth } },
      }),

      prisma.order.findMany({
        where: {
          businessId,
          completedAt: { gte: startOfToday, lte: endOfToday },
          paymentStatus: "PAID",
        },
      }),

      prisma.order.count({
        where: { businessId, status: "PENDING" },
      }),

      prisma.order.count({
        where: { businessId, status: "READY" },
      }),

      prisma.order.findMany({
        where: { businessId, status: { not: "CART" } },
        include: {
          client: { select: { firstName: true, lastName: true } },
          items: { select: { productName: true, quantity: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      prisma.$queryRaw`
        SELECT id, name, sku, "stockOnHand", "stockReserved", "reorderLevel"
        FROM "Product"
        WHERE "businessId" = ${businessId}
          AND "isActive" = true
          AND ("stockOnHand" - "stockReserved") <= "reorderLevel"
        ORDER BY ("stockOnHand" - "stockReserved") ASC
        LIMIT 10
      ` as Promise<any[]>,

      prisma.client.findMany({
        where: { businessId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, firstName: true, lastName: true, createdAt: true },
      }),

      prisma.appointment.findMany({
        where: { businessId, status: "COMPLETED" },
        include: {
          client: { select: { firstName: true, lastName: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]);

    // Calculate today's revenue
    const completedTodayAppointments = todayAppointments.filter(
      (a) => a.status === "COMPLETED"
    );
    const appointmentRevenue = completedTodayAppointments.reduce(
      (sum, a) => sum + Number(a.totalPrice),
      0
    );
    const orderRevenue = todayOrders.reduce(
      (sum, o) => sum + Number(o.total),
      0
    );
    const todayRevenue = appointmentRevenue + orderRevenue;

    // Build recent activity feed
    const recentActivity: any[] = [];

    for (const client of recentClients) {
      recentActivity.push({
        type: "new_client",
        title: `New client: ${client.firstName} ${client.lastName}`,
        timestamp: client.createdAt,
      });
    }

    for (const appt of recentCompletedAppointments) {
      recentActivity.push({
        type: "appointment_completed",
        title: `Appointment completed: ${appt.client.firstName} ${appt.client.lastName}`,
        timestamp: appt.updatedAt,
      });
    }

    for (const order of recentOrders.slice(0, 5)) {
      const customerName = order.client
        ? `${order.client.firstName} ${order.client.lastName}`
        : order.customerName || "Walk-in";
      recentActivity.push({
        type: "order",
        title: `Order ${order.orderNumber}: ${customerName}`,
        timestamp: order.createdAt,
      });
    }

    recentActivity.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      stats: {
        todayAppointments: todayAppointments.length,
        yesterdayAppointments: yesterdayAppointmentCount,
        activeClients: activeClientCount,
        newClientsThisMonth,
        todayRevenue,
        pendingOrders: pendingOrderCount,
        readyOrders: readyOrderCount,
      },
      todayAppointments,
      recentOrders,
      lowStockProducts: lowStockProducts || [],
      recentActivity: recentActivity.slice(0, 5),
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
