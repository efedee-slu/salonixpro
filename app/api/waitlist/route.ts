// app/api/waitlist/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

// GET — List waitlist entries for a business
export async function GET(request: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const businessId = session.user.businessId;
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const stylistId = searchParams.get("stylistId");
    const date = searchParams.get("date");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = { businessId };
    if (status) where.status = status;
    if (stylistId) where.stylistId = stylistId;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      where.requestedDate = { gte: start, lt: end };
    }

    const [entries, total] = await Promise.all([
      prisma.waitlistEntry.findMany({
        where,
        include: {
          client: { select: { firstName: true, lastName: true, phone: true, email: true } },
          stylist: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.waitlistEntry.count({ where }),
    ]);

    // Resolve service names for each entry
    const allServiceIds = entries.flatMap((e) => (e.serviceIds as string[]) || []);
    const uniqueServiceIds = Array.from(new Set(allServiceIds));
    const services = await prisma.service.findMany({
      where: { id: { in: uniqueServiceIds } },
      select: { id: true, name: true },
    });
    const serviceMap = Object.fromEntries(services.map((s) => [s.id, s.name]));

    const data = entries.map((entry) => ({
      ...entry,
      serviceNames: ((entry.serviceIds as string[]) || []).map(
        (id) => serviceMap[id] || "Unknown"
      ),
    }));

    return NextResponse.json({ data, total, page, limit });
  } catch (err) {
    console.error("Error fetching waitlist:", err);
    return NextResponse.json({ error: "Failed to fetch waitlist" }, { status: 500 });
  }
}

// POST — Add a client to the waitlist from the dashboard
export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const businessId = session.user.businessId;
    const body = await request.json();
    const { clientId, stylistId, requestedDate, serviceIds } = body;

    if (!clientId || !stylistId || !requestedDate || !serviceIds?.length) {
      return NextResponse.json(
        { error: "clientId, stylistId, requestedDate, and serviceIds are required" },
        { status: 400 }
      );
    }

    // Calculate total duration from services
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds }, businessId },
      select: { duration: true },
    });
    const duration = services.reduce((sum, s) => sum + s.duration, 0);

    const entry = await prisma.waitlistEntry.create({
      data: {
        businessId,
        clientId,
        stylistId,
        requestedDate: new Date(requestedDate),
        duration,
        serviceIds,
        status: "ACTIVE",
      },
      include: {
        client: { select: { firstName: true, lastName: true } },
        stylist: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error("Error creating waitlist entry:", err);
    return NextResponse.json({ error: "Failed to add to waitlist" }, { status: 500 });
  }
}
