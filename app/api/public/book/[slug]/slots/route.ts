// app/api/public/book/[slug]/slots/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface BusinessHour {
  day: string;
  dayIndex: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export async function GET(
  request: Request,
  context: { params: { slug: string } }
) {
  try {
    const slug = context.params.slug;
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    const stylistId = searchParams.get("stylistId");
    const duration = parseInt(searchParams.get("duration") || "30");

    if (!dateStr || !stylistId) {
      return NextResponse.json(
        { error: "Missing date or stylistId" },
        { status: 400 }
      );
    }

    // Find business by slug
    const business = await prisma.business.findUnique({
      where: { slug },
    });

    if (!business || !business.isActive) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Parse date
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();

    // Get business hours for this day
    const businessHours = business.businessHours as BusinessHour[] | null;
    let openTime = "09:00";
    let closeTime = "18:00";
    let isOpen = true;

    if (businessHours) {
      const dayHours = businessHours.find((h) => h.dayIndex === dayOfWeek);
      if (dayHours) {
        isOpen = dayHours.isOpen;
        openTime = dayHours.openTime;
        closeTime = dayHours.closeTime;
      }
    }

    if (!isOpen) {
      return NextResponse.json({ slots: [] });
    }

    // Get stylist's schedule for this day
    const stylistSchedule = await prisma.stylistSchedule.findFirst({
      where: {
        stylistId,
        dayOfWeek,
        isWorking: true,
      },
    });

    // If stylist has custom schedule, use it
    if (stylistSchedule) {
      openTime = stylistSchedule.startTime;
      closeTime = stylistSchedule.endTime;
    }

    // Get existing appointments for this stylist on this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        stylistId,
        requestedDate: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      orderBy: { requestedDate: "asc" },
    });

    // Generate time slots
    const slots: { time: string; display: string; available: boolean }[] = [];
    const slotInterval = 30; // 30-minute intervals

    const [openHour, openMin] = openTime.split(":").map(Number);
    const [closeHour, closeMin] = closeTime.split(":").map(Number);

    let currentTime = new Date(date);
    currentTime.setHours(openHour, openMin, 0, 0);

    const closingTime = new Date(date);
    closingTime.setHours(closeHour, closeMin, 0, 0);

    // Don't show slots in the past for today
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    while (currentTime < closingTime) {
      const slotEnd = new Date(currentTime);
      slotEnd.setMinutes(slotEnd.getMinutes() + duration);

      // Check if slot end would exceed closing time
      if (slotEnd > closingTime) {
        break;
      }

      const timeStr = currentTime.toTimeString().slice(0, 5);
      const displayStr = currentTime.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      // Check if slot is in the past (for today)
      let available = true;
      if (isToday && currentTime <= now) {
        available = false;
      }

      // Check for conflicts with existing appointments
      if (available) {
        for (const apt of existingAppointments) {
          const aptStart = new Date(apt.requestedDate);
          const aptEnd = new Date(aptStart);
          aptEnd.setMinutes(aptEnd.getMinutes() + apt.duration);

          // Check if slot overlaps with appointment
          if (
            (currentTime >= aptStart && currentTime < aptEnd) ||
            (slotEnd > aptStart && slotEnd <= aptEnd) ||
            (currentTime <= aptStart && slotEnd >= aptEnd)
          ) {
            available = false;
            break;
          }
        }
      }

      slots.push({
        time: timeStr,
        display: displayStr,
        available,
      });

      // Move to next slot
      currentTime.setMinutes(currentTime.getMinutes() + slotInterval);
    }

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Error fetching slots:", error);
    return NextResponse.json(
      { error: "Failed to load available slots" },
      { status: 500 }
    );
  }
}
