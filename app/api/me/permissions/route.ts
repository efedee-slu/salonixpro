// app/api/me/permissions/route.ts
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getUserPermissions, detectPreset } from "@/lib/permissions";

export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const permissions = await getUserPermissions(
      session.user.id,
      session.user.role
    );

    return NextResponse.json({
      permissions,
      preset: detectPreset(permissions),
      role: session.user.role,
    });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}
