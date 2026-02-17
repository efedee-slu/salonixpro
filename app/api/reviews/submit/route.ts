// app/api/reviews/submit/route.ts
// Token-based review submission API (no auth required)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Validate token and return appointment details
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const review = await prisma.review.findUnique({
      where: { token },
      include: {
        business: { select: { name: true, logo: true } },
        appointment: {
          include: {
            services: { include: { service: true } },
          },
        },
        stylist: { select: { firstName: true, lastName: true } },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Invalid review link" }, { status: 404 });
    }

    if (new Date() > review.tokenExpiresAt) {
      return NextResponse.json({ error: "expired" }, { status: 410 });
    }

    if (review.rating !== null) {
      return NextResponse.json({ error: "already_reviewed" }, { status: 409 });
    }

    return NextResponse.json({
      businessName: review.business.name,
      businessLogo: review.business.logo,
      stylistName: `${review.stylist.firstName} ${review.stylist.lastName}`,
      services: review.appointment.services.map((s) => s.service.name),
      date: review.appointment.requestedDate,
    });
  } catch (error) {
    console.error("Error validating review token:", error);
    return NextResponse.json({ error: "Failed to validate token" }, { status: 500 });
  }
}

// POST: Submit the review
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, rating, comment } = body;

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const review = await prisma.review.findUnique({
      where: { token },
      include: {
        business: { select: { reviewRequireApproval: true } },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Invalid review link" }, { status: 404 });
    }

    if (new Date() > review.tokenExpiresAt) {
      return NextResponse.json({ error: "This review link has expired" }, { status: 410 });
    }

    if (review.rating !== null) {
      return NextResponse.json({ error: "You've already submitted a review" }, { status: 409 });
    }

    await prisma.review.update({
      where: { id: review.id },
      data: {
        rating,
        comment: comment?.trim() || null,
        isPublic: !review.business.reviewRequireApproval,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error submitting review:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
