// lib/permissions.ts
// Granular staff permission system

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ============================================
// TYPES
// ============================================

export type PermissionKey =
  | "manageTeam"
  | "manageServices"
  | "viewShop"
  | "manageShop"
  | "viewProductCosts"
  | "viewOrders"
  | "createOrders"
  | "manageOrders"
  | "viewExpenses"
  | "manageExpenses"
  | "viewPayroll"
  | "viewProfitLoss"
  | "viewReports"
  | "manageSettings";

export type PermissionFlags = Record<PermissionKey, boolean>;

// ============================================
// PRESETS
// ============================================

const ALL_KEYS: PermissionKey[] = [
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

/** Staff preset: basic order access only */
export const STAFF_PRESET: PermissionFlags = {
  manageTeam: false,
  manageServices: false,
  viewShop: false,
  manageShop: false,
  viewProductCosts: false,
  viewOrders: true,
  createOrders: true,
  manageOrders: false,
  viewExpenses: false,
  manageExpenses: false,
  viewPayroll: false,
  viewProfitLoss: false,
  viewReports: false,
  manageSettings: false,
};

/** Manager preset: everything except payroll */
export const MANAGER_PRESET: PermissionFlags = {
  manageTeam: true,
  manageServices: true,
  viewShop: true,
  manageShop: true,
  viewProductCosts: true,
  viewOrders: true,
  createOrders: true,
  manageOrders: true,
  viewExpenses: true,
  manageExpenses: true,
  viewPayroll: false,
  viewProfitLoss: true,
  viewReports: true,
  manageSettings: true,
};

/** Full access preset: everything */
export const FULL_PRESET: PermissionFlags = {
  manageTeam: true,
  manageServices: true,
  viewShop: true,
  manageShop: true,
  viewProductCosts: true,
  viewOrders: true,
  createOrders: true,
  manageOrders: true,
  viewExpenses: true,
  manageExpenses: true,
  viewPayroll: true,
  viewProfitLoss: true,
  viewReports: true,
  manageSettings: true,
};

/** Map presets by name */
export const PRESETS: Record<string, PermissionFlags> = {
  staff: STAFF_PRESET,
  manager: MANAGER_PRESET,
  full: FULL_PRESET,
};

// ============================================
// HELPERS
// ============================================

/** Get the default preset for a role */
function presetForRole(role: string): PermissionFlags {
  switch (role) {
    case "MANAGER":
      return MANAGER_PRESET;
    case "STYLIST":
    case "ASSISTANT":
    default:
      return STAFF_PRESET;
  }
}

/** Detect which preset matches the given flags, or "custom" */
export function detectPreset(flags: PermissionFlags): string {
  for (const [name, preset] of Object.entries(PRESETS)) {
    const match = ALL_KEYS.every((key) => flags[key] === preset[key]);
    if (match) return name;
  }
  return "custom";
}

// ============================================
// SERVER-SIDE PERMISSION CHECK
// ============================================

/**
 * Check if the authenticated user has a specific permission.
 * Returns { session, error } — same pattern as requireAuth/requireRole.
 *
 * - OWNER always passes (full access, no DB lookup needed)
 * - Others: fetches StaffPermission row; auto-creates with role preset if missing
 */
export async function requirePermission(key: PermissionKey) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.businessId) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // OWNER bypasses all permission checks
  if (session.user.role === "OWNER") {
    return { session, error: null };
  }

  // Fetch or create permissions for this user
  const permissions = await getUserPermissions(
    session.user.id,
    session.user.role
  );

  if (!permissions[key]) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      ),
    };
  }

  return { session, error: null };
}

/**
 * Get all permission flags for a user.
 * Auto-creates a StaffPermission row if none exists (backfill).
 * For OWNER, returns all-true without DB lookup.
 */
export async function getUserPermissions(
  userId: string,
  role: string
): Promise<PermissionFlags> {
  // OWNER always has full access
  if (role === "OWNER") {
    return FULL_PRESET;
  }

  // Try to find existing permissions
  let row = await prisma.staffPermission.findUnique({
    where: { userId },
  });

  // Auto-create if missing (backfill for existing users)
  if (!row) {
    const defaults = presetForRole(role);
    row = await prisma.staffPermission.create({
      data: {
        userId,
        ...defaults,
      },
    });
  }

  // Extract only the permission flags
  const flags: PermissionFlags = {
    manageTeam: row.manageTeam,
    manageServices: row.manageServices,
    viewShop: row.viewShop,
    manageShop: row.manageShop,
    viewProductCosts: row.viewProductCosts,
    viewOrders: row.viewOrders,
    createOrders: row.createOrders,
    manageOrders: row.manageOrders,
    viewExpenses: row.viewExpenses,
    manageExpenses: row.manageExpenses,
    viewPayroll: row.viewPayroll,
    viewProfitLoss: row.viewProfitLoss,
    viewReports: row.viewReports,
    manageSettings: row.manageSettings,
  };

  return flags;
}
