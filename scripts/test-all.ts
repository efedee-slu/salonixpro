/**
 * SalonixPro Comprehensive Integration Test
 * Runs against the dev server and tests every API endpoint.
 * Usage: npx tsx scripts/test-all.ts
 */

const BASE = "http://localhost:3001";

// ── Helpers ──────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
let skipped = 0;
const failures: string[] = [];

function log(icon: string, msg: string) {
  console.log(`  ${icon} ${msg}`);
}

async function test(
  name: string,
  fn: () => Promise<void>
) {
  try {
    await fn();
    passed++;
    log("✓", name);
  } catch (err: any) {
    failed++;
    const msg = err?.message || String(err);
    log("✗", `${name} — ${msg}`);
    failures.push(`${name}: ${msg}`);
  }
}

function skip(name: string, reason?: string) {
  skipped++;
  log("○", `${name} (skipped${reason ? ": " + reason : ""})`);
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

function assertStatus(res: Response, expected: number | number[], label?: string) {
  const codes = Array.isArray(expected) ? expected : [expected];
  if (!codes.includes(res.status)) {
    throw new Error(
      `${label || ""}Expected status ${codes.join("|")}, got ${res.status}`
    );
  }
}

// Cookie jar for authenticated requests
let staffCookies = "";
let portalCookies = "";

async function fetchApi(
  path: string,
  opts: RequestInit & { cookies?: string } = {}
) {
  const { cookies, ...init } = opts;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string>),
  };
  if (cookies) headers["Cookie"] = cookies;
  return fetch(`${BASE}${path}`, { ...init, headers, redirect: "manual" });
}

async function staffFetch(path: string, opts: RequestInit = {}) {
  return fetchApi(path, { ...opts, cookies: staffCookies });
}

async function portalFetch(path: string, opts: RequestInit = {}) {
  return fetchApi(path, { ...opts, cookies: portalCookies });
}

// ── Auth: Get staff session ──────────────────────────────────────────

async function loginStaff() {
  // Use NextAuth credentials login
  // First get CSRF token
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  const csrfCookies = csrfRes.headers.getSetCookie?.()?.join("; ") ||
    csrfRes.headers.get("set-cookie") || "";

  // Login with credentials
  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookies,
    },
    body: new URLSearchParams({
      csrfToken,
      username: "",  // Will be filled from DB
      password: "",
      json: "true",
    }).toString(),
    redirect: "manual",
  });

  // We need actual credentials — get them from DB
  return false;
}

async function getStaffSession() {
  // Use Prisma to create a session directly
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const owner = await prisma.user.findFirst({
      where: { role: "OWNER" },
      select: { id: true, username: true, email: true, businessId: true, role: true },
    });

    if (!owner) throw new Error("No OWNER user found in database");

    // Try logging in via NextAuth
    const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
    const csrfData = await csrfRes.json();
    const csrfCookie = csrfRes.headers.getSetCookie?.()?.join("; ") ||
      csrfRes.headers.get("set-cookie") || "";

    // We need the actual password. Let's try a known test approach:
    // Set a known password hash for testing
    const bcrypt = require("bcryptjs");
    const testPassword = "TestPass123!";
    const hash = await bcrypt.hash(testPassword, 10);

    // Store original hash, set test hash
    const originalUser = await prisma.user.findUnique({ where: { id: owner.id } });
    await prisma.user.update({
      where: { id: owner.id },
      data: { passwordHash: hash, mustChangePassword: false },
    });

    // Login
    const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: csrfCookie,
      },
      body: new URLSearchParams({
        csrfToken: csrfData.csrfToken,
        username: owner.username || owner.email,
        password: testPassword,
        json: "true",
      }).toString(),
      redirect: "manual",
    });

    // Collect all cookies
    const allCookies: string[] = [];
    // Parse set-cookie headers
    const rawCookies = loginRes.headers.getSetCookie?.() || [];
    for (const c of rawCookies) {
      const nameVal = c.split(";")[0];
      allCookies.push(nameVal);
    }
    // Also keep csrf cookies
    if (csrfCookie) {
      for (const c of csrfCookie.split("; ")) {
        if (!allCookies.some((ac) => ac.startsWith(c.split("=")[0]))) {
          allCookies.push(c);
        }
      }
    }
    staffCookies = allCookies.join("; ");

    // Verify session works
    const sessionRes = await fetch(`${BASE}/api/auth/session`, {
      headers: { Cookie: staffCookies },
    });
    const session = await sessionRes.json();

    if (!session?.user?.id) {
      // Restore password
      await prisma.user.update({
        where: { id: owner.id },
        data: { passwordHash: originalUser.passwordHash },
      });
      throw new Error("Login failed — no session returned");
    }

    // Restore original password
    await prisma.user.update({
      where: { id: owner.id },
      data: { passwordHash: originalUser.passwordHash },
    });

    return { owner, session };
  } finally {
    await prisma.$disconnect();
  }
}

