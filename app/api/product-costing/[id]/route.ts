// app/api/product-costing/[id]/route.ts
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requirePermission("viewProductCosts");
    if (error) return error;

    const costing = await prisma.productCosting.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
      include: {
        linkedProduct: {
          select: { id: true, name: true, sku: true, retailPrice: true },
        },
      },
    });

    if (!costing) {
      return NextResponse.json({ error: "Costing not found" }, { status: 404 });
    }

    return NextResponse.json(costing);
  } catch (error) {
    console.error("Error fetching product costing:", error);
    return NextResponse.json(
      { error: "Failed to fetch product costing" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requirePermission("viewProductCosts");
    if (error) return error;

    const existing = await prisma.productCosting.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Costing not found" }, { status: 404 });
    }

    const body = await request.json();

    const updated = await prisma.productCosting.update({
      where: { id: params.id },
      data: {
        productName: body.productName,
        supplier: body.supplier,
        quantity: body.quantity,
        unitPrice: body.unitPrice,
        purchaseCurrency: body.purchaseCurrency,
        shippingCost: body.shippingCost,
        freightCost: body.freightCost,
        dutyRate: body.dutyRate,
        dutyAmount: body.dutyAmount,
        vatRate: body.vatRate,
        vatAmount: body.vatAmount,
        hslRate: body.hslRate,
        hslAmount: body.hslAmount,
        exciseTax: body.exciseTax,
        customsFee: body.customsFee,
        insurance: body.insurance,
        handlingFee: body.handlingFee,
        otherCosts: body.otherCosts,
        otherDescription: body.otherDescription,
        customTaxes: body.customTaxes,
        totalLandedCost: body.totalLandedCost,
        totalLandedCostLocal: body.totalLandedCostLocal,
        landedCostPerUnit: body.landedCostPerUnit,
        localCurrency: body.localCurrency,
        localCurrencySymbol: body.localCurrencySymbol,
        exchangeRate: body.exchangeRate,
        markupPercent: body.markupPercent,
        sellingPrice: body.sellingPrice,
        linkedProductId: body.linkedProductId,
      },
    });

    // If linked to a product, update the product's costPrice and retailPrice
    if (body.linkedProductId && body.landedCostPerUnit > 0) {
      await prisma.product.update({
        where: { id: body.linkedProductId },
        data: {
          costPrice: body.landedCostPerUnit,
          ...(body.sellingPrice > 0 ? { retailPrice: body.sellingPrice } : {}),
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating product costing:", error);
    return NextResponse.json(
      { error: "Failed to update product costing" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requirePermission("viewProductCosts");
    if (error) return error;

    const existing = await prisma.productCosting.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Costing not found" }, { status: 404 });
    }

    await prisma.productCosting.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Costing deleted successfully" });
  } catch (error) {
    console.error("Error deleting product costing:", error);
    return NextResponse.json(
      { error: "Failed to delete product costing" },
      { status: 500 }
    );
  }
}
