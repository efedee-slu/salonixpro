// app/api/product-costing/templates/[id]/route.ts
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

    const template = await prisma.costingTemplate.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error fetching costing template:", error);
    return NextResponse.json(
      { error: "Failed to fetch costing template" },
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

    const existing = await prisma.costingTemplate.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const body = await request.json();

    // Check for duplicate name if name is changing
    if (body.name && body.name !== existing.name) {
      const nameExists = await prisma.costingTemplate.findFirst({
        where: {
          businessId: session.user.businessId,
          name: body.name,
          id: { not: params.id },
        },
      });
      if (nameExists) {
        return NextResponse.json(
          { error: "A template with this name already exists" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.costingTemplate.update({
      where: { id: params.id },
      data: {
        name: body.name,
        dutyRate: body.dutyRate,
        vatRate: body.vatRate,
        hslRate: body.hslRate,
        exciseTax: body.exciseTax,
        customsFee: body.customsFee,
        exchangeRate: body.exchangeRate,
        defaultMarkup: body.defaultMarkup,
        shippingEstimate: body.shippingEstimate,
        purchaseCurrency: body.purchaseCurrency,
        customTaxes: body.customTaxes,
        notes: body.notes,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating costing template:", error);
    return NextResponse.json(
      { error: "Failed to update costing template" },
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

    const existing = await prisma.costingTemplate.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    await prisma.costingTemplate.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting costing template:", error);
    return NextResponse.json(
      { error: "Failed to delete costing template" },
      { status: 500 }
    );
  }
}
