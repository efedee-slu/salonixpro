// app/api/reviews/[id]/flag/route.ts
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

    const updated = await prisma.review.update({
      where: { id: review.id },
      data: { isFlagged: !review.isFlagged },
    });

    return NextResponse.json({ success: true, isFlagged: updated.isFlagged });
  } catch (error) {
    console.error("Error flagging review:", error);
    return NextResponse.json({ error: "Failed to flag review" }, { status: 500 });
  }
}
