// app/api/products/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET single product
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const product = await prisma.product.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT update product
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if product exists and belongs to this business
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      sku,
      name,
      description,
      image,
      categoryId,
      texture,
      lengthInches,
      color,
      costPrice,
      retailPrice,
      salePrice,
      isOnSale,
      promoText,
      stockOnHand,
      reorderLevel,
      isFeatured,
      isAvailableOnline,
      isActive,
    } = body;

    // Check if SKU is being changed and if it already exists
    if (sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findFirst({
        where: {
          businessId: session.user.businessId,
          sku,
          id: { not: params.id },
        },
      });

      if (skuExists) {
        return NextResponse.json(
          { error: "A product with this SKU already exists" },
          { status: 400 }
        );
      }
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        sku,
        name,
        description: description || null,
        images: image ? [image] : [],
        categoryId: categoryId || null,
        texture: texture || null,
        lengthInches: lengthInches || null,
        color: color || null,
        costPrice: costPrice || 0,
        retailPrice,
        salePrice: salePrice || null,
        isOnSale: isOnSale || false,
        promoText: promoText || null,
        stockOnHand: stockOnHand || 0,
        reorderLevel: reorderLevel || 5,
        isFeatured: isFeatured || false,
        isAvailableOnline: isAvailableOnline !== false,
        isActive: isActive !== false,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE product
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if product exists and belongs to this business
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if product is used in any orders
    const orderItems = await prisma.orderItem.count({
      where: { productId: params.id },
    });

    if (orderItems > 0) {
      // Soft delete instead
      await prisma.product.update({
        where: { id: params.id },
        data: { isActive: false },
      });
      return NextResponse.json({ 
        message: "Product has order history and was deactivated instead of deleted" 
      });
    }

    // Delete the product
    await prisma.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
