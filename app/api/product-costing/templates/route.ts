// app/api/product-costing/templates/route.ts
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { session, error } = await requirePermission("viewProductCosts");
    if (error) return error;

    const templates = await prisma.costingTemplate.findMany({
      where: { businessId: session.user.businessId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching costing templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch costing templates" },
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

    if (!body.name) {
      return NextResponse.json(
        { error: "Template name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = await prisma.costingTemplate.findFirst({
      where: { businessId, name: body.name },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A template with this name already exists" },
        { status: 400 }
      );
    }

    const template = await prisma.costingTemplate.create({
      data: {
        businessId,
        name: body.name,
        dutyRate: body.dutyRate || 0,
        vatRate: body.vatRate || 0,
        hslRate: body.hslRate || 0,
        exciseTax: body.exciseTax || 0,
        customsFee: body.customsFee || 0,
        exchangeRate: body.exchangeRate || 1,
        defaultMarkup: body.defaultMarkup || 0,
        shippingEstimate: body.shippingEstimate || 0,
        purchaseCurrency: body.purchaseCurrency || "USD",
        customTaxes: body.customTaxes || null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Error creating costing template:", error);
    return NextResponse.json(
      { error: "Failed to create costing template" },
      { status: 500 }
    );
  }
}
