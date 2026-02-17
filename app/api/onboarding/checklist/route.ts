import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const businessId = session!.user.businessId;

  const [business, serviceCount, stylistCount] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: {
        name: true,
        address: true,
        phone: true,
        logo: true,
        slug: true,
        businessHours: true,
        onboardingDismissed: true,
      },
    }),
    prisma.service.count({ where: { businessId, isActive: true } }),
    prisma.stylist.count({ where: { businessId, isActive: true } }),
  ]);

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Check business hours — at least 1 day with isOpen: true
  let hasBusinessHours = false;
  if (business.businessHours && typeof business.businessHours === "object") {
    const hours = business.businessHours as Record<string, any>;
    hasBusinessHours = Object.values(hours).some(
      (day: any) => day && day.isOpen === true
    );
  }

  const items = [
    {
      step: 1,
      label: "Complete your business profile",
      description: "Add your business name, address, and phone number",
      completed: !!(business.name && business.address && business.phone),
      link: "/settings",
    },
    {
      step: 2,
      label: "Set your business hours",
      description: "Configure at least one working day for your salon",
      completed: hasBusinessHours,
      link: "/settings?tab=hours",
    },
    {
      step: 3,
      label: "Add your services",
      description: "Add at least one service to your catalog",
      completed: serviceCount >= 1,
      link: "/services",
    },
    {
      step: 4,
      label: "Add a staff member",
      description: "Add at least one staff member besides yourself",
      completed: stylistCount >= 2,
      link: "/stylists",
    },
    {
      step: 5,
      label: "Upload your logo",
      description: "Add a logo to personalize your booking page",
      completed: !!business.logo,
      link: "/settings",
    },
    {
      step: 6,
      label: "Share your booking link",
      description: "Share your unique booking page with clients",
      completed: false, // Always shows — informational
      link: null,
      bookingUrl: `salonixpro.com/book/${business.slug}`,
    },
  ];

  const completedCount = items.filter((i) => i.completed).length;

  return NextResponse.json({
    items,
    completedCount,
    totalCount: items.length,
    allComplete: completedCount === items.length,
    dismissed: business.onboardingDismissed,
    slug: business.slug,
  });
}