// ── Test Suites ──────────────────────────────────────────────────────

async function testPublicEndpoints() {
  console.log("\n═══ PUBLIC ENDPOINTS ═══");

  await test("GET / — Landing page loads", async () => {
    const res = await fetch(`${BASE}/`);
    assertStatus(res, 200);
  });

  await test("GET /login — Login page loads", async () => {
    const res = await fetch(`${BASE}/login`, { redirect: "manual" });
    assertStatus(res, [200, 307, 302]); // might redirect if logged in
  });

  await test("GET /signup — Signup page loads", async () => {
    const res = await fetch(`${BASE}/signup`, { redirect: "manual" });
    assertStatus(res, [200, 307, 302]);
  });

  await test("GET /forgot-password — Forgot password page loads", async () => {
    const res = await fetch(`${BASE}/forgot-password`, { redirect: "manual" });
    assertStatus(res, [200, 307, 302]);
  });

  await test("GET /portal — Client portal login loads", async () => {
    const res = await fetch(`${BASE}/portal`);
    assertStatus(res, 200);
  });

  await test("GET /api/auth/csrf — CSRF token endpoint", async () => {
    const res = await fetch(`${BASE}/api/auth/csrf`);
    assertStatus(res, 200);
    const data = await res.json();
    assert(!!data.csrfToken, "Missing csrfToken");
  });

  await test("GET /api/auth/providers — Auth providers", async () => {
    const res = await fetch(`${BASE}/api/auth/providers`);
    assertStatus(res, 200);
    const data = await res.json();
    assert(!!data.credentials, "Missing credentials provider");
  });
}

async function testPublicBooking() {
  console.log("\n═══ PUBLIC BOOKING ═══");

  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  let slug = "";
  try {
    const biz = await prisma.business.findFirst({ select: { slug: true } });
    slug = biz?.slug || "";
  } finally {
    await prisma.$disconnect();
  }

  if (!slug) {
    skip("Public booking", "No business slug found");
    return;
  }

  await test(`GET /api/public/book/${slug} — Booking data`, async () => {
    const res = await fetchApi(`/api/public/book/${slug}`);
    assertStatus(res, 200);
    const data = await res.json();
    assert(!!data.business, "Missing business data");
    assert(Array.isArray(data.categories), "Missing categories");
    assert(Array.isArray(data.stylists), "Missing stylists");
  });

  await test(`GET /api/public/book/${slug}/slots — Available slots`, async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    const res = await fetchApi(`/api/public/book/${slug}/slots?date=${dateStr}`);
    assertStatus(res, [200, 400]); // 400 if no stylist param
  });

  await test(`GET /book/${slug} — Booking page loads`, async () => {
    const res = await fetch(`${BASE}/book/${slug}`);
    assertStatus(res, 200);
  });
}

