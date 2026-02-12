// lib/rbac.ts
// Role-based access control helper

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

// Role hierarchy: OWNER > MANAGER > STYLIST > ASSISTANT
const ROLE_LEVELS: Record<string, number> = {
  OWNER: 4,
  MANAGER: 3,
  STYLIST: 2,
  ASSISTANT: 1,
};

/**
 * Check if a user's role meets the minimum required role level.
 */
export function hasMinRole(userRole: string, minRole: string): boolean {
  return (ROLE_LEVELS[userRole] ?? 0) >= (ROLE_LEVELS[minRole] ?? 0);
}

/**
 * Get the authenticated session and verify the user has the minimum required role.
 * Returns { session, error } — if error is set, return it as the response.
 */
export async function requireRole(minRole: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.businessId) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!hasMinRole(session.user.role, minRole)) {
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
 * Get the authenticated session (any role). Shortcut for common pattern.
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.businessId) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { session, error: null };
}
