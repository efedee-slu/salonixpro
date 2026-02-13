// app/api/products/[id]/adjust-stock/route.ts
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

// POST manual stock adjustment
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requirePermission("manageShop");
    if (error) return error;

    const body = await request.json();
    const { type, quantity, reason } = body;

    // Validate type
    const validTypes = ["RESTOCK", "ADJUSTMENT", "DAMAGE", "RETURN"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid adjustment type. Must be RESTOCK, ADJUSTMENT, DAMAGE, or RETURN" },
        { status: 400 }
      );
    }

    // Validate quantity
    if (!quantity || quantity === 0) {
      return NextResponse.json(
        { error: "Quantity is required and must not be zero" },
        { status: 400 }
      );
    }

    // Get product
    const product = await prisma.product.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Determine the actual quantity change
    // RESTOCK/RETURN: positive (add stock)
    // DAMAGE: negative (remove stock)
    // ADJUSTMENT: can be positive or negative
    let stockChange = quantity;
    if (type === "DAMAGE" && quantity > 0) {
      stockChange = -quantity; // Damage always removes stock
    }

    const newStock = product.stockOnHand + stockChange;
    if (newStock < 0) {
      return NextResponse.json(
        { error: `Cannot reduce stock below 0. Current stock: ${product.stockOnHand}` },
        { status: 400 }
      );
    }

    // Apply adjustment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: params.id },
        data: {
          stockOnHand: newStock,
        },
        include: {
          category: {
            select: { id: true, name: true, icon: true },
          },
        },
      });

      await tx.stockMovement.create({
        data: {
          businessId: session.user.businessId,
          productId: params.id,
          type,
          quantity: stockChange,
          quantityBefore: product.stockOnHand,
          quantityAfter: newStock,
          reason: reason || null,
          createdBy: session.user.id,
        },
      });

      return updated;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error adjusting stock:", error);
    return NextResponse.json(
      { error: "Failed to adjust stock" },
      { status: 500 }
    );
  }
}
