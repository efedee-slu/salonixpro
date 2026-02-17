// app/api/reviews/route.ts
// Dashboard reviews API - list reviews with filters and stats

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = session.user.businessId;
    const { searchParams } = new URL(request.url);

    const rating = searchParams.get("rating");
    const stylistId = searchParams.get("stylistId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const responded = searchParams.get("responded");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Build where clause
    const where: any = {
      businessId,
      rating: { not: null },
    };

    if (rating) where.rating = parseInt(rating);
    if (stylistId) where.stylistId = stylistId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo + "T23:59:59.999Z");
    }
    if (responded === "true") where.ownerReply = { not: null };
    if (responded === "false") where.ownerReply = null;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          client: { select: { firstName: true, lastName: true } },
          stylist: { select: { firstName: true, lastName: true } },
          appointment: {
            include: {
              services: { select: { serviceName: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    // Compute stats
    const stats = await prisma.review.aggregate({
      where: { businessId, rating: { not: null } },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = await prisma.review.count({
      where: { businessId, rating: { not: null }, createdAt: { gte: startOfMonth } },
    });

    const totalWithReply = await prisma.review.count({
      where: { businessId, rating: { not: null }, ownerReply: { not: null } },
    });

    const totalReviews = stats._count.rating || 0;
    const responseRate = totalReviews > 0 ? Math.round((totalWithReply / totalReviews) * 100) : 0;

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        ownerReply: r.ownerReply,
        ownerRepliedAt: r.ownerRepliedAt,
        isPublic: r.isPublic,
        isFlagged: r.isFlagged,
        createdAt: r.createdAt,
        clientName: `${r.client.firstName} ${r.client.lastName}`,
        stylistName: `${r.stylist.firstName} ${r.stylist.lastName}`,
        services: r.appointment.services.map((s) => s.serviceName),
      })),
      stats: {
        averageRating: stats._avg.rating ? Number(stats._avg.rating.toFixed(1)) : 0,
        totalReviews,
        thisMonth,
        responseRate,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
