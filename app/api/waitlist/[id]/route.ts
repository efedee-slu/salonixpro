// app/api/waitlist/[id]/route.ts
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

// DELETE — Cancel a waitlist entry
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const businessId = session.user.businessId;

    const entry = await prisma.waitlistEntry.findFirst({
      where: { id: params.id, businessId },
    });

    if (!entry) {
      return NextResponse.json({ error: "Waitlist entry not found" }, { status: 404 });
    }

    if (entry.status === "CANCELLED") {
      return NextResponse.json({ error: "Entry already cancelled" }, { status: 400 });
    }

    const updated = await prisma.waitlistEntry.update({
      where: { id: params.id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Error cancelling waitlist entry:", err);
    return NextResponse.json({ error: "Failed to cancel waitlist entry" }, { status: 500 });
  }
}

// PATCH — Re-notify a waitlist entry
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const businessId = session.user.businessId;
    const body = await request.json();

    const entry = await prisma.waitlistEntry.findFirst({
      where: { id: params.id, businessId },
      include: {
        client: true,
        stylist: true,
        business: { select: { name: true, slug: true } },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Waitlist entry not found" }, { status: 404 });
    }

    if (body.action === "renotify") {
      const { sendWaitlistSpotAvailable } = await import("@/lib/email");

      const email = entry.client?.email || entry.guestEmail;
      const name = entry.client
        ? `${entry.client.firstName} ${entry.client.lastName}`
        : entry.guestName || "there";

      const serviceIds = entry.serviceIds as string[];
      const services = await prisma.service.findMany({
        where: { id: { in: serviceIds } },
        select: { name: true },
      });

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

      const updated = await prisma.waitlistEntry.update({
        where: { id: params.id },
        data: { status: "NOTIFIED", notifiedAt: new Date() },
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Error updating waitlist entry:", err);
    return NextResponse.json({ error: "Failed to update waitlist entry" }, { status: 500 });
  }
}