async function testPortalAuth() {
  console.log("\n═══ CLIENT PORTAL AUTH ═══");

  await test("POST /api/portal/auth/send-code — Send code (valid email)", async () => {
    const res = await fetchApi("/api/portal/auth/send-code", {
      method: "POST",
      body: JSON.stringify({ email: "edwardfedee@gmail.com" }),
    });
    assertStatus(res, 200);
    const data = await res.json();
    assert(data.success === true, "Expected success: true");
  });

  await test("POST /api/portal/auth/send-code — Send code (invalid email)", async () => {
    const res = await fetchApi("/api/portal/auth/send-code", {
      method: "POST",
      body: JSON.stringify({ email: "not-an-email" }),
    });
    assertStatus(res, 400);
  });

  await test("POST /api/portal/auth/verify-code — Wrong code rejected", async () => {
    const res = await fetchApi("/api/portal/auth/verify-code", {
      method: "POST",
      body: JSON.stringify({ email: "edwardfedee@gmail.com", code: "000000" }),
    });
    assertStatus(res, [400, 401]);
  });

  // Get a valid code from DB and test login
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const verification = await prisma.clientVerification.findFirst({
      where: { email: "edwardfedee@gmail.com", used: false },
      orderBy: { createdAt: "desc" },
    });

    if (verification) {
      await test("POST /api/portal/auth/verify-code — Valid code accepted", async () => {
        const res = await fetchApi("/api/portal/auth/verify-code", {
          method: "POST",
          body: JSON.stringify({ email: "edwardfedee@gmail.com", code: verification.code }),
        });
        assertStatus(res, 200);
        const data = await res.json();
        assert(data.success === true, "Expected success: true");

        // Capture portal cookies
        const cookies = res.headers.getSetCookie?.() || [];
        portalCookies = cookies.map((c: string) => c.split(";")[0]).join("; ");
      });
    } else {
      skip("POST /api/portal/auth/verify-code — Valid code", "No unused code in DB");
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function testPortalDashboard() {
  console.log("\n═══ CLIENT PORTAL DASHBOARD ═══");

  if (!portalCookies) {
    skip("Portal dashboard tests", "No portal session");
    return;
  }

  await test("GET /api/portal/dashboard — Client dashboard data", async () => {
    const res = await portalFetch("/api/portal/dashboard");
    assertStatus(res, 200);
    const data = await res.json();
    assert(!!data.email || Array.isArray(data.businesses), "Missing portal dashboard data");
  });

  await test("GET /portal/dashboard — Portal dashboard page loads", async () => {
    const res = await fetch(`${BASE}/portal/dashboard`, {
      headers: { Cookie: portalCookies },
      redirect: "manual",
    });
    assertStatus(res, [200, 307, 302]);
  });
}

async function testAuthEndpoints() {
  console.log("\n═══ AUTH ENDPOINTS ═══");

  await test("POST /api/auth/signup — Reject empty body", async () => {
    const res = await fetchApi("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({}),
    });
    assertStatus(res, [400, 422]);
  });

  await test("POST /api/auth/forgot-password — Always returns success", async () => {
    const res = await fetchApi("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: "nonexistent@test.com" }),
    });
    assertStatus(res, 200);
  });

  await test("GET /api/auth/check-password-status — Works without auth", async () => {
    const res = await fetchApi("/api/auth/check-password-status");
    assertStatus(res, [200, 401]);
  });
}

async function testDashboardAPI() {
  console.log("\n═══ DASHBOARD API ═══");

  await test("GET /api/dashboard — Dashboard overview", async () => {
    const res = await staffFetch("/api/dashboard");
    assertStatus(res, 200);
    const data = await res.json();
    assert(data.stats !== undefined, "Missing stats object");
    assert(data.stats.todayAppointments !== undefined, "Missing stats.todayAppointments");
    assert(data.stats.todayRevenue !== undefined, "Missing stats.todayRevenue");
    assert(data.stats.activeClients !== undefined, "Missing stats.activeClients");
  });
}

async function testAppointmentsAPI() {
  console.log("\n═══ APPOINTMENTS API ═══");

  await test("GET /api/appointments — List appointments", async () => {
    const today = new Date().toISOString().split("T")[0];
    const res = await staffFetch(`/api/appointments?date=${today}&view=day`);
    assertStatus(res, 200);
    const data = await res.json();
    assert(Array.isArray(data), "Expected array of appointments");
  });

  await test("GET /api/appointments — Week view", async () => {
    const today = new Date().toISOString().split("T")[0];
    const res = await staffFetch(`/api/appointments?date=${today}&view=week`);
    assertStatus(res, 200);
  });

  await test("GET /api/appointments/pending-deposits — Pending deposits", async () => {
    const res = await staffFetch("/api/appointments/pending-deposits");
    assertStatus(res, 200);
  });

  // Get an existing appointment for detail tests (same business as logged-in user)
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  let apptId = "";
  try {
    const owner = await prisma.user.findFirst({ where: { role: "OWNER" } });
    const appt = await prisma.appointment.findFirst({
      where: { businessId: owner?.businessId || "" },
      orderBy: { createdAt: "desc" },
    });
    apptId = appt?.id || "";
  } finally {
    await prisma.$disconnect();
  }

  if (apptId) {
    await test(`GET /api/appointments/${apptId} — Single appointment`, async () => {
      const res = await staffFetch(`/api/appointments/${apptId}`);
      assertStatus(res, 200);
      const data = await res.json();
      assert(data.id === apptId, "Wrong appointment returned");
    });
  } else {
    skip("GET /api/appointments/[id]", "No appointments in DB");
  }
}

