// app/api/portal/dashboard/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPortalToken } from "@/lib/portal-auth";

export async function GET() {
  try {
    const portal = await verifyPortalToken();
    if (!portal) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Fetch all client records with their business info
    const clients = await prisma.client.findMany({
      where: { id: { in: portal.clientIds }, isActive: true },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            phone: true,
            address: true,
            currencySymbol: true,
            logo: true,
          },
        },
      },
    });

    // Build data per business
    const businesses = await Promise.all(
      clients.map(async (client) => {
        // Upcoming appointments
        const upcoming = await prisma.appointment.findMany({
          where: {
            clientId: client.id,
            requestedDate: { gte: now },
            status: { in: ["PENDING", "PENDING_DEPOSIT", "CONFIRMED", "ARRIVED", "IN_PROGRESS"] },
          },
          include: {
            stylist: { select: { firstName: true, lastName: true } },
            services: { include: { service: { select: { name: true } } } },
          },
          orderBy: { requestedDate: "asc" },
          take: 20,
        });

        // Past appointments
        const past = await prisma.appointment.findMany({
          where: {
            clientId: client.id,
            OR: [
              { status: { in: ["COMPLETED", "CANCELLED", "AUTO_CANCELLED", "NO_SHOW"] } },
              { requestedDate: { lt: now }, status: { notIn: ["PENDING", "PENDING_DEPOSIT", "CONFIRMED"] } },
            ],
          },
          include: {
            stylist: { select: { firstName: true, lastName: true } },
            services: { include: { service: { select: { name: true } } } },
          },
          orderBy: { requestedDate: "desc" },
          take: 20,
        });

        // Orders
        const orders = await prisma.order.findMany({
          where: { clientId: client.id },
          include: {
            items: {
              select: { productName: true, quantity: true, lineTotal: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        });

        return {
          business: client.business,
          client: {
            id: client.id,
            firstName: client.firstName,
            lastName: client.lastName,
            totalVisits: client.totalVisits,
            totalSpent: Number(client.totalSpent),
            isVip: client.isVip,
          },
          upcoming: upcoming.map((apt) => ({
            id: apt.id,
            date: apt.requestedDate,
            duration: apt.duration,
            status: apt.status,
            totalPrice: Number(apt.totalPrice),
            bookingReference: apt.bookingReference,
            stylist: apt.stylist
              ? `${apt.stylist.firstName} ${apt.stylist.lastName}`
              : "Any available",
            services: apt.services.map((s) => s.service.name),
            canCancel: ["PENDING", "PENDING_DEPOSIT", "CONFIRMED"].includes(apt.status) &&
              apt.requestedDate > now,
          })),
          past: past.map((apt) => ({
            id: apt.id,
            date: apt.requestedDate,
            duration: apt.duration,
            status: apt.status,
            totalPrice: Number(apt.totalPrice),
            stylist: apt.stylist
              ? `${apt.stylist.firstName} ${apt.stylist.lastName}`
              : "Any available",
            services: apt.services.map((s) => s.service.name),
          })),
          orders: orders.map((ord) => ({
            id: ord.id,
            orderNumber: ord.orderNumber,
            date: ord.createdAt,
            status: ord.status,
            paymentStatus: ord.paymentStatus,
            total: Number(ord.total),
            itemCount: ord.items.length,
            items: ord.items.map((i) => ({
              name: i.productName,
              quantity: i.quantity,
              total: Number(i.lineTotal),
            })),
          })),
        };
      })
    );

    return NextResponse.json({
      email: portal.email,
      businesses,
    });
  } catch (error) {
    console.error("Error fetching portal dashboard:", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
