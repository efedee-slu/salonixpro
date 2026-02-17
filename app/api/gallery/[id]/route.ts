// app/api/gallery/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteImage } from "@/lib/cloudinary";

// PATCH: Update gallery item
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const item = await prisma.galleryItem.findFirst({
      where: { id: params.id, businessId: session.user.businessId },
    });

    if (!item) {
      return NextResponse.json({ error: "Gallery item not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      title, description, serviceCategory, stylistId, categoryId,
      clientId, isPublic, isApproved, sortOrder,
      beforeImageUrl, afterImageUrl, beforeImagePublicId, afterImagePublicId,
    } = body;

    // If replacing images, delete old ones from Cloudinary
    const updateData: any = {};

    if (beforeImageUrl && beforeImagePublicId && beforeImagePublicId !== item.beforeImagePublicId) {
      deleteImage(item.beforeImagePublicId).catch(console.error);
      updateData.beforeImageUrl = beforeImageUrl;
      updateData.beforeImagePublicId = beforeImagePublicId;
    }

    if (afterImageUrl && afterImagePublicId && afterImagePublicId !== item.afterImagePublicId) {
      deleteImage(item.afterImagePublicId).catch(console.error);
      updateData.afterImageUrl = afterImageUrl;
      updateData.afterImagePublicId = afterImagePublicId;
    }

    if (title !== undefined) updateData.title = title?.trim() || null;
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (serviceCategory !== undefined) updateData.serviceCategory = serviceCategory || null;
    if (stylistId !== undefined) updateData.stylistId = stylistId || null;
    if (categoryId !== undefined) updateData.categoryId = categoryId || null;
    if (clientId !== undefined) updateData.clientId = clientId || null;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (isApproved !== undefined) updateData.isApproved = isApproved;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const updated = await prisma.galleryItem.update({
      where: { id: item.id },
      data: updateData,
      include: {
        stylist: { select: { firstName: true, lastName: true } },
        category: { select: { name: true } },
        client: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating gallery item:", error);
    return NextResponse.json({ error: "Failed to update gallery item" }, { status: 500 });
  }
}

// DELETE: Remove gallery item and Cloudinary images
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const item = await prisma.galleryItem.findFirst({
      where: { id: params.id, businessId: session.user.businessId },
    });

    if (!item) {
      return NextResponse.json({ error: "Gallery item not found" }, { status: 404 });
    }

    // Delete images from Cloudinary
    await Promise.all([
      deleteImage(item.beforeImagePublicId).catch(console.error),
      deleteImage(item.afterImagePublicId).catch(console.error),
    ]);

    // Delete from database
    await prisma.galleryItem.delete({ where: { id: item.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting gallery item:", error);
    return NextResponse.json({ error: "Failed to delete gallery item" }, { status: 500 });
  }
}
