// lib/waitlist.ts
import { prisma } from "@/lib/prisma";
import { sendWaitlistSpotAvailable } from "@/lib/email";

/**
 * When an appointment is cancelled or marked no-show,
 * find the first ACTIVE waitlist entry for that slot
 * and notify them via email + in-app notification.
 */
export async function processWaitlistForCancelledAppointment(params: {
  businessId: string;
  stylistId: string;
  requestedDate: Date;
  duration: number;
}) {
  const { businessId, stylistId, requestedDate, duration } = params;

  // Find the time window for the cancelled appointment
  const startTime = new Date(requestedDate);
  const endTime = new Date(startTime.getTime() + duration * 60000);

  // Find ACTIVE waitlist entries that overlap with the cancelled appointment's time window
  const waitlistEntries = await prisma.waitlistEntry.findMany({
    where: {
      businessId,
      stylistId,
      status: "ACTIVE",
      requestedDate: {
        gte: startTime,
        lt: endTime,
      },
    },
    include: {
      client: true,
      stylist: true,
      business: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 1,
  });

  if (waitlistEntries.length === 0) return null;

  const entry = waitlistEntries[0];

  // Update entry status to NOTIFIED
  await prisma.waitlistEntry.update({
    where: { id: entry.id },
    data: {
      status: "NOTIFIED",
      notifiedAt: new Date(),
    },
  });

  // Determine email recipient
  const email = entry.client?.email || entry.guestEmail;
  const name = entry.client
    ? `${entry.client.firstName} ${entry.client.lastName}`
    : entry.guestName || "there";

  // Parse service IDs from JSON
  const serviceIds = entry.serviceIds as string[];

  // Fetch service names
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    select: { name: true },
  });

  // Send email notification
  if (email) {
    await sendWaitlistSpotAvailable({
      to: email,
      clientName: name,
      businessName: entry.business.name,
      businessSlug: entry.business.slug,
      stylistName: `${entry.stylist.firstName} ${entry.stylist.lastName}`,
      date: entry.requestedDate,
      services: services.map((s) => s.name),
    });
  }

  // Create in-app notification for the business
  await prisma.notification.create({
    data: {
      businessId,
      type: "WAITLIST_SPOT_AVAILABLE",
      title: "Waitlist client notified",
      message: `${name} was notified that a spot opened up with ${entry.stylist.firstName} ${entry.stylist.lastName} on ${entry.requestedDate.toLocaleDateString()}.`,
      data: { waitlistEntryId: entry.id, stylistId },
    },
  });

  return entry;
}
