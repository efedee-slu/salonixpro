// app/api/appointments/pending-deposits/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = session.user.businessId;

    // Get appointments with pending or submitted deposits
    const appointments = await prisma.appointment.findMany({
      where: {
        businessId,
        depositStatus: { in: ["PENDING", "SUBMITTED"] },
        status: { notIn: ["CANCELLED", "AUTO_CANCELLED"] },
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        services: {
          select: {
            serviceName: true,
            price: true,
          },
        },
        stylist: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { depositStatus: "asc" }, // SUBMITTED first
        { paymentDeadline: "asc" },
      ],
    });

    // Calculate time remaining for each
    const now = new Date();
    const formattedAppointments = appointments.map((apt) => {
      const deadline = apt.paymentDeadline ? new Date(apt.paymentDeadline) : null;
      let timeRemaining = null;
      let isExpired = false;
      let isUrgent = false;

      if (deadline) {
        const diff = deadline.getTime() - now.getTime();
        if (diff <= 0) {
          isExpired = true;
        } else {
          const minutes = Math.floor(diff / (1000 * 60));
          const hours = Math.floor(minutes / 60);
          const days = Math.floor(hours / 24);

          if (days > 0) {
            timeRemaining = `${days}d ${hours % 24}h`;
          } else if (hours > 0) {
            timeRemaining = `${hours}h ${minutes % 60}m`;
          } else {
            timeRemaining = `${minutes}m`;
            isUrgent = minutes <= 30;
          }
        }
      }

      return {
        id: apt.id,
        bookingReference: apt.bookingReference,
        requestedDate: apt.requestedDate,
        totalPrice: Number(apt.totalPrice),
        depositAmount: apt.depositAmount ? Number(apt.depositAmount) : null,
        depositStatus: apt.depositStatus,
        paymentDeadline: apt.paymentDeadline,
        paymentSubmittedAt: apt.paymentSubmittedAt,
        timeRemaining,
        isExpired,
        isUrgent,
        client: apt.client,
        services: apt.services,
        stylist: apt.stylist,
      };
    });

    // Separate into submitted (needs action) and pending (waiting for customer)
    const submitted = formattedAppointments.filter((a) => a.depositStatus === "SUBMITTED");
    const pending = formattedAppointments.filter((a) => a.depositStatus === "PENDING");
    const expired = formattedAppointments.filter((a) => a.isExpired);

    return NextResponse.json({
      submitted,
      pending,
      expired,
      counts: {
        submitted: submitted.length,
        pending: pending.length,
        expired: expired.length,
        total: formattedAppointments.length,
      },
    });
  } catch (error) {
    console.error("Error fetching pending deposits:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending deposits" },
      { status: 500 }
    );
  }
}
