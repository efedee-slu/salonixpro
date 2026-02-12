// app/api/services/catalog/route.ts
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

// GET: Returns master services annotated with whether business has enabled each
export async function GET(request: Request) {
  try {
    const { session, error } = await requireRole("MANAGER");
    if (error) return error;

    const businessId = session!.user.businessId;

    // Get the business type to filter
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { businessType: true },
    });

    const categoryFilter =
      business?.businessType === "MULTI_SERVICE" || !business?.businessType
        ? {}
        : { category: business.businessType };

    // Get all master services
    const masterServices = await prisma.masterService.findMany({
      where: { ...categoryFilter, isActive: true },
      orderBy: [{ category: "asc" }, { subcategory: "asc" }, { name: "asc" }],
    });

    // Get business's enabled services (those with a masterServiceId)
    const enabledServices = await prisma.service.findMany({
      where: {
        businessId,
        masterServiceId: { not: null },
      },
      select: { masterServiceId: true, id: true },
    });

    const enabledSet = new Set(
      enabledServices.map((s) => s.masterServiceId)
    );

    // Annotate master services
    const annotated = masterServices.map((ms) => ({
      ...ms,
      enabled: enabledSet.has(ms.id),
    }));

    // Group by subcategory
    const grouped: Record<
      string,
      { category: string; subcategory: string; services: typeof annotated }
    > = {};

    for (const service of annotated) {
      const key = `${service.category}::${service.subcategory}`;
      if (!grouped[key]) {
        grouped[key] = {
          category: service.category,
          subcategory: service.subcategory,
          services: [],
        };
      }
      grouped[key].services.push(service);
    }

    return NextResponse.json({
      groups: Object.values(grouped),
      total: masterServices.length,
      enabled: enabledServices.length,
    });
  } catch (error) {
    console.error("Error fetching catalog:", error);
    return NextResponse.json(
      { error: "Failed to fetch catalog" },
      { status: 500 }
    );
  }
}

// POST: Enable a catalog service (creates Service + ServiceCategory if needed)
export async function POST(request: Request) {
  try {
    const { session, error } = await requireRole("MANAGER");
    if (error) return error;

    const businessId = session!.user.businessId;
    const body = await request.json();
    const { masterServiceId, price, duration } = body;

    if (!masterServiceId || price === undefined) {
      return NextResponse.json(
        { error: "masterServiceId and price are required" },
        { status: 400 }
      );
    }

    // Get the master service
    const masterService = await prisma.masterService.findUnique({
      where: { id: masterServiceId },
    });

    if (!masterService) {
      return NextResponse.json(
        { error: "Master service not found" },
        { status: 404 }
      );
    }

    // Check if already enabled
    const existing = await prisma.service.findFirst({
      where: { businessId, masterServiceId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Service already enabled", serviceId: existing.id },
        { status: 409 }
      );
    }

    // Ensure ServiceCategory exists for this subcategory
    let category = await prisma.serviceCategory.findFirst({
      where: { businessId, name: masterService.subcategory },
    });

    if (!category) {
      const maxSort = await prisma.serviceCategory.findFirst({
        where: { businessId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      category = await prisma.serviceCategory.create({
        data: {
          businessId,
          name: masterService.subcategory,
          sortOrder: (maxSort?.sortOrder ?? 0) + 1,
        },
      });
    }

    // Create the service
    const service = await prisma.service.create({
      data: {
        businessId,
        masterServiceId: masterService.id,
        categoryId: category.id,
        name: masterService.name,
        description: masterService.description,
        duration: duration || masterService.defaultDuration,
        price: parseFloat(price),
        isActive: true,
      },
      include: { category: true },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("Error enabling catalog service:", error);
    return NextResponse.json(
      { error: "Failed to enable service" },
      { status: 500 }
    );
  }
}
