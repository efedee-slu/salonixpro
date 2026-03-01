// app/api/auth/check-password-status/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ mustChangePassword: false });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { mustChangePassword: true, tempPasswordExpiresAt: true },
    });

    const tempPasswordExpired = !!(
      user?.mustChangePassword &&
      user?.tempPasswordExpiresAt &&
      new Date() > user.tempPasswordExpiresAt
    );

    return NextResponse.json({
      mustChangePassword: user?.mustChangePassword || false,
      tempPasswordExpired,
    });
  } catch (error) {
    console.error("Check password status error:", error);
    return NextResponse.json({ mustChangePassword: false });
  }
}
