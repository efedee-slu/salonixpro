// app/api/integrations/google/disconnect/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revokeAccess } from "@/lib/google-calendar";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { stylistId } = body;

    if (!stylistId) {
      return NextResponse.json(
        { error: "stylistId is required" },
        { status: 400 }
      );
    }

    // Verify stylist belongs to this business
    const stylist = await prisma.stylist.findFirst({
      where: { id: stylistId, businessId: session.user.businessId },
    });

    if (!stylist) {
      return NextResponse.json(
        { error: "Stylist not found" },
        { status: 404 }
      );
    }

    await revokeAccess(stylistId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting Google Calendar:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Google Calendar" },
      { status: 500 }
    );
  }
}
