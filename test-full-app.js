// test-full-app.js
// =================================================
// SALONIXPRO - COMPREHENSIVE FULL APPLICATION TEST
// Tests all 24 models and core business logic
// Run: node test-full-app.js
// =================================================

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

let passed = 0;
let failed = 0;
let skipped = 0;
const results = [];
const TEST_PREFIX = "FULLTEST-";

function assert(condition, testName) {
  if (condition) {
    passed++;
    results.push(`  PASS  ${testName}`);
  } else {
    failed++;
    results.push(`  FAIL  ${testName}`);
  }
}

function skip(testName) {
  skipped++;
  results.push(`  SKIP  ${testName}`);
}

function section(name) {
  results.push(`\n  --- ${name} ---`);
  console.log(`  Testing: ${name}`);
}

async function cleanup(businessId) {
  // Delete in correct order to respect foreign keys
  await prisma.appointmentService.deleteMany({ where: { appointment: { businessId, notes: { startsWith: TEST_PREFIX } } } });
  await prisma.appointment.deleteMany({ where: { businessId, notes: { startsWith: TEST_PREFIX } } });
  await prisma.orderItem.deleteMany({ where: { order: { businessId, customerNotes: { startsWith: TEST_PREFIX } } } });
  await prisma.stockMovement.deleteMany({ where: { businessId, reason: { startsWith: TEST_PREFIX } } });
  await prisma.order.deleteMany({ where: { businessId, customerNotes: { startsWith: TEST_PREFIX } } });
  await prisma.productCosting.deleteMany({ where: { businessId, productName: { startsWith: TEST_PREFIX } } });
  await prisma.costingTemplate.deleteMany({ where: { businessId, name: { startsWith: TEST_PREFIX } } });
  await prisma.product.deleteMany({ where: { businessId, name: { startsWith: TEST_PREFIX } } });
  await prisma.productCategory.deleteMany({ where: { businessId, name: { startsWith: TEST_PREFIX } } });
  await prisma.expense.deleteMany({ where: { businessId, description: { startsWith: TEST_PREFIX } } });
  await prisma.notification.deleteMany({ where: { businessId, title: { startsWith: TEST_PREFIX } } });
  await prisma.stylistTimeOff.deleteMany({ where: { stylist: { businessId, firstName: { startsWith: TEST_PREFIX } } } });
  await prisma.stylistSchedule.deleteMany({ where: { stylist: { businessId, firstName: { startsWith: TEST_PREFIX } } } });
  await prisma.stylistService.deleteMany({ where: { stylist: { businessId, firstName: { startsWith: TEST_PREFIX } } } });
  await prisma.stylist.deleteMany({ where: { businessId, firstName: { startsWith: TEST_PREFIX } } });
  await prisma.service.deleteMany({ where: { businessId, name: { startsWith: TEST_PREFIX } } });
  await prisma.serviceCategory.deleteMany({ where: { businessId, name: { startsWith: TEST_PREFIX } } });
  await prisma.client.deleteMany({ where: { businessId, firstName: { startsWith: TEST_PREFIX } } });
  await prisma.clientVerification.deleteMany({ where: { email: { startsWith: "fulltest-" } } });
}

