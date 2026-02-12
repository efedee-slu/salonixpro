// app/api/products/categories/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT update a product category
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, icon, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    // Verify category belongs to this business
    const existing = await prisma.productCategory.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check name uniqueness (excluding current category)
    const duplicate = await prisma.productCategory.findFirst({
      where: {
        businessId: session.user.businessId,
        name,
        id: { not: params.id },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 400 }
      );
    }

    const category = await prisma.productCategory.update({
      where: { id: params.id },
      data: {
        name,
        icon: icon || null,
        description: description || null,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating product category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE a product category
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify category belongs to this business
    const category = await prisma.productCategory.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // If category has products, unassign them (set categoryId to null)
    if (category._count.products > 0) {
      await prisma.product.updateMany({
        where: {
          categoryId: params.id,
          businessId: session.user.businessId,
        },
        data: {
          categoryId: null,
        },
      });
    }

    // Soft-delete by marking inactive
    await prisma.productCategory.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
