// app/api/product-costing/check-sku/route.ts
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { session, error } = await requirePermission("viewProductCosts");
    if (error) return error;

    const businessId = session.user.businessId;
    const { searchParams } = new URL(request.url);
    const sku = searchParams.get("sku");
    const excludeId = searchParams.get("excludeId"); // For edit mode

    if (!sku) {
      return NextResponse.json(
        { error: "SKU parameter is required" },
        { status: 400 }
      );
    }

    const where: any = {
      businessId,
      sku: sku.toUpperCase(),
    };

    // Exclude current record when editing
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const existing = await prisma.productCosting.findFirst({ where });

    return NextResponse.json({
      available: !existing,
      sku: sku.toUpperCase(),
    });
  } catch (error) {
    console.error("Error checking SKU:", error);
    return NextResponse.json(
      { error: "Failed to check SKU" },
      { status: 500 }
    );
  }
}