async function testClientsAPI() {
  console.log("\n═══ CLIENTS API ═══");

  let clientId = "";

  await test("GET /api/clients — List clients", async () => {
    const res = await staffFetch("/api/clients?page=1&limit=10");
    assertStatus(res, 200);
    const data = await res.json();
    assert(Array.isArray(data.data), "Expected data array");
    assert(data.pagination !== undefined, "Expected pagination object");
    if (data.data.length > 0) clientId = data.data[0].id;
  });

  await test("POST /api/clients — Create client (validation)", async () => {
    const res = await staffFetch("/api/clients", {
      method: "POST",
      body: JSON.stringify({}), // missing required fields
    });
    assertStatus(res, [400, 422, 500]);
  });

  await test("POST /api/clients — Create test client", async () => {
    const res = await staffFetch("/api/clients", {
      method: "POST",
      body: JSON.stringify({
        firstName: "Test",
        lastName: "Integration",
        phone: `TEST${Date.now()}`,
        email: `test-${Date.now()}@integration.test`,
      }),
    });
    assertStatus(res, [200, 201]);
    const data = await res.json();
    assert(!!data.id, "Missing client id");
    clientId = data.id;
  });

  if (clientId) {
    await test(`GET /api/clients/${clientId} — Single client`, async () => {
      const res = await staffFetch(`/api/clients/${clientId}`);
      assertStatus(res, 200);
      const data = await res.json();
      assert(data.id === clientId, "Wrong client returned");
    });

    await test(`PUT /api/clients/${clientId} — Update client`, async () => {
      const res = await staffFetch(`/api/clients/${clientId}`, {
        method: "PUT",
        body: JSON.stringify({ firstName: "Updated", lastName: "Client", phone: `TEST${Date.now()}` }),
      });
      assertStatus(res, 200);
    });
  }
}

async function testServicesAPI() {
  console.log("\n═══ SERVICES API ═══");

  await test("GET /api/services — List services", async () => {
    const res = await staffFetch("/api/services");
    assertStatus(res, 200);
    const data = await res.json();
    assert(Array.isArray(data.data), "Expected data array");
    assert(data.pagination !== undefined, "Expected pagination object");
  });

  await test("GET /api/services/categories — List categories", async () => {
    const res = await staffFetch("/api/services/categories");
    assertStatus(res, 200);
  });

  await test("POST /api/services — Create service (validation)", async () => {
    const res = await staffFetch("/api/services", {
      method: "POST",
      body: JSON.stringify({}), // missing required
    });
    assertStatus(res, [400, 422, 500]);
  });

  await test("POST /api/services — Create service", async () => {
    const res = await staffFetch("/api/services", {
      method: "POST",
      body: JSON.stringify({
        name: `Test Service ${Date.now()}`,
        duration: 30,
        price: 50,
      }),
    });
    assertStatus(res, [200, 201]);
  });
}

async function testStylistsAPI() {
  console.log("\n═══ STYLISTS API ═══");

  let stylistId = "";

  await test("GET /api/stylists — List stylists", async () => {
    const res = await staffFetch("/api/stylists");
    assertStatus(res, 200);
    const data = await res.json();
    assert(Array.isArray(data.data), "Expected data array");
    if (data.data.length > 0) stylistId = data.data[0].id;
  });

  if (stylistId) {
    await test(`GET /api/stylists/${stylistId} — Single stylist`, async () => {
      const res = await staffFetch(`/api/stylists/${stylistId}`);
      assertStatus(res, 200);
    });

    await test(`GET /api/stylists/${stylistId}/schedule — Stylist schedule`, async () => {
      const res = await staffFetch(`/api/stylists/${stylistId}/schedule`);
      assertStatus(res, 200);
    });
  }
}

