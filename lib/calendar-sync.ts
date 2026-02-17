// lib/calendar-sync.ts
import { prisma } from "@/lib/prisma";
import {
  createEvent,
  updateEvent,
  deleteEvent,
} from "@/lib/google-calendar";

type SyncAction = "created" | "updated" | "cancelled" | "stylist-changed";

interface AppointmentForSync {
  id: string;
  businessId: string;
  stylistId: string | null;
  requestedDate: Date;
  duration: number;
  notes: string | null;
  client: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string | null;
  };
  services: {
    serviceName: string;
  }[];
}

function buildEventParams(
  appointment: AppointmentForSync,
  business: {
    name: string;
    address?: string | null;
    googleCalIncludePhone: boolean;
    googleCalIncludeNotes: boolean;
  }
) {
  const clientName = `${appointment.client.firstName} ${appointment.client.lastName}`;
  const serviceNames = appointment.services.map((s) => s.serviceName).join(", ");
  const title = `${clientName} - ${serviceNames}`;

  let description = `Client: ${clientName}`;
  if (business.googleCalIncludePhone && appointment.client.phone) {
    description += `\nPhone: ${appointment.client.phone}`;
  }
  if (appointment.client.email) {
    description += `\nEmail: ${appointment.client.email}`;
  }
  description += `\nServices: ${serviceNames}`;
  if (business.googleCalIncludeNotes && appointment.notes) {
    description += `\nNotes: ${appointment.notes}`;
  }
  description += `\n\nBooked via ${business.name}`;

  const startTime = new Date(appointment.requestedDate);
  const endTime = new Date(startTime.getTime() + appointment.duration * 60000);

  return {
    title,
    description,
    startTime,
    endTime,
    location: business.address || undefined,
  };
}

export async function syncAppointmentToCalendar(
  appointment: AppointmentForSync,
  action: SyncAction,
  prevStylistId?: string
) {
  try {
    if (!appointment.stylistId) return;

    // Check business settings
    const business = await prisma.business.findUnique({
      where: { id: appointment.businessId },
      select: {
        name: true,
        address: true,
        googleCalendarEnabled: true,
        googleCalSyncAuto: true,
        googleCalIncludePhone: true,
        googleCalIncludeNotes: true,
      },
    });

    if (!business?.googleCalendarEnabled || !business.googleCalSyncAuto) return;

    // Check stylist settings
    const stylist = await prisma.stylist.findUnique({
      where: { id: appointment.stylistId },
      select: {
        id: true,
        googleCalendarSync: true,
        googleCalendarId: true,
      },
    });

    if (!stylist?.googleCalendarSync) return;

    const calendarId = stylist.googleCalendarId || "primary";
    const eventParams = buildEventParams(appointment, business);

    if (action === "created") {
      const googleEventId = await createEvent(
        stylist.id,
        calendarId,
        eventParams
      );

      if (googleEventId) {
        await prisma.calendarSync.upsert({
          where: {
            appointmentId_stylistId: {
              appointmentId: appointment.id,
              stylistId: stylist.id,
            },
          },
          create: {
            businessId: appointment.businessId,
            stylistId: stylist.id,
            appointmentId: appointment.id,
            googleEventId,
            lastSyncedAt: new Date(),
            syncStatus: "SYNCED",
          },
          update: {
            googleEventId,
            lastSyncedAt: new Date(),
            syncStatus: "SYNCED",
            errorMessage: null,
          },
        });
      } else {
        await prisma.calendarSync.upsert({
          where: {
            appointmentId_stylistId: {
              appointmentId: appointment.id,
              stylistId: stylist.id,
            },
          },
          create: {
            businessId: appointment.businessId,
            stylistId: stylist.id,
            appointmentId: appointment.id,
            syncStatus: "FAILED",
            errorMessage: "Failed to create Google Calendar event",
          },
          update: {
            syncStatus: "FAILED",
            errorMessage: "Failed to create Google Calendar event",
          },
        });
      }
    } else if (action === "updated") {
      const existingSync = await prisma.calendarSync.findUnique({
        where: {
          appointmentId_stylistId: {
            appointmentId: appointment.id,
            stylistId: stylist.id,
          },
        },
      });

      if (existingSync?.googleEventId) {
        const success = await updateEvent(
          stylist.id,
          calendarId,
          existingSync.googleEventId,
          eventParams
        );

        await prisma.calendarSync.update({
          where: { id: existingSync.id },
          data: {
            lastSyncedAt: success ? new Date() : existingSync.lastSyncedAt,
            syncStatus: success ? "SYNCED" : "FAILED",
            errorMessage: success
              ? null
              : "Failed to update Google Calendar event",
          },
        });
      } else {
        // No existing event, create one
        await syncAppointmentToCalendar(appointment, "created");
      }
    } else if (action === "cancelled") {
      const existingSync = await prisma.calendarSync.findUnique({
        where: {
          appointmentId_stylistId: {
            appointmentId: appointment.id,
            stylistId: stylist.id,
          },
        },
      });

      if (existingSync?.googleEventId) {
        await deleteEvent(stylist.id, calendarId, existingSync.googleEventId);

        await prisma.calendarSync.update({
          where: { id: existingSync.id },
          data: {
            syncStatus: "DELETED",
            lastSyncedAt: new Date(),
          },
        });
      }
    } else if (action === "stylist-changed") {
      // Delete event from previous stylist's calendar
      if (prevStylistId) {
        const prevSync = await prisma.calendarSync.findUnique({
          where: {
            appointmentId_stylistId: {
              appointmentId: appointment.id,
              stylistId: prevStylistId,
            },
          },
        });

        if (prevSync?.googleEventId) {
          const prevStylist = await prisma.stylist.findUnique({
            where: { id: prevStylistId },
            select: { googleCalendarSync: true, googleCalendarId: true },
          });

          if (prevStylist?.googleCalendarSync) {
            await deleteEvent(
              prevStylistId,
              prevStylist.googleCalendarId || "primary",
              prevSync.googleEventId
            );
          }

          await prisma.calendarSync.update({
            where: { id: prevSync.id },
            data: { syncStatus: "DELETED", lastSyncedAt: new Date() },
          });
        }
      }

      // Create event on new stylist's calendar
      await syncAppointmentToCalendar(appointment, "created");
    }
  } catch (error) {
    console.error(
      `Calendar sync error for appointment ${appointment.id}:`,
      error
    );
  }
}
