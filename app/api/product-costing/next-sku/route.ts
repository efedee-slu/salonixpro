// app/api/product-costing/next-sku/route.ts
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { session, error } = await requirePermission("viewProductCosts");
    if (error) return error;

    const businessId = session.user.businessId;

    // Find the highest SKU number for this business
    const latest = await prisma.productCosting.findFirst({
      where: {
        businessId,
        sku: { startsWith: "SP-" },
      },
      orderBy: { sku: "desc" },
      select: { sku: true },
    });

    let nextNumber = 1;
    if (latest?.sku) {
      const match = latest.sku.match(/^SP-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const nextSku = `SP-${String(nextNumber).padStart(4, "0")}`;

    return NextResponse.json({ sku: nextSku });
  } catch (error) {
    console.error("Error generating next SKU:", error);
    return NextResponse.json(
      { error: "Failed to generate SKU" },
      { status: 500 }
    );
  }
}
