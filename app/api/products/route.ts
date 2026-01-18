// app/api/products/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET all products for the business
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      where: {
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
      orderBy: [
        { category: { name: "asc" } },
        { name: "asc" },
      ],
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST create new product
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Validate required fields
    if (!sku || !name || retailPrice === undefined) {
      return NextResponse.json(
        { error: "SKU, name, and retail price are required" },
        { status: 400 }
      );
    }

    // Check if SKU already exists for this business
    const existingProduct = await prisma.product.findFirst({
      where: {
        businessId: session.user.businessId,
        sku,
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: "A product with this SKU already exists" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        businessId: session.user.businessId,
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

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
