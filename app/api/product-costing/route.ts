// app/api/product-costing/route.ts
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { session, error } = await requirePermission("viewProductCosts");
    if (error) return error;

    const businessId = session.user.businessId;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const where: any = { businessId };
    if (search) {
      where.OR = [
        { productName: { contains: search, mode: "insensitive" } },
        { supplier: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.productCosting.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          linkedProduct: {
            select: { id: true, name: true, sku: true },
          },
        },
      }),
      prisma.productCosting.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching product costings:", error);
    return NextResponse.json(
      { error: "Failed to fetch product costings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { session, error } = await requirePermission("viewProductCosts");
    if (error) return error;

    const businessId = session.user.businessId;
    const body = await request.json();

    if (!body.productName) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    if (!body.unitPrice || Number(body.unitPrice) <= 0) {
      return NextResponse.json(
        { error: "Unit price must be greater than 0" },
        { status: 400 }
      );
    }

    // Create the costing record
    const costing = await prisma.productCosting.create({
      data: {
        businessId,
        productName: body.productName,
        supplier: body.supplier || null,
        quantity: body.quantity || 1,
        unitPrice: body.unitPrice,
        purchaseCurrency: body.purchaseCurrency || "USD",
        shippingCost: body.shippingCost || 0,
        freightCost: body.freightCost || 0,
        dutyRate: body.dutyRate || 0,
        dutyAmount: body.dutyAmount || 0,
        vatRate: body.vatRate || 0,
        vatAmount: body.vatAmount || 0,
        hslRate: body.hslRate || 0,
        hslAmount: body.hslAmount || 0,
        exciseTax: body.exciseTax || 0,
        customsFee: body.customsFee || 0,
        insurance: body.insurance || 0,
        handlingFee: body.handlingFee || 0,
        otherCosts: body.otherCosts || 0,
        otherDescription: body.otherDescription || null,
        customTaxes: body.customTaxes || null,
        totalLandedCost: body.totalLandedCost || 0,
        totalLandedCostLocal: body.totalLandedCostLocal || 0,
        landedCostPerUnit: body.landedCostPerUnit || 0,
        localCurrency: body.localCurrency || "XCD",
        localCurrencySymbol: body.localCurrencySymbol || "EC$",
        exchangeRate: body.exchangeRate || 1,
        markupPercent: body.markupPercent || 0,
        sellingPrice: body.sellingPrice || 0,
        linkedProductId: body.linkedProductId || null,
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

    return NextResponse.json(costing, { status: 201 });
  } catch (error) {
    console.error("Error creating product costing:", error);
    return NextResponse.json(
      { error: "Failed to create product costing" },
      { status: 500 }
    );
  }
}
