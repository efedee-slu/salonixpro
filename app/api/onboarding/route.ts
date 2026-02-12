// app/api/onboarding/route.ts
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getCurrencyByCode } from "@/lib/currencies";

// GET /api/onboarding?businessType=HAIR_SALON
// Returns master services grouped by subcategory
export async function GET(request: Request) {
  try {
    const { session, error } = await requireRole("OWNER");
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const businessType = searchParams.get("businessType");

    if (!businessType) {
      return NextResponse.json(
        { error: "businessType query parameter is required" },
        { status: 400 }
      );
    }

    // For MULTI_SERVICE, return all categories
    const categoryFilter =
      businessType === "MULTI_SERVICE"
        ? {}
        : { category: businessType };

    const masterServices = await prisma.masterService.findMany({
      where: {
        ...categoryFilter,
        isActive: true,
      },
      orderBy: [{ category: "asc" }, { subcategory: "asc" }, { name: "asc" }],
    });

    // Group by subcategory (and category for MULTI_SERVICE)
    const grouped: Record<
      string,
      { category: string; subcategory: string; services: typeof masterServices }
    > = {};

    for (const service of masterServices) {
      const key =
        businessType === "MULTI_SERVICE"
          ? `${service.category}::${service.subcategory}`
          : service.subcategory;

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
    });
  } catch (error) {
    console.error("Error fetching onboarding catalog:", error);
    return NextResponse.json(
      { error: "Failed to fetch catalog" },
      { status: 500 }
    );
  }
}

// POST /api/onboarding
// Complete onboarding: set business type, currency, create services
export async function POST(request: Request) {
  try {
    const { session, error } = await requireRole("OWNER");
    if (error) return error;

    const body = await request.json();
    const { businessType, currency, selectedServices } = body;

    if (!businessType || !currency || !selectedServices?.length) {
      return NextResponse.json(
        {
          error:
            "businessType, currency, and selectedServices are required",
        },
        { status: 400 }
      );
    }

    const currencyInfo = getCurrencyByCode(currency);
    if (!currencyInfo) {
      return NextResponse.json(
        { error: "Invalid currency code" },
        { status: 400 }
      );
    }

    const businessId = session!.user.businessId;

    // Fetch the master services that were selected
    const masterServiceIds = selectedServices.map(
      (s: { masterServiceId: string }) => s.masterServiceId
    );
    const masterServices = await prisma.masterService.findMany({
      where: { id: { in: masterServiceIds } },
    });

    const masterServiceMap = new Map(
      masterServices.map((ms) => [ms.id, ms])
    );

    // Build a price/duration map from the request
    const selectionMap = new Map(
      selectedServices.map(
        (s: { masterServiceId: string; price: number; duration?: number }) => [
          s.masterServiceId,
          s,
        ]
      )
    );

    // Collect unique subcategories for creating ServiceCategory records
    const subcategories = new Map<string, string>(); // subcategory -> category
    for (const ms of masterServices) {
      if (!subcategories.has(ms.subcategory)) {
        subcategories.set(ms.subcategory, ms.category);
      }
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update business type, currency, etc.
      await tx.business.update({
        where: { id: businessId },
        data: {
          businessType,
          currency: currencyInfo.code,
          currencySymbol: currencyInfo.symbol,
        },
      });

      // 2. Delete empty default service categories (those with no services)
      const existingCategories = await tx.serviceCategory.findMany({
        where: { businessId },
        include: { _count: { select: { services: true } } },
      });

      const emptyCategories = existingCategories.filter(
        (c) => c._count.services === 0
      );
      if (emptyCategories.length > 0) {
        await tx.serviceCategory.deleteMany({
          where: {
            id: { in: emptyCategories.map((c) => c.id) },
          },
        });
      }

      // 3. Create new ServiceCategory records from unique subcategories
      // Build a map of existing category names to avoid duplicates
      const remainingCategories = await tx.serviceCategory.findMany({
        where: { businessId },
      });
      const existingCatNames = new Set(
        remainingCategories.map((c) => c.name)
      );

      const categoryNameToId = new Map<string, string>();
      for (const cat of remainingCategories) {
        categoryNameToId.set(cat.name, cat.id);
      }

      let sortOrder = remainingCategories.length;
      const subcategoryEntries = Array.from(subcategories.entries());
      for (const [subcategory] of subcategoryEntries) {
        if (!existingCatNames.has(subcategory)) {
          const newCat = await tx.serviceCategory.create({
            data: {
              businessId,
              name: subcategory,
              sortOrder: sortOrder++,
            },
          });
          categoryNameToId.set(subcategory, newCat.id);
          existingCatNames.add(subcategory);
        }
      }

      // 4. Create Service records linked to master services
      const selectionEntries = Array.from(selectionMap.entries());
      for (const [masterServiceId, selection] of selectionEntries) {
        const ms = masterServiceMap.get(masterServiceId as string);
        if (!ms) continue;

        const sel = selection as {
          masterServiceId: string;
          price: number;
          duration?: number;
        };
        const categoryId = categoryNameToId.get(ms.subcategory) || null;

        await tx.service.create({
          data: {
            businessId,
            masterServiceId: ms.id,
            categoryId,
            name: ms.name,
            description: ms.description,
            duration: sel.duration || ms.defaultDuration,
            price: sel.price,
            isActive: true,
          },
        });
      }

      // 5. Set onboardingComplete
      await tx.business.update({
        where: { id: businessId },
        data: { onboardingComplete: true },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Onboarding completed successfully",
      serviceCount: selectedServices.length,
    });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