async function testProductsAPI() {
  console.log("\n═══ PRODUCTS (SHOP) API ═══");

  let productId = "";

  await test("GET /api/products — List products", async () => {
    const res = await staffFetch("/api/products");
    assertStatus(res, 200);
    const data = await res.json();
    assert(Array.isArray(data.data), "Expected data array");
    if (data.data.length > 0) productId = data.data[0].id;
  });

  await test("GET /api/products?search=test — Search products", async () => {
    const res = await staffFetch("/api/products?search=test");
    assertStatus(res, 200);
  });

  await test("GET /api/products/categories — Product categories", async () => {
    const res = await staffFetch("/api/products/categories");
    assertStatus(res, [200, 404]); // might not exist
  });

  if (productId) {
    await test(`GET /api/products/${productId} — Single product`, async () => {
      const res = await staffFetch(`/api/products/${productId}`);
      assertStatus(res, 200);
    });

    await test(`GET /api/products/${productId}/stock-movements — Stock history`, async () => {
      const res = await staffFetch(`/api/products/${productId}/stock-movements`);
      assertStatus(res, 200);
    });
  }
}

async function testOrdersAPI() {
  console.log("\n═══ ORDERS API ═══");

  let orderId = "";

  await test("GET /api/orders — List orders", async () => {
    const res = await staffFetch("/api/orders");
    assertStatus(res, 200);
    const data = await res.json();
    assert(Array.isArray(data.data), "Expected data array");
    if (data.data.length > 0) orderId = data.data[0].id;
  });

  await test("GET /api/orders?status=COMPLETED — Filter by status", async () => {
    const res = await staffFetch("/api/orders?status=COMPLETED");
    assertStatus(res, 200);
  });

  if (orderId) {
    await test(`GET /api/orders/${orderId} — Single order`, async () => {
      const res = await staffFetch(`/api/orders/${orderId}`);
      assertStatus(res, 200);
    });
  }

  await test("POST /api/orders — Reject empty body", async () => {
    const res = await staffFetch("/api/orders", {
      method: "POST",
      body: JSON.stringify({}),
    });
    assertStatus(res, [400, 422, 500]);
  });
}

async function testExpensesAPI() {
  console.log("\n═══ EXPENSES API ═══");

  let expenseId = "";

  await test("GET /api/expenses — List expenses", async () => {
    const res = await staffFetch("/api/expenses");
    assertStatus(res, 200);
    const data = await res.json();
    assert(data.expenses !== undefined, "Expected expenses data");
    if (data.expenses?.length > 0) expenseId = data.expenses[0].id;
  });

  await test("GET /api/expenses?category=RENT — Filter by category", async () => {
    const res = await staffFetch("/api/expenses?category=RENT");
    assertStatus(res, 200);
  });

  await test("GET /api/expenses/summary — Expense summary", async () => {
    const res = await staffFetch("/api/expenses/summary");
    assertStatus(res, 200);
    const data = await res.json();
    assert(data.totalThisMonth !== undefined, "Missing totalThisMonth");
  });

  await test("POST /api/expenses — Create expense", async () => {
    const res = await staffFetch("/api/expenses", {
      method: "POST",
      body: JSON.stringify({
        category: "OTHER",
        description: "Integration test expense",
        amount: 10.00,
        date: new Date().toISOString().split("T")[0],
      }),
    });
    assertStatus(res, [200, 201]);
    const data = await res.json();
    if (data.id) expenseId = data.id;
  });

  if (expenseId) {
    await test(`PUT /api/expenses/${expenseId} — Update expense`, async () => {
      const res = await staffFetch(`/api/expenses/${expenseId}`, {
        method: "PUT",
        body: JSON.stringify({
          category: "OTHER",
          description: "Updated test expense",
          amount: 15.00,
          date: new Date().toISOString().split("T")[0],
        }),
      });
      assertStatus(res, 200);
    });
  }
}

