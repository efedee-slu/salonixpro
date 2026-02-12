// app/api/products/route.ts
import { NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

// GET all products for the business
export async function GET(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";

    const where: any = {
      businessId: session.user.businessId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
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
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
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
    const { session, error } = await requireRole("MANAGER");
    if (error) return error;

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
