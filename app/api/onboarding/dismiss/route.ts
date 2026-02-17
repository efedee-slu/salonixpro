import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function PATCH() {
  const { session, error } = await requireAuth();
  if (error) return error;

  await prisma.business.update({
    where: { id: session!.user.businessId },
    data: { onboardingDismissed: true },
  });

  return NextResponse.json({ success: true });
}