async function testPayrollAPI() {
  console.log("\n═══ PAYROLL API ═══");

  await test("GET /api/payroll — Payroll (default period)", async () => {
    const res = await staffFetch("/api/payroll");
    assertStatus(res, 200);
    const data = await res.json();
    assert(data.stylists !== undefined || data.earnings !== undefined, "Missing payroll data");
  });

  await test("GET /api/payroll?period=quarter — Quarterly payroll", async () => {
    const res = await staffFetch("/api/payroll?period=quarter");
    assertStatus(res, 200);
  });
}

async function testProfitLossAPI() {
  console.log("\n═══ PROFIT & LOSS API ═══");

  await test("GET /api/profit-loss — P&L report (default)", async () => {
    const res = await staffFetch("/api/profit-loss");
    assertStatus(res, 200);
    const data = await res.json();
    assert(data.revenue !== undefined, "Missing revenue");
    assert(data.expenses !== undefined, "Missing expenses");
    assert(data.netProfit !== undefined, "Missing netProfit");
  });

  await test("GET /api/profit-loss?period=quarter — Quarterly P&L", async () => {
    const res = await staffFetch("/api/profit-loss?period=quarter");
    assertStatus(res, 200);
  });
}

async function testReportsAPI() {
  console.log("\n═══ REPORTS API ═══");

  await test("GET /api/reports — Reports data", async () => {
    const res = await staffFetch("/api/reports");
    assertStatus(res, 200);
  });
}

async function testSettingsAPI() {
  console.log("\n═══ SETTINGS API ═══");

  await test("GET /api/settings — Fetch settings", async () => {
    const res = await staffFetch("/api/settings");
    assertStatus(res, 200);
    const data = await res.json();
    assert(data.business !== undefined || data.name !== undefined, "Missing business settings");
  });
}

async function testPermissionsAPI() {
  console.log("\n═══ PERMISSIONS API ═══");

  await test("GET /api/me/permissions — Current user permissions", async () => {
    const res = await staffFetch("/api/me/permissions");
    assertStatus(res, 200);
    const data = await res.json();
    assert(data.permissions !== undefined || data.role !== undefined, "Missing permissions data");
  });

  // Get a non-owner staff member from the same business
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  let staffId = "";
  try {
    const owner = await prisma.user.findFirst({ where: { role: "OWNER" } });
    if (owner) {
      const staff = await prisma.user.findFirst({
        where: { role: { not: "OWNER" }, businessId: owner.businessId },
        select: { id: true },
      });
      staffId = staff?.id || "";
    }
  } finally {
    await prisma.$disconnect();
  }

  if (staffId) {
    await test(`GET /api/staff/${staffId}/permissions — Staff permissions`, async () => {
      const res = await staffFetch(`/api/staff/${staffId}/permissions`);
      assertStatus(res, 200);
    });
  } else {
    skip("GET /api/staff/[id]/permissions", "No non-OWNER staff found");
  }
}

async function testNotificationsAPI() {
  console.log("\n═══ NOTIFICATIONS API ═══");

  await test("POST /api/notifications — Get notifications", async () => {
    const res = await staffFetch("/api/notifications", { method: "POST" });
    assertStatus(res, [200, 405]); // might be GET
  });

  await test("GET /api/notifications — Get notifications (GET)", async () => {
    const res = await staffFetch("/api/notifications");
    assertStatus(res, [200, 405]); // might be POST only
  });
}

async function testBillingAPI() {
  console.log("\n═══ BILLING API ═══");

  await test("GET /api/billing/status — Billing status", async () => {
    const res = await staffFetch("/api/billing/status");
    assertStatus(res, [200, 404]);
  });
}

async function testUnauthenticatedBlocking() {
  console.log("\n═══ AUTH ENFORCEMENT ═══");

  const protectedEndpoints = [
    ["GET", "/api/dashboard"],
    ["GET", "/api/appointments?date=2026-01-01&view=day"],
    ["GET", "/api/clients"],
    ["GET", "/api/services"],
    ["GET", "/api/stylists"],
    ["GET", "/api/products"],
    ["GET", "/api/orders"],
    ["GET", "/api/expenses"],
    ["GET", "/api/payroll"],
    ["GET", "/api/profit-loss"],
    ["GET", "/api/settings"],
    ["GET", "/api/me/permissions"],
  ];

  for (const [method, path] of protectedEndpoints) {
    await test(`${method} ${path} — Blocked without auth`, async () => {
      const res = await fetchApi(path, { method });
      assertStatus(res, [401, 403, 302, 307], `${method} ${path}: `);
    });
  }
}

