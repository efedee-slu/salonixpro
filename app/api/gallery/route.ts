// app/api/gallery/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: List gallery items for business
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = session.user.businessId;
    const { searchParams } = new URL(request.url);
    const stylistId = searchParams.get("stylistId");
    const categoryId = searchParams.get("categoryId");

    const where: any = { businessId };
    if (stylistId) where.stylistId = stylistId;
    if (categoryId) where.categoryId = categoryId;

    const items = await prisma.galleryItem.findMany({
      where,
      include: {
        stylist: { select: { firstName: true, lastName: true } },
        category: { select: { name: true } },
        client: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching gallery:", error);
    return NextResponse.json({ error: "Failed to fetch gallery" }, { status: 500 });
  }
}

// POST: Create new gallery item
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = session.user.businessId;

    // Check gallery limit
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { galleryMaxPhotos: true, galleryRequireApproval: true },
    });

    const currentCount = await prisma.galleryItem.count({ where: { businessId } });
    if (currentCount >= (business?.galleryMaxPhotos ?? 50)) {
      return NextResponse.json(
        { error: `Gallery limit reached (${business?.galleryMaxPhotos ?? 50} photos maximum)` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      title, description, beforeImageUrl, afterImageUrl,
      beforeImagePublicId, afterImagePublicId,
      serviceCategory, stylistId, categoryId, clientId,
    } = body;

    if (!beforeImageUrl || !afterImageUrl || !beforeImagePublicId || !afterImagePublicId) {
      return NextResponse.json({ error: "Both before and after images are required" }, { status: 400 });
    }

    const item = await prisma.galleryItem.create({
      data: {
        businessId,
        title: title?.trim() || null,
        description: description?.trim() || null,
        beforeImageUrl,
        afterImageUrl,
        beforeImagePublicId,
        afterImagePublicId,
        serviceCategory: serviceCategory || null,
        stylistId: stylistId || null,
        categoryId: categoryId || null,
        clientId: clientId || null,
        isApproved: !business?.galleryRequireApproval,
      },
      include: {
        stylist: { select: { firstName: true, lastName: true } },
        category: { select: { name: true } },
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error creating gallery item:", error);
    return NextResponse.json({ error: "Failed to create gallery item" }, { status: 500 });
  }
}
