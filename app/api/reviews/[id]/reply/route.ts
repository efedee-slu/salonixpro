// app/api/reviews/[id]/reply/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const review = await prisma.review.findFirst({
      where: { id: params.id, businessId: session.user.businessId },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const body = await request.json();
    const { reply } = body;

    if (!reply?.trim()) {
      return NextResponse.json({ error: "Reply cannot be empty" }, { status: 400 });
    }

    const updated = await prisma.review.update({
      where: { id: review.id },
      data: {
        ownerReply: reply.trim(),
        ownerRepliedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, ownerReply: updated.ownerReply, ownerRepliedAt: updated.ownerRepliedAt });
  } catch (error) {
    console.error("Error replying to review:", error);
    return NextResponse.json({ error: "Failed to reply" }, { status: 500 });
  }
}