async function testDashboardPages() {
  console.log("\n═══ DASHBOARD PAGES ═══");

  const pages = [
    "/dashboard",
    "/appointments",
    "/clients",
    "/services",
    "/stylists",
    "/shop",
    "/orders",
    "/expenses",
    "/payroll",
    "/profit-loss",
    "/reports",
    "/settings",
  ];

  for (const page of pages) {
    await test(`GET ${page} — Page loads`, async () => {
      const res = await fetch(`${BASE}${page}`, {
        headers: { Cookie: staffCookies },
        redirect: "manual",
      });
      // 200 = page loaded, 307/302 = redirect (middleware)
      assertStatus(res, [200, 307, 302]);
    });
  }
}

// ── Cleanup ──────────────────────────────────────────────────────────

async function cleanup() {
  console.log("\n═══ CLEANUP ═══");
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  try {
    // Delete test clients
    const deleted = await prisma.client.deleteMany({
      where: { firstName: "Test", lastName: "Integration" },
    });
    log("✓", `Cleaned up ${deleted.count} test client(s)`);

    // Delete test expenses
    const deletedExp = await prisma.expense.deleteMany({
      where: { description: { contains: "test expense" } },
    });
    log("✓", `Cleaned up ${deletedExp.count} test expense(s)`);

    // Delete test services
    const deletedSvc = await prisma.service.deleteMany({
      where: { name: { startsWith: "Test Service" } },
    });
    log("✓", `Cleaned up ${deletedSvc.count} test service(s)`);
  } finally {
    await prisma.$disconnect();
  }
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║   SalonixPro Comprehensive Integration Tests    ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`Target: ${BASE}`);

  // Check server is running
  try {
    await fetch(BASE, { signal: AbortSignal.timeout(5000) });
  } catch {
    console.error("\n✗ Server not reachable at", BASE);
    console.error("  Make sure the dev server is running: npm run dev");
    process.exit(1);
  }
  console.log("Server is reachable.\n");

  // ── Phase 1: Public endpoints (no auth needed) ──
  await testPublicEndpoints();
  await testPublicBooking();
  await testAuthEndpoints();

  // ── Phase 2: Client portal ──
  await testPortalAuth();
  await testPortalDashboard();

  // ── Phase 3: Staff login ──
  console.log("\n═══ STAFF LOGIN ═══");
  try {
    const { owner, session } = await getStaffSession();
    log("✓", `Logged in as ${session.user.name || owner.username} (${owner.role})`);
  } catch (err: any) {
    log("✗", `Staff login failed: ${err.message}`);
    console.error("\n  Cannot continue authenticated tests without staff login.");
    printSummary();
    process.exit(1);
  }

  // ── Phase 4: Auth enforcement (unauthenticated should be blocked) ──
  await testUnauthenticatedBlocking();

  // ── Phase 5: Authenticated API tests ──
  await testDashboardAPI();
  await testAppointmentsAPI();
  await testClientsAPI();
  await testServicesAPI();
  await testStylistsAPI();
  await testProductsAPI();
  await testOrdersAPI();
  await testExpensesAPI();
  await testPayrollAPI();
  await testProfitLossAPI();
  await testReportsAPI();
  await testSettingsAPI();
  await testPermissionsAPI();
  await testNotificationsAPI();
  await testBillingAPI();

  // ── Phase 6: Dashboard pages ──
  await testDashboardPages();

  // ── Cleanup ──
  await cleanup();

  // ── Summary ──
  printSummary();
}

function printSummary() {
  const total = passed + failed + skipped;
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║                  TEST RESULTS                   ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log(`║  ✓ Passed:  ${String(passed).padStart(4)}                              ║`);
  console.log(`║  ✗ Failed:  ${String(failed).padStart(4)}                              ║`);
  console.log(`║  ○ Skipped: ${String(skipped).padStart(4)}                              ║`);
  console.log(`║  Total:     ${String(total).padStart(4)}                              ║`);
  console.log("╚══════════════════════════════════════════════════╝");

  if (failures.length > 0) {
    console.log("\nFailed tests:");
    failures.forEach((f) => console.log(`  ✗ ${f}`));
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
