// app/api/public/book/[slug]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { 
  generateBookingReference, 
  calculateDeposit, 
  calculatePaymentDeadline,
  createNotification 
} from "@/lib/booking";

export async function GET(
  request: Request,
  context: { params: { slug: string } }
) {
  try {
    const slug = context.params.slug;

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

    // Get service categories with services
    const categories = await prisma.serviceCategory.findMany({
      where: { businessId: business.id },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    // Filter out empty categories and format data
    const formattedCategories = categories
      .filter((cat) => cat.services.length > 0)
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        services: cat.services.map((svc) => ({
          id: svc.id,
          name: svc.name,
          description: svc.description,
          duration: svc.duration,
          price: Number(svc.price),
          categoryId: svc.categoryId,
        })),
      }));

    // Get active stylists
    const stylists = await prisma.stylist.findMany({
      where: {
        businessId: business.id,
        isActive: true,
      },
      orderBy: { firstName: "asc" },
    });

    const formattedStylists = stylists.map((s) => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      title: null, // Not in schema yet
      bio: s.bio,
      photo: s.avatar, // Map avatar to photo for frontend
    }));

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        email: business.email,
        phone: business.phone,
        address: business.address,
        city: business.city,
        country: business.country,
        currencySymbol: business.currencySymbol,
        logo: business.logo,
        businessHours: business.businessHours,
        // Location
        latitude: business.latitude,
        longitude: business.longitude,
        locationLandmark: business.locationLandmark,
        // Deposit settings
        requiresDeposit: business.requiresDeposit,
        depositType: business.depositType,
        depositAmount: business.depositAmount ? Number(business.depositAmount) : null,
        depositPercentage: business.depositPercentage,
        paymentDeadlineHours: business.paymentDeadlineHours,
        bankName: business.bankName,
        bankAccountName: business.bankAccountName,
        bankAccountNumber: business.bankAccountNumber,
        paymentInstructions: business.paymentInstructions,
      },
      categories: formattedCategories,
      stylists: formattedStylists,
    });
  } catch (error) {
    console.error("Error fetching booking data:", error);
    return NextResponse.json(
      { error: "Failed to load booking data" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: { slug: string } }
) {
  try {
    const slug = context.params.slug;
    const body = await request.json();
    const { services, stylistId, date, time, customer } = body;

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

    // Validate services
    const serviceRecords = await prisma.service.findMany({
      where: {
        id: { in: services },
        businessId: business.id,
        isActive: true,
      },
    });

    if (serviceRecords.length !== services.length) {
      return NextResponse.json(
        { error: "Invalid services selected" },
        { status: 400 }
      );
    }

    // Validate stylist
    const stylist = await prisma.stylist.findFirst({
      where: {
        id: stylistId,
        businessId: business.id,
        isActive: true,
      },
    });

    if (!stylist) {
      return NextResponse.json(
        { error: "Invalid stylist selected" },
        { status: 400 }
      );
    }

    // Calculate total duration and price
    const totalDuration = serviceRecords.reduce((sum, s) => sum + s.duration, 0);
    const totalPrice = serviceRecords.reduce((sum, s) => sum + Number(s.price), 0);

    // Parse date and time
    const [hours, minutes] = time.split(":").map(Number);
    const requestedDate = new Date(date);
    requestedDate.setHours(hours, minutes, 0, 0);

    const endTime = new Date(requestedDate);
    endTime.setMinutes(endTime.getMinutes() + totalDuration);

    // Check for conflicts - get all appointments for this stylist on this day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        stylistId: stylistId,
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        requestedDate: { gte: startOfDay, lte: endOfDay },
      },
    });

    // Check for overlaps
    const hasConflict = existingAppointments.some((apt) => {
      const aptStart = new Date(apt.requestedDate);
      const aptEnd = new Date(aptStart);
      aptEnd.setMinutes(aptEnd.getMinutes() + apt.duration);

      return (
        (requestedDate >= aptStart && requestedDate < aptEnd) ||
        (endTime > aptStart && endTime <= aptEnd) ||
        (requestedDate <= aptStart && endTime >= aptEnd)
      );
    });

    if (hasConflict) {
      return NextResponse.json(
        { error: "This time slot is no longer available" },
        { status: 400 }
      );
    }

    // Find or create client
    let client = await prisma.client.findFirst({
      where: {
        businessId: business.id,
        OR: [
          { phone: customer.phone },
          ...(customer.email ? [{ email: customer.email }] : []),
        ],
      },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          businessId: business.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email || null,
          phone: customer.phone,
        },
      });
    }

    // Create appointment
    const bookingReference = generateBookingReference();
    
    // Calculate deposit if required
    let depositAmount = null;
    let depositStatus = "NOT_REQUIRED";
    let paymentDeadline = null;
    let appointmentStatus = "CONFIRMED";
    
    if (business.requiresDeposit) {
      depositAmount = calculateDeposit(
        totalPrice,
        business.depositType,
        business.depositAmount,
        business.depositPercentage
      );
      depositStatus = "PENDING";
      paymentDeadline = calculatePaymentDeadline(requestedDate, business.paymentDeadlineHours);
      appointmentStatus = "PENDING_DEPOSIT";
    }

    const appointment = await prisma.appointment.create({
      data: {
        businessId: business.id,
        clientId: client.id,
        stylistId: stylistId,
        requestedDate,
        duration: totalDuration,
        totalPrice,
        status: appointmentStatus as any,
        notes: customer.notes || null,
        bookingReference,
        depositAmount,
        depositStatus: depositStatus as any,
        paymentDeadline,
        services: {
          create: serviceRecords.map((svc) => ({
            serviceId: svc.id,
            serviceName: svc.name,
            duration: svc.duration,
            price: svc.price,
          })),
        },
      },
      include: {
        stylist: true,
        client: true,
        services: true,
      },
    });

    // Create notification for new booking
    await createNotification(
      business.id,
      "BOOKING_NEW",
      "New Booking Received",
      `${client.firstName} ${client.lastName} booked ${serviceRecords.map(s => s.name).join(", ")} for ${requestedDate.toLocaleDateString()} at ${time}`,
      { appointmentId: appointment.id, bookingReference }
    );

    return NextResponse.json({
      success: true,
      reference: bookingReference,
      appointmentId: appointment.id,
      requiresDeposit: business.requiresDeposit,
      depositAmount,
      paymentDeadline: paymentDeadline?.toISOString(),
      bankDetails: business.requiresDeposit ? {
        bankName: business.bankName,
        bankAccountName: business.bankAccountName,
        bankAccountNumber: business.bankAccountNumber,
        paymentInstructions: business.paymentInstructions,
      } : null,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
