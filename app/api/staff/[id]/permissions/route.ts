// app/api/staff/[id]/permissions/route.ts
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import {
  getUserPermissions,
  detectPreset,
  PRESETS,
  type PermissionKey,
} from "@/lib/permissions";

const PERMISSION_KEYS: PermissionKey[] = [
  "manageTeam",
  "manageServices",
  "viewShop",
  "manageShop",
  "viewProductCosts",
  "viewOrders",
  "createOrders",
  "manageOrders",
  "viewExpenses",
  "manageExpenses",
  "viewPayroll",
  "viewProfitLoss",
  "viewReports",
  "manageSettings",
];

// GET — fetch a team member's permissions (OWNER only)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireRole("OWNER");
    if (error) return error;

    // Verify user belongs to same business
    const targetUser = await prisma.user.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
      select: { id: true, role: true, firstName: true, lastName: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const permissions = await getUserPermissions(targetUser.id, targetUser.role);

    return NextResponse.json({
      userId: targetUser.id,
      name: [targetUser.firstName, targetUser.lastName]
        .filter(Boolean)
        .join(" "),
      role: targetUser.role,
      permissions,
      preset: detectPreset(permissions),
    });
  } catch (error) {
    console.error("Error fetching staff permissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}

// PUT — update a team member's permissions (OWNER only)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireRole("OWNER");
    if (error) return error;

    // Verify user belongs to same business and is not OWNER
    const targetUser = await prisma.user.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.role === "OWNER") {
      return NextResponse.json(
        { error: "Cannot modify OWNER permissions" },
        { status: 400 }
      );
    }

    const body = await request.json();
    let permissionData: Record<string, boolean>;

    if (body.preset && PRESETS[body.preset]) {
      // Apply a named preset
      permissionData = { ...PRESETS[body.preset] };
    } else if (body.permissions) {
      // Apply custom permissions — only accept valid keys
      permissionData = {};
      for (const key of PERMISSION_KEYS) {
        if (typeof body.permissions[key] === "boolean") {
          permissionData[key] = body.permissions[key];
        }
      }
    } else {
      return NextResponse.json(
        { error: "Provide either 'preset' or 'permissions'" },
        { status: 400 }
      );
    }

    // Upsert the permissions row
    const row = await prisma.staffPermission.upsert({
      where: { userId: targetUser.id },
      create: {
        userId: targetUser.id,
        ...permissionData,
      },
      update: permissionData,
    });

    // Build response flags
    const flags: Record<string, boolean> = {};
    for (const key of PERMISSION_KEYS) {
      flags[key] = row[key];
    }

    return NextResponse.json({
      userId: targetUser.id,
      permissions: flags,
      preset: detectPreset(flags as any),
    });
  } catch (error) {
    console.error("Error updating staff permissions:", error);
    return NextResponse.json(
      { error: "Failed to update permissions" },
      { status: 500 }
    );
  }
}