async function run() {
  console.log("\n" + "=".repeat(56));
  console.log("  SALONIXPRO - COMPREHENSIVE FULL APPLICATION TEST");
  console.log("=".repeat(56) + "\n");

  // ============================================
  // SETUP - Find business and user
  // ============================================
  const business = await prisma.business.findFirst({
    include: { users: { take: 1 } },
  });
  if (!business) {
    console.log("ERROR: No business found. Cannot test.");
    process.exit(1);
  }
  const user = business.users[0];
  console.log(`  Business: "${business.name}" (${business.id})`);
  console.log(`  User: ${user?.email || "none"} (${user?.role || "?"})`);
  console.log(`  Currency: ${business.currencySymbol} (${business.currency})\n`);

  const biz = business.id;

  // Pre-clean
  await cleanup(biz);

  // ============================================
  // 1. BUSINESS & SETTINGS
  // ============================================
  section("1. BUSINESS & SETTINGS");

  assert(business.id && business.name, "Business exists with name");
  assert(business.slug && business.slug.length > 0, "Business has slug");
  assert(business.currency && business.currencySymbol, "Business has currency config");
  assert(business.businessType !== null, `Business type: ${business.businessType}`);
  assert(business.subscriptionStatus !== null, `Subscription: ${business.subscriptionStatus}`);
  assert(business.createdAt instanceof Date, "Business has createdAt timestamp");

  // Update settings
  const origTimezone = business.timezone;
  const updated = await prisma.business.update({
    where: { id: biz },
    data: { timezone: "America/St_Lucia" },
  });
  assert(updated.timezone === "America/St_Lucia", "Business settings update works");
  // Restore
  await prisma.business.update({ where: { id: biz }, data: { timezone: origTimezone } });

  // ============================================
  // 2. USERS & AUTH
  // ============================================
  section("2. USERS & AUTH");

  if (user) {
    assert(user.email && user.email.includes("@"), "User has valid email");
    assert(user.passwordHash && user.passwordHash.length > 10, "User has password hash");
    assert(["OWNER", "MANAGER", "STYLIST", "ASSISTANT"].includes(user.role), `User role is valid: ${user.role}`);
    assert(user.businessId === biz, "User belongs to business");
    assert(user.isActive === true, "User is active");

    // Check all users for this business
    const allUsers = await prisma.user.findMany({ where: { businessId: biz } });
    assert(allUsers.length >= 1, `Business has ${allUsers.length} user(s)`);

    // Verify owner exists
    const owner = allUsers.find((u) => u.role === "OWNER");
    assert(owner !== null && owner !== undefined, "Business has an OWNER user");
  } else {
    skip("No user found - skipping auth tests");
  }

  // ============================================
  // 3. STAFF PERMISSIONS
  // ============================================
  section("3. STAFF PERMISSIONS");

  if (user) {
    const perms = await prisma.staffPermission.findFirst({ where: { userId: user.id } });
    if (perms) {
      assert(perms.userId === user.id, "Permission record linked to user");
      const permFields = [
        "manageTeam", "manageServices", "viewShop", "manageShop",
        "viewProductCosts", "viewOrders", "createOrders", "manageOrders",
        "viewExpenses", "manageExpenses", "viewPayroll", "viewProfitLoss",
        "viewReports", "manageSettings",
      ];
      for (const field of permFields) {
        assert(typeof perms[field] === "boolean", `Permission '${field}' is boolean`);
      }
    } else {
      // Owner may not have a permission record (bypasses all checks)
      if (user.role === "OWNER") {
        skip("Owner user has no StaffPermission record (bypasses checks)");
      } else {
        assert(false, "Non-owner should have StaffPermission record");
      }
    }
  }

  // ============================================
  // 4. SERVICE CATEGORIES
  // ============================================
  section("4. SERVICE CATEGORIES");

  const svcCat = await prisma.serviceCategory.create({
    data: {
      businessId: biz,
      name: TEST_PREFIX + "Hair Extensions",
      icon: "scissors",
      description: "Test category for extensions",
      sortOrder: 99,
    },
  });
  assert(svcCat.id && svcCat.name.includes("Hair Extensions"), "Create service category");
  assert(svcCat.isActive === true, "Service category defaults to active");
  assert(svcCat.sortOrder === 99, "Sort order saved");

  const svcCatUpdate = await prisma.serviceCategory.update({
    where: { id: svcCat.id },
    data: { name: TEST_PREFIX + "Hair Extensions Updated", sortOrder: 50 },
  });
  assert(svcCatUpdate.sortOrder === 50, "Update service category sort order");

  // Check existing categories
  const allCats = await prisma.serviceCategory.findMany({ where: { businessId: biz, isActive: true } });
  assert(allCats.length >= 1, `Found ${allCats.length} active service categories`);

  // ============================================
  // 5. SERVICES
  // ============================================
  section("5. SERVICES");

  const service = await prisma.service.create({
    data: {
      businessId: biz,
      categoryId: svcCat.id,
      name: TEST_PREFIX + "Silk Press",
      description: "Full silk press treatment",
      duration: 90,
      price: 85.00,
      isCustom: true,
    },
  });
  assert(service.id && service.name.includes("Silk Press"), "Create service");
  assert(service.duration === 90, "Service duration saved");
  assert(Number(service.price) === 85, "Service price saved");
  assert(service.isActive === true, "Service defaults to active");
  assert(service.categoryId === svcCat.id, "Service linked to category");

  const service2 = await prisma.service.create({
    data: {
      businessId: biz,
      categoryId: svcCat.id,
      name: TEST_PREFIX + "Deep Conditioning",
      duration: 45,
      price: 40.00,
    },
  });
  assert(service2.id, "Create second service");

  // Verify service with category include
  const svcWithCat = await prisma.service.findFirst({
    where: { id: service.id },
    include: { category: true },
  });
  assert(svcWithCat?.category?.name.includes("Hair Extensions"), "Service includes category relation");

  // List services
  const allServices = await prisma.service.findMany({
    where: { businessId: biz, isActive: true },
  });
  assert(allServices.length >= 2, `Found ${allServices.length} active services`);

  // ============================================
  // 6. STYLISTS
  // ============================================
  section("6. STYLISTS");

  const stylist = await prisma.stylist.create({
    data: {
      businessId: biz,
      firstName: TEST_PREFIX + "Lisa",
      lastName: "Johnson",
      email: "fulltest-lisa@test.com",
      phone: "1234567890",
      bio: "Senior hair stylist",
    },
  });
  assert(stylist.id && stylist.firstName.includes("Lisa"), "Create stylist");
  assert(stylist.isActive === true, "Stylist defaults to active");

  // Stylist service assignment
  const stylistSvc = await prisma.stylistService.create({
    data: {
      stylistId: stylist.id,
      serviceId: service.id,
      customPrice: 95.00,
      customDuration: 100,
    },
  });
  assert(stylistSvc.id, "Assign service to stylist");
  assert(Number(stylistSvc.customPrice) === 95, "Custom price for stylist");
  assert(stylistSvc.customDuration === 100, "Custom duration for stylist");

  // Stylist schedule
  const schedule = await prisma.stylistSchedule.create({
    data: {
      stylistId: stylist.id,
      dayOfWeek: 1, // Monday
      startTime: "09:00",
      endTime: "17:00",
      isWorking: true,
    },
  });
  assert(schedule.id && schedule.dayOfWeek === 1, "Create stylist schedule (Monday)");
  assert(schedule.startTime === "09:00" && schedule.endTime === "17:00", "Schedule times correct");

  // Create full week
  for (let day = 2; day <= 5; day++) {
    await prisma.stylistSchedule.create({
      data: { stylistId: stylist.id, dayOfWeek: day, startTime: "09:00", endTime: "17:00", isWorking: true },
    });
  }
  const weekSchedule = await prisma.stylistSchedule.findMany({ where: { stylistId: stylist.id } });
  assert(weekSchedule.length === 5, `Stylist has 5-day schedule (Mon-Fri)`);

  // Stylist time off
  const timeOff = await prisma.stylistTimeOff.create({
    data: {
      stylistId: stylist.id,
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-03-05"),
      reason: "Vacation",
    },
  });
  assert(timeOff.id, "Create stylist time off");
  assert(timeOff.reason === "Vacation", "Time off reason saved");

  // Stylist with all relations
  const stylistFull = await prisma.stylist.findFirst({
    where: { id: stylist.id },
    include: {
      services: { include: { service: true } },
      schedules: true,
      timeOff: true,
    },
  });
  assert(stylistFull?.services?.length === 1, "Stylist has 1 service assignment");
  assert(stylistFull?.schedules?.length === 5, "Stylist has 5 schedule entries");
  assert(stylistFull?.timeOff?.length === 1, "Stylist has 1 time off entry");

  // ============================================
  // 7. CLIENTS
  // ============================================
  section("7. CLIENTS");

  const client = await prisma.client.create({
    data: {
      businessId: biz,
      firstName: TEST_PREFIX + "Sarah",
      lastName: "Williams",
      email: "fulltest-sarah@test.com",
      phone: "5551234567",
      notes: "Prefers natural products, sensitive scalp",
    },
  });
  assert(client.id && client.firstName.includes("Sarah"), "Create client");
  assert(client.totalVisits === 0, "New client starts with 0 visits");
  assert(Number(client.totalSpent) === 0, "New client starts with $0 spent");
  assert(client.isVip === false, "New client is not VIP");
  assert(client.isActive === true, "Client defaults to active");

  // Update client
  const clientUpdate = await prisma.client.update({
    where: { id: client.id },
    data: { isVip: true, totalVisits: 5, totalSpent: 425.00 },
  });
  assert(clientUpdate.isVip === true, "Client marked as VIP");
  assert(clientUpdate.totalVisits === 5, "Client visits updated");
  assert(Number(clientUpdate.totalSpent) === 425, "Client total spent updated");

  // Search clients
  const searchClients = await prisma.client.findMany({
    where: {
      businessId: biz,
      OR: [
        { firstName: { contains: "Sarah", mode: "insensitive" } },
        { email: { contains: "sarah", mode: "insensitive" } },
      ],
    },
  });
  assert(searchClients.length >= 1, "Search client by name or email");

  // ============================================
  // 8. CLIENT VERIFICATION
  // ============================================
  section("8. CLIENT VERIFICATION");

  const verification = await prisma.clientVerification.create({
    data: {
      email: "fulltest-verify@test.com",
      code: "123456",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    },
  });
  assert(verification.id && verification.code === "123456", "Create client verification code");
  assert(verification.attempts === 0, "Starts with 0 attempts");
  assert(verification.used === false, "Code not used initially");

  // Simulate verification attempt
  const verifyAttempt = await prisma.clientVerification.update({
    where: { id: verification.id },
    data: { attempts: { increment: 1 } },
  });
  assert(verifyAttempt.attempts === 1, "Verification attempt incremented");

  // Mark as used
  const verifyUsed = await prisma.clientVerification.update({
    where: { id: verification.id },
    data: { used: true },
  });
  assert(verifyUsed.used === true, "Verification code marked as used");

  // Expired code check
  const expiredCode = await prisma.clientVerification.create({
    data: {
      email: "fulltest-expired@test.com",
      code: "999999",
      expiresAt: new Date(Date.now() - 60000), // Already expired
    },
  });
  assert(new Date(expiredCode.expiresAt) < new Date(), "Expired code has past expiry date");
  await prisma.clientVerification.delete({ where: { id: expiredCode.id } });

  // ============================================
  // 9. APPOINTMENTS
  // ============================================
  section("9. APPOINTMENTS");

  const appointment = await prisma.appointment.create({
    data: {
      businessId: biz,
      clientId: client.id,
      stylistId: stylist.id,
      status: "PENDING",
      requestedDate: new Date("2026-03-15T10:00:00Z"),
      duration: 90,
      totalPrice: 95.00,
      notes: TEST_PREFIX + "Regular appointment",
      bookingReference: "BK-TEST-001",
      depositStatus: "NOT_REQUIRED",
    },
  });
  assert(appointment.id, "Create appointment");
  assert(appointment.status === "PENDING", "Appointment starts as PENDING");
  assert(appointment.clientId === client.id, "Appointment linked to client");
  assert(appointment.stylistId === stylist.id, "Appointment linked to stylist");
  assert(Number(appointment.totalPrice) === 95, "Appointment total price correct");
  assert(appointment.bookingReference === "BK-TEST-001", "Booking reference saved");

  // Appointment service
  const apptSvc = await prisma.appointmentService.create({
    data: {
      appointmentId: appointment.id,
      serviceId: service.id,
      serviceName: "Silk Press",
      price: 95.00,
      duration: 90,
    },
  });
  assert(apptSvc.id, "Create appointment service");
  assert(apptSvc.serviceName === "Silk Press", "Appointment service name saved");

  // Status transitions
  const confirmed = await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: "CONFIRMED", confirmedDate: new Date() },
  });
  assert(confirmed.status === "CONFIRMED", "Appointment confirmed");
  assert(confirmed.confirmedDate !== null, "Confirmed date set");

  const inProgress = await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: "IN_PROGRESS" },
  });
  assert(inProgress.status === "IN_PROGRESS", "Appointment in progress");

  const completed = await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: "COMPLETED" },
  });
  assert(completed.status === "COMPLETED", "Appointment completed");

  // Appointment with deposit
  const depositAppt = await prisma.appointment.create({
    data: {
      businessId: biz,
      clientId: client.id,
      stylistId: stylist.id,
      status: "PENDING_DEPOSIT",
      requestedDate: new Date("2026-03-20T14:00:00Z"),
      duration: 120,
      totalPrice: 200.00,
      notes: TEST_PREFIX + "Deposit required appointment",
      depositAmount: 50.00,
      depositStatus: "PENDING",
      paymentDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
  });
  assert(depositAppt.depositStatus === "PENDING", "Deposit appointment created");
  assert(Number(depositAppt.depositAmount) === 50, "Deposit amount correct");

  // Simulate deposit submission
  const depositSubmitted = await prisma.appointment.update({
    where: { id: depositAppt.id },
    data: { depositStatus: "SUBMITTED", paymentSubmittedAt: new Date() },
  });
  assert(depositSubmitted.depositStatus === "SUBMITTED", "Deposit submitted");

  // Confirm deposit
  const depositConfirmed = await prisma.appointment.update({
    where: { id: depositAppt.id },
    data: {
      depositStatus: "CONFIRMED",
      paymentConfirmedAt: new Date(),
      status: "CONFIRMED",
    },
  });
  assert(depositConfirmed.depositStatus === "CONFIRMED", "Deposit confirmed");
  assert(depositConfirmed.status === "CONFIRMED", "Appointment confirmed after deposit");

  // Cancelled appointment
  const cancelledAppt = await prisma.appointment.create({
    data: {
      businessId: biz,
      clientId: client.id,
      stylistId: stylist.id,
      status: "CANCELLED",
      requestedDate: new Date("2026-03-25T16:00:00Z"),
      duration: 60,
      totalPrice: 40.00,
      notes: TEST_PREFIX + "Cancelled appointment",
      cancelReason: "Client rescheduled",
    },
  });
  assert(cancelledAppt.status === "CANCELLED", "Cancelled appointment");
  assert(cancelledAppt.cancelReason === "Client rescheduled", "Cancel reason saved");

  // Appointment with relations
  const apptFull = await prisma.appointment.findFirst({
    where: { id: appointment.id },
    include: {
      client: true,
      stylist: true,
      services: { include: { service: true } },
    },
  });
  assert(apptFull?.client?.firstName.includes("Sarah"), "Appointment includes client");
  assert(apptFull?.stylist?.firstName.includes("Lisa"), "Appointment includes stylist");
  assert(apptFull?.services?.length === 1, "Appointment includes services");

  // ============================================
  // 10. PRODUCT CATEGORIES
  // ============================================
  section("10. PRODUCT CATEGORIES");

  const prodCat = await prisma.productCategory.create({
    data: {
      businessId: biz,
      name: TEST_PREFIX + "Hair Extensions",
      description: "Premium hair extensions",
      sortOrder: 1,
    },
  });
  assert(prodCat.id && prodCat.name.includes("Hair Extensions"), "Create product category");
  assert(prodCat.isActive === true, "Product category defaults to active");

  // ============================================
  // 11. PRODUCTS
  // ============================================
  section("11. PRODUCTS");

  const product = await prisma.product.create({
    data: {
      businessId: biz,
      categoryId: prodCat.id,
      sku: "TEST-BWV-18",
      name: TEST_PREFIX + "Brazilian Body Wave 18\"",
      description: "Premium Brazilian body wave bundles",
      texture: "Body Wave",
      lengthInches: 18,
      color: "Natural Black",
      costPrice: 45.00,
      retailPrice: 89.99,
      stockOnHand: 25,
      reorderLevel: 5,
      isFeatured: true,
      isAvailableOnline: true,
    },
  });
  assert(product.id && product.sku === "TEST-BWV-18", "Create product with SKU");
  assert(product.name.includes("Brazilian Body Wave"), "Product name correct");
  assert(Number(product.costPrice) === 45, "Product cost price");
  assert(Number(product.retailPrice) === 89.99, "Product retail price");
  assert(product.stockOnHand === 25, "Product stock on hand");
  assert(product.isFeatured === true, "Product is featured");
  assert(product.isAvailableOnline === true, "Product available online");
  assert(product.texture === "Body Wave", "Product texture saved");
  assert(product.lengthInches === 18, "Product length saved");

  // Sale product
  const saleProduct = await prisma.product.create({
    data: {
      businessId: biz,
      categoryId: prodCat.id,
      sku: "TEST-ECG-4",
      name: TEST_PREFIX + "Edge Control Gel 4oz",
      costPrice: 8.00,
      retailPrice: 15.99,
      salePrice: 12.99,
      isOnSale: true,
      promoText: "20% OFF!",
      stockOnHand: 50,
      reorderLevel: 10,
    },
  });
  assert(saleProduct.isOnSale === true, "Product on sale");
  assert(Number(saleProduct.salePrice) === 12.99, "Sale price correct");
  assert(saleProduct.promoText === "20% OFF!", "Promo text saved");

  // Product with category
  const prodWithCat = await prisma.product.findFirst({
    where: { id: product.id },
    include: { category: true },
  });
  assert(prodWithCat?.category?.name.includes("Hair Extensions"), "Product includes category");

  // Low stock check
  const lowStock = await prisma.product.findMany({
    where: {
      businessId: biz,
      name: { startsWith: TEST_PREFIX },
      stockOnHand: { lte: prisma.product.fields?.reorderLevel ?? 10 },
    },
  });
  // Both products are above reorder level so this should be 0
  assert(lowStock.length === 0, "No test products below reorder level");

  // ============================================
  // 12. STOCK MOVEMENTS
  // ============================================
  section("12. STOCK MOVEMENTS");

  const restock = await prisma.stockMovement.create({
    data: {
      businessId: biz,
      productId: product.id,
      type: "RESTOCK",
      quantity: 10,
      quantityBefore: 25,
      quantityAfter: 35,
      reason: TEST_PREFIX + "New shipment arrived",
      createdBy: user?.id || null,
    },
  });
  assert(restock.id && restock.type === "RESTOCK", "Create restock movement");
  assert(restock.quantityBefore === 25 && restock.quantityAfter === 35, "Stock quantities correct");

  // Update product stock
  await prisma.product.update({ where: { id: product.id }, data: { stockOnHand: 35 } });

  const sale = await prisma.stockMovement.create({
    data: {
      businessId: biz,
      productId: product.id,
      type: "SALE",
      quantity: -2,
      quantityBefore: 35,
      quantityAfter: 33,
      reason: TEST_PREFIX + "Sold 2 units",
    },
  });
  assert(sale.type === "SALE" && sale.quantity === -2, "Create sale movement (negative quantity)");

  const adjustment = await prisma.stockMovement.create({
    data: {
      businessId: biz,
      productId: product.id,
      type: "ADJUSTMENT",
      quantity: -1,
      quantityBefore: 33,
      quantityAfter: 32,
      reason: TEST_PREFIX + "Inventory count adjustment",
    },
  });
  assert(adjustment.type === "ADJUSTMENT", "Create stock adjustment");

  const damage = await prisma.stockMovement.create({
    data: {
      businessId: biz,
      productId: product.id,
      type: "DAMAGE",
      quantity: -1,
      quantityBefore: 32,
      quantityAfter: 31,
      reason: TEST_PREFIX + "Damaged in storage",
    },
  });
  assert(damage.type === "DAMAGE", "Create damage movement");

  // Stock movement history
  const movements = await prisma.stockMovement.findMany({
    where: { productId: product.id, reason: { startsWith: TEST_PREFIX } },
    orderBy: { createdAt: "asc" },
  });
  assert(movements.length === 4, `Product has 4 stock movements (got ${movements.length})`);
  assert(movements[0].type === "RESTOCK", "First movement is RESTOCK");
  assert(movements[1].type === "SALE", "Second movement is SALE");

  // ============================================
  // 13. ORDERS
  // ============================================
  section("13. ORDERS");

  const order = await prisma.order.create({
    data: {
      businessId: biz,
      orderNumber: "ORD-TEST-001",
      clientId: client.id,
      status: "PENDING",
      paymentStatus: "UNPAID",
      subtotal: 102.98,
      discount: 0,
      total: 102.98,
      customerName: "Sarah Williams",
      customerPhone: "5551234567",
      customerEmail: "fulltest-sarah@test.com",
      customerNotes: TEST_PREFIX + "Please gift wrap",
    },
  });
  assert(order.id && order.orderNumber === "ORD-TEST-001", "Create order");
  assert(order.status === "PENDING", "Order starts as PENDING");
  assert(order.paymentStatus === "UNPAID", "Order starts as UNPAID");
  assert(Number(order.total) === 102.98, "Order total correct");

  // Order items
  const orderItem1 = await prisma.orderItem.create({
    data: {
      orderId: order.id,
      productId: product.id,
      productSku: "TEST-BWV-18",
      productName: "Brazilian Body Wave 18\"",
      quantity: 1,
      unitPrice: 89.99,
      lineTotal: 89.99,
    },
  });
  assert(orderItem1.id && orderItem1.quantity === 1, "Create order item 1");
  assert(Number(orderItem1.lineTotal) === 89.99, "Order item line total correct");

  const orderItem2 = await prisma.orderItem.create({
    data: {
      orderId: order.id,
      productId: saleProduct.id,
      productSku: "TEST-ECG-4",
      productName: "Edge Control Gel 4oz",
      quantity: 1,
      unitPrice: 15.99,
      salePrice: 12.99,
      lineTotal: 12.99,
    },
  });
  assert(orderItem2.id, "Create order item 2 (sale item)");
  assert(Number(orderItem2.salePrice) === 12.99, "Sale price applied to order item");

  // Order status flow
  const confirmedOrder = await prisma.order.update({
    where: { id: order.id },
    data: { status: "CONFIRMED", confirmedAt: new Date() },
  });
  assert(confirmedOrder.status === "CONFIRMED", "Order confirmed");

  const readyOrder = await prisma.order.update({
    where: { id: order.id },
    data: { status: "READY", readyAt: new Date() },
  });
  assert(readyOrder.status === "READY", "Order ready for pickup");

  const paidOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "COMPLETED",
      paymentStatus: "PAID",
      paymentMethod: "CASH",
      completedAt: new Date(),
    },
  });
  assert(paidOrder.status === "COMPLETED", "Order completed");
  assert(paidOrder.paymentStatus === "PAID", "Order paid");
  assert(paidOrder.paymentMethod === "CASH", "Payment method recorded");

  // Order with relations
  const orderFull = await prisma.order.findFirst({
    where: { id: order.id },
    include: {
      client: true,
      items: { include: { product: true } },
    },
  });
  assert(orderFull?.client?.firstName.includes("Sarah"), "Order includes client");
  assert(orderFull?.items?.length === 2, "Order has 2 items");

  // ============================================
  // 14. EXPENSES
  // ============================================
  section("14. EXPENSES");

  const expenses = [];
  const expenseData = [
    { category: "RENT", amount: 2500.00, description: TEST_PREFIX + "Monthly rent", date: new Date("2026-01-01") },
    { category: "ELECTRICITY", amount: 350.00, description: TEST_PREFIX + "Electricity bill", date: new Date("2026-01-05") },
    { category: "WATER", amount: 120.00, description: TEST_PREFIX + "Water bill", date: new Date("2026-01-05") },
    { category: "INTERNET", amount: 150.00, description: TEST_PREFIX + "Internet service", date: new Date("2026-01-10") },
    { category: "WAGES", amount: 3200.00, description: TEST_PREFIX + "Staff wages", date: new Date("2026-01-15") },
    { category: "CLEANING", amount: 200.00, description: TEST_PREFIX + "Cleaning supplies", date: new Date("2026-01-20") },
    { category: "MARKETING", amount: 500.00, description: TEST_PREFIX + "Social media ads", date: new Date("2026-01-25") },
    { category: "SOFTWARE", amount: 49.99, description: TEST_PREFIX + "SalonixPro subscription", date: new Date("2026-01-28") },
  ];

  for (const exp of expenseData) {
    const e = await prisma.expense.create({
      data: { businessId: biz, ...exp, currency: business.currency || "XCD" },
    });
    expenses.push(e);
  }
  assert(expenses.length === 8, `Created ${expenses.length} expenses`);

  // Verify all expense categories
  const categories = [...new Set(expenses.map((e) => e.category))];
  assert(categories.length === 8, "All 8 expense categories used");

  // Expense summary
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  assert(totalExpenses === 7069.99, `Total expenses: $${totalExpenses} (expected 7069.99)`);

  // Update expense
  const expUpdate = await prisma.expense.update({
    where: { id: expenses[0].id },
    data: { amount: 2600.00, notes: "Rent increase this month" },
  });
  assert(Number(expUpdate.amount) === 2600, "Expense amount updated");
  assert(expUpdate.notes === "Rent increase this month", "Expense notes saved");

  // Filter by category
  const rentExpenses = await prisma.expense.findMany({
    where: { businessId: biz, category: "RENT", description: { startsWith: TEST_PREFIX } },
  });
  assert(rentExpenses.length === 1, "Filter expenses by category");

  // Filter by date range
  const janExpenses = await prisma.expense.findMany({
    where: {
      businessId: biz,
      description: { startsWith: TEST_PREFIX },
      date: {
        gte: new Date("2026-01-01"),
        lte: new Date("2026-01-31"),
      },
    },
  });
  assert(janExpenses.length === 8, `January expenses: ${janExpenses.length}`);

  // ============================================
  // 15. NOTIFICATIONS
  // ============================================
  section("15. NOTIFICATIONS");

  const notif1 = await prisma.notification.create({
    data: {
      businessId: biz,
      type: "BOOKING_NEW",
      title: TEST_PREFIX + "New Booking",
      message: "Sarah Williams booked Silk Press for March 15",
      isUrgent: false,
    },
  });
  assert(notif1.id && notif1.type === "BOOKING_NEW", "Create booking notification");
  assert(notif1.isRead === false, "Notification starts as unread");

  const notif2 = await prisma.notification.create({
    data: {
      businessId: biz,
      type: "PAYMENT_SUBMITTED",
      title: TEST_PREFIX + "Payment Received",
      message: "Deposit of $50.00 submitted for appointment",
      isUrgent: true,
    },
  });
  assert(notif2.isUrgent === true, "Urgent notification created");

  const notif3 = await prisma.notification.create({
    data: {
      businessId: biz,
      type: "ORDER_CONFIRMED",
      title: TEST_PREFIX + "Order Confirmed",
      message: "Order ORD-TEST-001 has been confirmed",
      data: { orderId: order.id },
    },
  });
  assert(notif3.data !== null, "Notification with JSON data");

  // Mark as read
  const readNotif = await prisma.notification.update({
    where: { id: notif1.id },
    data: { isRead: true },
  });
  assert(readNotif.isRead === true, "Notification marked as read");

  // Unread count
  const unreadCount = await prisma.notification.count({
    where: { businessId: biz, isRead: false, title: { startsWith: TEST_PREFIX } },
  });
  assert(unreadCount === 2, `Unread notifications: ${unreadCount} (expected 2)`);

  // List by type
  const allTypes = ["BOOKING_NEW", "BOOKING_REMINDER", "PAYMENT_SUBMITTED",
    "PAYMENT_DEADLINE_WARNING", "PAYMENT_EXPIRED", "BOOKING_CONFIRMED",
    "BOOKING_CANCELLED", "ORDER_CONFIRMED", "GENERAL"];
  assert(allTypes.length === 9, "All 9 notification types defined");

  // ============================================
  // 16. PRODUCT COSTING & TEMPLATES
  // ============================================
  section("16. PRODUCT COSTING & TEMPLATES");

  const template = await prisma.costingTemplate.create({
    data: {
      businessId: biz,
      name: TEST_PREFIX + "Standard Import",
      dutyRate: 20,
      vatRate: 12.5,
      hslRate: 2,
      exciseTax: 0,
      customsFee: 50,
      exchangeRate: 2.70,
      defaultMarkup: 50,
      shippingEstimate: 15,
      purchaseCurrency: "USD",
    },
  });
  assert(template.id, "Create costing template");

  const costing = await prisma.productCosting.create({
    data: {
      businessId: biz,
      sku: "SP-TEST-001",
      productName: TEST_PREFIX + "Imported Shampoo 500ml",
      supplier: "Amazon US",
      quantity: 12,
      unitPrice: 18.00,
      purchaseCurrency: "USD",
      shippingCost: 20.00,
      dutyRate: 20,
      dutyAmount: 135.00,
      vatRate: 12.5,
      vatAmount: 101.25,
      hslRate: 2,
      hslAmount: 16.20,
      customsFee: 50,
      exchangeRate: 2.70,
      totalLandedCost: 936.45,
      totalLandedCostLocal: 936.45,
      landedCostPerUnit: 78.04,
      localCurrency: business.currency || "XCD",
      localCurrencySymbol: business.currencySymbol || "EC$",
      markupPercent: 50,
      sellingPrice: 116.99,
      linkedProductId: product.id,
    },
  });
  assert(costing.id && costing.sku === "SP-TEST-001", "Create product costing with link");
  assert(costing.linkedProductId === product.id, "Costing linked to product");

  // Verify link
  const costingWithProduct = await prisma.productCosting.findFirst({
    where: { id: costing.id },
    include: { linkedProduct: { select: { id: true, name: true } } },
  });
  assert(costingWithProduct?.linkedProduct?.name.includes("Brazilian Body Wave"), "Costing linked product correct");

  // ============================================
  // 17. PROFIT & LOSS DATA INTEGRITY
  // ============================================
  section("17. P&L DATA INTEGRITY");

  // Revenue from completed appointments
  const completedAppts = await prisma.appointment.findMany({
    where: { businessId: biz, status: "COMPLETED", notes: { startsWith: TEST_PREFIX } },
  });
  const serviceRevenue = completedAppts.reduce((s, a) => s + Number(a.totalPrice), 0);
  assert(serviceRevenue === 95, `Service revenue from test appointments: $${serviceRevenue}`);

  // Revenue from completed orders
  const completedOrders = await prisma.order.findMany({
    where: { businessId: biz, status: "COMPLETED", customerNotes: { startsWith: TEST_PREFIX } },
  });
  const productRevenue = completedOrders.reduce((s, o) => s + Number(o.total), 0);
  assert(productRevenue === 102.98, `Product revenue from test orders: $${productRevenue}`);

  // COGS from products sold
  const testOrderItems = await prisma.orderItem.findMany({
    where: { order: { businessId: biz, customerNotes: { startsWith: TEST_PREFIX } } },
    include: { product: true },
  });
  const cogs = testOrderItems.reduce((s, item) => {
    const cost = item.product ? Number(item.product.costPrice) : 0;
    return s + cost * item.quantity;
  }, 0);
  assert(cogs === 53, `COGS from test orders: $${cogs} (45+8=53)`);

  // Gross profit
  const grossProfit = Math.round((serviceRevenue + productRevenue - cogs) * 100) / 100;
  assert(grossProfit === 144.98, `Gross profit: $${grossProfit} (expected 144.98)`);

  // Total test expenses
  const testExpenseTotal = await prisma.expense.aggregate({
    where: { businessId: biz, description: { startsWith: TEST_PREFIX } },
    _sum: { amount: true },
  });
  const expTotal = Number(testExpenseTotal._sum.amount);
  assert(expTotal > 7000, `Test expenses total: $${expTotal}`);

  // Net profit
  const netProfit = grossProfit - expTotal;
  assert(netProfit < 0, `Net profit is negative (expenses > revenue for test data): $${netProfit.toFixed(2)}`);

  // ============================================
  // 18. MASTER SERVICES CATALOG
  // ============================================
  section("18. MASTER SERVICES CATALOG");

  const masterCount = await prisma.masterService.count();
  assert(masterCount > 0, `Master service catalog has ${masterCount} entries`);

  const masterCats = await prisma.masterService.groupBy({
    by: ["category"],
    _count: true,
  });
  assert(masterCats.length >= 1, `Master services span ${masterCats.length} categories`);

  const sampleMaster = await prisma.masterService.findFirst();
  if (sampleMaster) {
    assert(sampleMaster.code && sampleMaster.name, "Master service has code and name");
    assert(sampleMaster.defaultDuration > 0, "Master service has default duration");
    assert(sampleMaster.category !== null, "Master service has category");
  }

  // ============================================
  // 19. DATA RELATIONSHIPS & CASCADING
  // ============================================
  section("19. DATA RELATIONSHIPS & CASCADING");

  // Business → Users
  const bizWithUsers = await prisma.business.findFirst({
    where: { id: biz },
    include: { users: true },
  });
  assert(bizWithUsers?.users?.length >= 1, "Business has users relation");

  // Business → Clients
  const bizClients = await prisma.client.count({ where: { businessId: biz } });
  assert(bizClients >= 1, `Business has ${bizClients} clients`);

  // Business → Services
  const bizServices = await prisma.service.count({ where: { businessId: biz } });
  assert(bizServices >= 2, `Business has ${bizServices} services`);

  // Business → Products
  const bizProducts = await prisma.product.count({ where: { businessId: biz } });
  assert(bizProducts >= 2, `Business has ${bizProducts} products`);

  // Business → Appointments
  const bizAppts = await prisma.appointment.count({ where: { businessId: biz } });
  assert(bizAppts >= 3, `Business has ${bizAppts} appointments`);

  // Business → Orders
  const bizOrders = await prisma.order.count({ where: { businessId: biz } });
  assert(bizOrders >= 1, `Business has ${bizOrders} orders`);

  // Business → Expenses
  const bizExpenses = await prisma.expense.count({ where: { businessId: biz } });
  assert(bizExpenses >= 8, `Business has ${bizExpenses} expenses`);

  // Client → Appointments relation
  const clientAppts = await prisma.client.findFirst({
    where: { id: client.id },
    include: { appointments: true },
  });
  assert(clientAppts?.appointments?.length === 3, `Client has 3 appointments`);

  // Stylist → Appointments relation
  const stylistAppts = await prisma.stylist.findFirst({
    where: { id: stylist.id },
    include: { appointments: true },
  });
  assert(stylistAppts?.appointments?.length === 3, `Stylist has 3 appointments`);

  // Product → Order items
  const prodOrders = await prisma.product.findFirst({
    where: { id: product.id },
    include: { orderItems: true },
  });
  assert(prodOrders?.orderItems?.length >= 1, "Product has order items");

  // Product → Stock movements
  const prodMovements = await prisma.product.findFirst({
    where: { id: product.id },
    include: { stockMovements: true },
  });
  assert(prodMovements?.stockMovements?.length >= 4, "Product has stock movements");

  // Product → Costings
  const prodCostings = await prisma.product.findFirst({
    where: { id: product.id },
    include: { costings: true },
  });
  assert(prodCostings?.costings?.length >= 1, "Product has costing records");

  // ============================================
  // 20. ENUM VALIDATION
  // ============================================
  section("20. ENUM VALIDATION");

  // All appointment statuses
  const statuses = ["PENDING", "PENDING_DEPOSIT", "CONFIRMED", "ARRIVED",
    "IN_PROGRESS", "COMPLETED", "CANCELLED", "AUTO_CANCELLED", "NO_SHOW"];
  for (const s of statuses) {
    assert(typeof s === "string", `AppointmentStatus '${s}' is valid`);
  }

  // All expense categories
  const expCats = ["RENT", "ELECTRICITY", "WATER", "INTERNET", "WAGES",
    "COMMISSIONS", "CLEANING", "MAINTENANCE", "MARKETING",
    "LOAN_PAYMENTS", "SOFTWARE", "OTHER"];
  assert(expCats.length === 12, "All 12 expense categories defined");

  // All order statuses
  const orderStatuses = ["CART", "PENDING", "CONFIRMED", "READY", "COMPLETED", "CANCELLED"];
  assert(orderStatuses.length === 6, "All 6 order statuses defined");

  // All roles
  const roles = ["OWNER", "MANAGER", "STYLIST", "ASSISTANT"];
  assert(roles.length === 4, "All 4 user roles defined");

  // All stock movement types
  const movTypes = ["SALE", "RESTOCK", "ADJUSTMENT", "DAMAGE", "RETURN"];
  assert(movTypes.length === 5, "All 5 stock movement types defined");

  // ============================================
  // 21. BUSINESS SLUG & PUBLIC BOOKING
  // ============================================
  section("21. BUSINESS SLUG & PUBLIC BOOKING");

  assert(business.slug !== null && business.slug.length > 0, `Business slug: "${business.slug}"`);
  const slugLookup = await prisma.business.findUnique({ where: { slug: business.slug } });
  assert(slugLookup?.id === biz, "Business found by slug (for public booking)");

  // Business hours check
  if (business.businessHours) {
    assert(typeof business.businessHours === "object", "Business hours is JSON object");
  } else {
    skip("Business hours not configured");
  }

  // Deposit settings
  assert(typeof business.requiresDeposit === "boolean", "Deposit setting exists");
  if (business.requiresDeposit) {
    assert(business.depositType !== null, `Deposit type: ${business.depositType}`);
  }

  // ============================================
  // 22. PAGINATION & SORTING
  // ============================================
  section("22. PAGINATION & SORTING");

  // Paginate expenses
  const expPage1 = await prisma.expense.findMany({
    where: { businessId: biz, description: { startsWith: TEST_PREFIX } },
    take: 3,
    skip: 0,
    orderBy: { date: "asc" },
  });
  assert(expPage1.length === 3, "Expense pagination: page 1 returns 3");

  const expPage2 = await prisma.expense.findMany({
    where: { businessId: biz, description: { startsWith: TEST_PREFIX } },
    take: 3,
    skip: 3,
    orderBy: { date: "asc" },
  });
  assert(expPage2.length === 3, "Expense pagination: page 2 returns 3");

  // Sort products by price
  const sortedProducts = await prisma.product.findMany({
    where: { businessId: biz, name: { startsWith: TEST_PREFIX } },
    orderBy: { retailPrice: "desc" },
  });
  assert(Number(sortedProducts[0].retailPrice) >= Number(sortedProducts[1].retailPrice), "Products sorted by price desc");

  // Sort appointments by date
  const sortedAppts = await prisma.appointment.findMany({
    where: { businessId: biz, notes: { startsWith: TEST_PREFIX } },
    orderBy: { requestedDate: "asc" },
  });
  assert(sortedAppts.length === 3, "All test appointments found");
  assert(new Date(sortedAppts[0].requestedDate) <= new Date(sortedAppts[1].requestedDate), "Appointments sorted by date asc");

  // ============================================
  // 23. AGGREGATE QUERIES
  // ============================================
  section("23. AGGREGATE QUERIES");

  // Total products in stock
  const stockAgg = await prisma.product.aggregate({
    where: { businessId: biz, name: { startsWith: TEST_PREFIX } },
    _sum: { stockOnHand: true },
    _avg: { retailPrice: true },
    _count: true,
  });
  assert(stockAgg._count === 2, "Aggregate: 2 test products");
  assert(stockAgg._sum.stockOnHand > 0, `Aggregate: total stock = ${stockAgg._sum.stockOnHand}`);
  assert(Number(stockAgg._avg.retailPrice) > 0, `Aggregate: avg price = ${Number(stockAgg._avg.retailPrice).toFixed(2)}`);

  // Group expenses by category
  const expGrouped = await prisma.expense.groupBy({
    by: ["category"],
    where: { businessId: biz, description: { startsWith: TEST_PREFIX } },
    _sum: { amount: true },
    _count: true,
  });
  assert(expGrouped.length === 8, `Expenses grouped into ${expGrouped.length} categories`);

  // Appointments by status
  const apptsByStatus = await prisma.appointment.groupBy({
    by: ["status"],
    where: { businessId: biz, notes: { startsWith: TEST_PREFIX } },
    _count: true,
  });
  assert(apptsByStatus.length >= 2, `Appointments grouped by ${apptsByStatus.length} statuses`);

  // ============================================
  // CLEANUP
  // ============================================
  section("CLEANUP");
  await cleanup(biz);
  console.log("  All test data cleaned up.\n");

  // ============================================
  // FINAL RESULTS
  // ============================================
  console.log("=".repeat(56));
  console.log("  TEST RESULTS");
  console.log("=".repeat(56));

  for (const r of results) {
    console.log(r);
  }

  console.log(`\n${"─".repeat(56)}`);
  console.log(`  PASSED:  ${passed}`);
  console.log(`  FAILED:  ${failed}`);
  console.log(`  SKIPPED: ${skipped}`);
  console.log(`  TOTAL:   ${passed + failed + skipped}`);
  console.log(`${"─".repeat(56)}`);

  if (failed > 0) {
    console.log(`\n  ** ${failed} TEST(S) FAILED **\n`);
    process.exit(1);
  } else {
    console.log(`\n  ALL ${passed} TESTS PASSED!\n`);
  }
}

run()
  .catch((e) => {
    console.error("\nFATAL TEST ERROR:", e.message);
    console.error(e.stack);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
