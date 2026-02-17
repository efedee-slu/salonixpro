// app/api/public/waitlist/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST — Join waitlist from public booking page (no auth)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, stylistId, requestedDate, duration, serviceIds, guestName, guestEmail, guestPhone } = body;

    if (!businessId || !stylistId || !requestedDate || !Array.isArray(serviceIds)) {
      return NextResponse.json(
        { error: "businessId, stylistId, requestedDate, and serviceIds are required" },
        { status: 400 }
      );
    }

    if (!guestName || !guestEmail || !guestPhone) {
      return NextResponse.json(
        { error: "guestName, guestEmail, and guestPhone are required" },
        { status: 400 }
      );
    }

    // Prevent duplicate waitlist entries for the same guest + slot
    const existing = await prisma.waitlistEntry.findFirst({
      where: {
        businessId,
        stylistId,
        requestedDate: new Date(requestedDate),
        guestEmail,
        status: "ACTIVE",
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You're already on the waitlist for this slot" },
        { status: 409 }
      );
    }

    // Verify business and stylist exist
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const stylist = await prisma.stylist.findFirst({
      where: { id: stylistId, businessId },
      select: { id: true },
    });
    if (!stylist) {
      return NextResponse.json({ error: "Stylist not found" }, { status: 404 });
    }

    // Calculate duration from services if not provided
    let finalDuration = duration;
    if (!finalDuration && serviceIds.length > 0) {
      const services = await prisma.service.findMany({
        where: { id: { in: serviceIds }, businessId },
        select: { duration: true },
      });
      finalDuration = services.reduce((sum, s) => sum + s.duration, 0);
    }
    if (!finalDuration) finalDuration = 30; // default 30 min

    const entry = await prisma.waitlistEntry.create({
      data: {
        businessId,
        stylistId,
        requestedDate: new Date(requestedDate),
        duration: finalDuration,
        serviceIds,
        guestName,
        guestEmail,
        guestPhone,
        status: "ACTIVE",
      },
    });

    return NextResponse.json(
      { id: entry.id, message: "You've been added to the waitlist!" },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error joining waitlist:", err);
    return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
  }
}
