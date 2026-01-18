// app/api/settings/route.ts
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

    // Fetch business info
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Fetch users
    const users = await prisma.user.findMany({
      where: { businessId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Default hours if none set
    const defaultHours = [
      { day: "Sunday", dayIndex: 0, isOpen: false, openTime: "09:00", closeTime: "17:00" },
      { day: "Monday", dayIndex: 1, isOpen: true, openTime: "09:00", closeTime: "18:00" },
      { day: "Tuesday", dayIndex: 2, isOpen: true, openTime: "09:00", closeTime: "18:00" },
      { day: "Wednesday", dayIndex: 3, isOpen: true, openTime: "09:00", closeTime: "18:00" },
      { day: "Thursday", dayIndex: 4, isOpen: true, openTime: "09:00", closeTime: "18:00" },
      { day: "Friday", dayIndex: 5, isOpen: true, openTime: "09:00", closeTime: "18:00" },
      { day: "Saturday", dayIndex: 6, isOpen: true, openTime: "09:00", closeTime: "16:00" },
    ];

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
        currency: business.currency,
        currencySymbol: business.currencySymbol,
        timezone: business.timezone,
        logo: business.logo,
        // Booking settings
        latitude: business.latitude,
        longitude: business.longitude,
        locationLandmark: business.locationLandmark,
        requiresDeposit: business.requiresDeposit,
        depositType: business.depositType,
        depositAmount: business.depositAmount,
        depositPercentage: business.depositPercentage,
        paymentDeadlineHours: business.paymentDeadlineHours,
        bankName: business.bankName,
        bankAccountName: business.bankAccountName,
        bankAccountNumber: business.bankAccountNumber,
        paymentInstructions: business.paymentInstructions,
      },
      hours: business.businessHours || defaultHours,
      users,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is owner or manager
    if (session.user.role !== "OWNER" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const businessId = session.user.businessId;
    const body = await request.json();
    const { type, data } = body;

    if (type === "business") {
      // Update business info
      const updated = await prisma.business.update({
        where: { id: businessId },
        data: {
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          city: data.city || null,
          country: data.country || "Saint Lucia",
          currency: data.currency || "XCD",
          currencySymbol: data.currencySymbol || "EC$",
        },
      });

      return NextResponse.json({ success: true, business: updated });
    }

    if (type === "hours") {
      // Update business hours
      const updated = await prisma.business.update({
        where: { id: businessId },
        data: {
          businessHours: data,
        },
      });

      return NextResponse.json({ success: true });
    }

    if (type === "logo") {
      // Update business logo
      const updated = await prisma.business.update({
        where: { id: businessId },
        data: {
          logo: data.logo,
        },
      });

      return NextResponse.json({ success: true });
    }

    if (type === "booking") {
      // Update booking settings
      const updated = await prisma.business.update({
        where: { id: businessId },
        data: {
          address: data.address || null,
          latitude: data.latitude || null,
          longitude: data.longitude || null,
          locationLandmark: data.locationLandmark || null,
          requiresDeposit: data.requiresDeposit || false,
          depositType: data.depositType || "percentage",
          depositAmount: data.depositAmount || null,
          depositPercentage: data.depositPercentage || 25,
          paymentDeadlineHours: data.paymentDeadlineHours || 48,
          bankName: data.bankName || null,
          bankAccountName: data.bankAccountName || null,
          bankAccountNumber: data.bankAccountNumber || null,
          paymentInstructions: data.paymentInstructions || null,
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid update type" }, { status: 400 });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
