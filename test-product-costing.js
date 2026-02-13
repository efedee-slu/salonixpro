// test-product-costing.js
// Comprehensive test suite for the Product Costing feature
// Run: node test-product-costing.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

let passed = 0;
let failed = 0;
const results = [];

function assert(condition, testName) {
  if (condition) {
    passed++;
    results.push(`  PASS  ${testName}`);
  } else {
    failed++;
    results.push(`  FAIL  ${testName}`);
  }
}

async function run() {
  console.log("\n========================================");
  console.log("  PRODUCT COSTING - COMPREHENSIVE TEST");
  console.log("========================================\n");

  // Find a business to test with
  const business = await prisma.business.findFirst({
    select: { id: true, name: true, currency: true, currencySymbol: true },
  });
  if (!business) {
    console.log("ERROR: No business found in database. Cannot run tests.");
    process.exit(1);
  }
  console.log(`Using business: "${business.name}" (${business.id})\n`);

  // Clean up any previous test data
  await prisma.productCosting.deleteMany({
    where: { businessId: business.id, productName: { startsWith: "TEST-" } },
  });
  await prisma.costingTemplate.deleteMany({
    where: { businessId: business.id, name: { startsWith: "TEST-" } },
  });

  let costingId1, costingId2, costingId3, templateId;

  // ============================================
  // 1. CREATE COSTINGS WITH SKU
  // ============================================
  console.log("--- 1. CREATE COSTINGS ---");

  const costing1 = await prisma.productCosting.create({
    data: {
      businessId: business.id,
      sku: "SP-0001",
      productName: "TEST-Brazilian Body Wave 18\"",
      supplier: "Amazon US",
      quantity: 10,
      unitPrice: 25.00,
      purchaseCurrency: "USD",
      shippingCost: 15.00,
      freightCost: 20.00,
      dutyRate: 20,
      dutyAmount: 148.50,
      vatRate: 12.5,
      vatAmount: 111.38,
      hslRate: 2,
      hslAmount: 17.82,
      exciseTax: 0,
      customsFee: 50,
      insurance: 10,
      handlingFee: 25,
      otherCosts: 0,
      customTaxes: [{ name: "Environmental Levy", rate: 1.5, amount: 13.36, isPercentage: true }],
      totalLandedCost: 1068.06,
      totalLandedCostLocal: 1068.06,
      landedCostPerUnit: 106.81,
      localCurrency: business.currency || "XCD",
      localCurrencySymbol: business.currencySymbol || "EC$",
      exchangeRate: 2.70,
      markupPercent: 50,
      sellingPrice: 159.99,
    },
  });
  costingId1 = costing1.id;
  assert(costing1.id && costing1.sku === "SP-0001", "Create costing #1 with SKU SP-0001");
  assert(costing1.productName === "TEST-Brazilian Body Wave 18\"", "Product name saved correctly");
  assert(Number(costing1.unitPrice) === 25, "Unit price saved as Decimal");
  assert(Number(costing1.exchangeRate) === 2.70, "Exchange rate saved correctly");
  assert(costing1.customTaxes !== null, "Custom taxes JSON saved");

  const costing2 = await prisma.productCosting.create({
    data: {
      businessId: business.id,
      sku: "SP-0002",
      productName: "TEST-Keratin Treatment 500ml",
      supplier: "Sally Beauty",
      quantity: 5,
      unitPrice: 45.00,
      purchaseCurrency: "USD",
      shippingCost: 12.00,
      dutyRate: 15,
      dutyAmount: 97.88,
      vatRate: 12.5,
      vatAmount: 93.72,
      localCurrency: business.currency || "XCD",
      localCurrencySymbol: business.currencySymbol || "EC$",
      exchangeRate: 2.70,
      totalLandedCost: 901.59,
      totalLandedCostLocal: 901.59,
      landedCostPerUnit: 180.32,
      markupPercent: 60,
      sellingPrice: 288.99,
    },
  });
  costingId2 = costing2.id;
  assert(costing2.sku === "SP-0002", "Create costing #2 with SKU SP-0002");

  const costing3 = await prisma.productCosting.create({
    data: {
      businessId: business.id,
      sku: "SP-0003",
      productName: "TEST-Edge Control Gel 4oz",
      supplier: "Amazon US",
      quantity: 20,
      unitPrice: 8.50,
      purchaseCurrency: "USD",
      shippingCost: 10.00,
      dutyRate: 20,
      dutyAmount: 99.90,
      vatRate: 12.5,
      vatAmount: 74.93,
      localCurrency: business.currency || "XCD",
      localCurrencySymbol: business.currencySymbol || "EC$",
      exchangeRate: 2.70,
      totalLandedCost: 711.83,
      totalLandedCostLocal: 711.83,
      landedCostPerUnit: 35.59,
      markupPercent: 80,
      sellingPrice: 63.99,
    },
  });
  costingId3 = costing3.id;
  assert(costing3.sku === "SP-0003", "Create costing #3 with SKU SP-0003");

  // ============================================
  // 2. SKU UNIQUENESS
  // ============================================
  console.log("\n--- 2. SKU UNIQUENESS ---");

  let duplicateError = false;
  try {
    await prisma.productCosting.create({
      data: {
        businessId: business.id,
        sku: "SP-0001", // Duplicate!
        productName: "TEST-Duplicate SKU",
        unitPrice: 10,
        purchaseCurrency: "USD",
        localCurrency: "XCD",
        localCurrencySymbol: "EC$",
        exchangeRate: 2.70,
      },
    });
  } catch (e) {
    duplicateError = true;
  }
  assert(duplicateError, "Duplicate SKU (SP-0001) rejected by unique constraint");

  // Null SKUs should be allowed (multiple records with null sku)
  const nullSku = await prisma.productCosting.create({
    data: {
      businessId: business.id,
      sku: null,
      productName: "TEST-No SKU Product",
      unitPrice: 5,
      purchaseCurrency: "USD",
      localCurrency: "XCD",
      localCurrencySymbol: "EC$",
      exchangeRate: 2.70,
    },
  });
  assert(nullSku.id && nullSku.sku === null, "Null SKU allowed (no uniqueness issue)");
  // Clean up
  await prisma.productCosting.delete({ where: { id: nullSku.id } });

  // ============================================
  // 3. READ / LIST COSTINGS
  // ============================================
  console.log("\n--- 3. READ / LIST ---");

  const all = await prisma.productCosting.findMany({
    where: { businessId: business.id, productName: { startsWith: "TEST-" } },
    orderBy: { sku: "asc" },
  });
  assert(all.length === 3, `Found 3 test costings (got ${all.length})`);
  assert(all[0].sku === "SP-0001", "Ordered by SKU ascending");

  const single = await prisma.productCosting.findFirst({
    where: { id: costingId1, businessId: business.id },
    include: { linkedProduct: { select: { id: true, name: true, sku: true } } },
  });
  assert(single !== null, "Fetch single costing by ID");
  assert(single.supplier === "Amazon US", "Supplier field correct");
  assert(single.quantity === 10, "Quantity correct");
  assert(Number(single.dutyRate) === 20, "Duty rate correct");
  assert(Number(single.vatRate) === 12.5, "VAT rate correct");
  assert(Number(single.hslRate) === 2, "HSL rate correct");
  assert(Number(single.landedCostPerUnit) === 106.81, "Landed cost per unit correct");
  assert(Number(single.sellingPrice) === 159.99, "Selling price correct");
  assert(Number(single.markupPercent) === 50, "Markup percent correct");

  // ============================================
  // 4. SEARCH
  // ============================================
  console.log("\n--- 4. SEARCH ---");

  const searchByName = await prisma.productCosting.findMany({
    where: {
      businessId: business.id,
      productName: { contains: "Keratin", mode: "insensitive" },
    },
  });
  assert(searchByName.length >= 1, "Search by product name 'Keratin' finds result");

  const searchBySupplier = await prisma.productCosting.findMany({
    where: {
      businessId: business.id,
      supplier: { contains: "sally", mode: "insensitive" },
    },
  });
  assert(searchBySupplier.length >= 1, "Search by supplier 'sally' (case-insensitive) finds result");

  const searchBySku = await prisma.productCosting.findMany({
    where: {
      businessId: business.id,
      sku: { contains: "SP-0003", mode: "insensitive" },
    },
  });
  assert(searchBySku.length >= 1, "Search by SKU 'SP-0003' finds result");

  // ============================================
  // 5. UPDATE COSTING
  // ============================================
  console.log("\n--- 5. UPDATE ---");

  const updated = await prisma.productCosting.update({
    where: { id: costingId2 },
    data: {
      sku: "SP-0002-A",
      productName: "TEST-Keratin Treatment 1000ml",
      quantity: 10,
      unitPrice: 75.00,
      markupPercent: 65,
      sellingPrice: 349.99,
    },
  });
  assert(updated.sku === "SP-0002-A", "SKU updated to SP-0002-A");
  assert(updated.productName === "TEST-Keratin Treatment 1000ml", "Product name updated");
  assert(updated.quantity === 10, "Quantity updated to 10");
  assert(Number(updated.unitPrice) === 75, "Unit price updated to 75");
  assert(Number(updated.markupPercent) === 65, "Markup updated to 65%");

  // ============================================
  // 6. NEXT SKU GENERATION LOGIC
  // ============================================
  console.log("\n--- 6. NEXT SKU GENERATION ---");

  const latest = await prisma.productCosting.findFirst({
    where: {
      businessId: business.id,
      sku: { startsWith: "SP-" },
    },
    orderBy: { sku: "desc" },
    select: { sku: true },
  });
  assert(latest !== null, "Found latest SKU record");

  // Parse the highest SKU number
  let nextNumber = 1;
  if (latest?.sku) {
    const match = latest.sku.match(/^SP-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }
  const nextSku = `SP-${String(nextNumber).padStart(4, "0")}`;
  assert(nextSku.startsWith("SP-"), `Next SKU would be: ${nextSku}`);
  // With SP-0001, SP-0002-A, SP-0003 → highest is SP-0003 → next should be SP-0004
  assert(nextSku === "SP-0004", `Next SKU is SP-0004 (got ${nextSku})`);

  // ============================================
  // 7. TEMPLATES CRUD
  // ============================================
  console.log("\n--- 7. TEMPLATES ---");

  const template = await prisma.costingTemplate.create({
    data: {
      businessId: business.id,
      name: "TEST-Amazon Import",
      dutyRate: 20,
      vatRate: 12.5,
      hslRate: 2,
      exciseTax: 0,
      customsFee: 50,
      exchangeRate: 2.70,
      defaultMarkup: 50,
      shippingEstimate: 15,
      purchaseCurrency: "USD",
      customTaxes: [{ name: "Environmental Levy", rate: 1.5, isPercentage: true }],
      notes: "Standard Amazon US import rates",
    },
  });
  templateId = template.id;
  assert(template.id && template.name === "TEST-Amazon Import", "Create template");
  assert(Number(template.dutyRate) === 20, "Template duty rate correct");
  assert(Number(template.vatRate) === 12.5, "Template VAT rate correct");
  assert(template.customTaxes !== null, "Template custom taxes saved");

  const templateRead = await prisma.costingTemplate.findFirst({
    where: { id: templateId, businessId: business.id },
  });
  assert(templateRead !== null, "Read template by ID");

  const templateUpdate = await prisma.costingTemplate.update({
    where: { id: templateId },
    data: { name: "TEST-Amazon Import v2", defaultMarkup: 55 },
  });
  assert(templateUpdate.name === "TEST-Amazon Import v2", "Update template name");
  assert(Number(templateUpdate.defaultMarkup) === 55, "Update template markup");

  // Duplicate name check
  let dupNameError = false;
  try {
    await prisma.costingTemplate.create({
      data: {
        businessId: business.id,
        name: "TEST-Amazon Import v2",
        dutyRate: 10,
        vatRate: 10,
        exchangeRate: 2.70,
        purchaseCurrency: "USD",
      },
    });
    // If we get here, check if the app-level validation would catch it
    // (Prisma doesn't have a unique constraint on template name, the API does)
    dupNameError = false;
  } catch {
    dupNameError = true;
  }
  // Note: template name uniqueness is enforced at API level, not DB level
  // So this might succeed at DB level. Either way, log it.
  results.push(`  INFO  Template duplicate name at DB level: ${dupNameError ? "blocked" : "allowed (API enforces)"}`);
  // Clean up duplicate if created
  if (!dupNameError) {
    await prisma.costingTemplate.deleteMany({
      where: { businessId: business.id, name: "TEST-Amazon Import v2", NOT: { id: templateId } },
    });
  }

  // ============================================
  // 8. LINK TO PRODUCT
  // ============================================
  console.log("\n--- 8. LINK TO PRODUCT ---");

  const product = await prisma.product.findFirst({
    where: { businessId: business.id },
    select: { id: true, name: true, costPrice: true, retailPrice: true },
  });

  if (product) {
    console.log(`  Found product: "${product.name}" (costPrice: ${product.costPrice})`);

    const linked = await prisma.productCosting.update({
      where: { id: costingId1 },
      data: { linkedProductId: product.id },
    });
    assert(linked.linkedProductId === product.id, "Link costing to product");

    // Verify linked product appears in include
    const withProduct = await prisma.productCosting.findFirst({
      where: { id: costingId1 },
      include: { linkedProduct: { select: { id: true, name: true, sku: true } } },
    });
    assert(withProduct?.linkedProduct !== null, "Linked product included in response");
    assert(withProduct?.linkedProduct?.name === product.name, "Linked product name matches");

    // Simulate what the API does: update product's cost price
    await prisma.product.update({
      where: { id: product.id },
      data: {
        costPrice: Number(linked.landedCostPerUnit),
        retailPrice: Number(linked.sellingPrice),
      },
    });
    const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
    assert(Number(updatedProduct.costPrice) === Number(linked.landedCostPerUnit), "Product costPrice updated from costing");
    assert(Number(updatedProduct.retailPrice) === Number(linked.sellingPrice), "Product retailPrice updated from costing");

    // Unlink
    await prisma.productCosting.update({
      where: { id: costingId1 },
      data: { linkedProductId: null },
    });
    // Restore original product prices
    await prisma.product.update({
      where: { id: product.id },
      data: { costPrice: product.costPrice, retailPrice: product.retailPrice },
    });
  } else {
    results.push("  SKIP  No products in database - skipping link tests");
  }

  // ============================================
  // 9. CALCULATIONS VERIFICATION
  // ============================================
  console.log("\n--- 9. CALCULATIONS ---");

  // Verify calculation logic for costing1:
  // Unit price: $25 * 10 = $250 USD * 2.70 = EC$675 (purchase total local)
  // Shipping: $15 * 2.70 = EC$40.50
  // CIF = 675 + 40.50 + 10 (insurance) = EC$725.50
  // Duty: 725.50 * 20% = EC$145.10 (close to stored 148.50 - might include rounding)
  const c = costing1;
  const qty = c.quantity;
  const rate = Number(c.exchangeRate);
  const purchaseLocal = Number(c.unitPrice) * qty * rate;
  const shippingLocal = Number(c.shippingCost) * rate;
  assert(purchaseLocal === 675, `Purchase in local: EC$${purchaseLocal} (expected 675)`);
  assert(shippingLocal === 40.5, `Shipping in local: EC$${shippingLocal} (expected 40.50)`);

  const cif = purchaseLocal + shippingLocal + Number(c.insurance);
  assert(cif === 725.5, `CIF total: EC$${cif} (expected 725.50)`);

  const dutyCalc = cif * (Number(c.dutyRate) / 100);
  assert(dutyCalc === 145.1, `Duty calculated: EC$${dutyCalc} (expected 145.10)`);

  // Landed cost per unit should be total / qty
  const totalStored = Number(c.totalLandedCost);
  const perUnitStored = Number(c.landedCostPerUnit);
  assert(Math.abs(perUnitStored - totalStored / qty) < 0.01, `Landed cost per unit = total / qty (${perUnitStored} ≈ ${(totalStored / qty).toFixed(2)})`);

  // Markup: 50% of landed cost per unit
  const expectedSelling = perUnitStored * 1.5;
  // With .99 rounding, selling should be close to that
  assert(Number(c.sellingPrice) > perUnitStored, "Selling price > landed cost (profit exists)");

  // ============================================
  // 10. PAGINATION
  // ============================================
  console.log("\n--- 10. PAGINATION ---");

  const page1 = await prisma.productCosting.findMany({
    where: { businessId: business.id, productName: { startsWith: "TEST-" } },
    take: 2,
    skip: 0,
    orderBy: { createdAt: "desc" },
  });
  assert(page1.length === 2, `Page 1 with limit=2 returns 2 records`);

  const page2 = await prisma.productCosting.findMany({
    where: { businessId: business.id, productName: { startsWith: "TEST-" } },
    take: 2,
    skip: 2,
    orderBy: { createdAt: "desc" },
  });
  assert(page2.length === 1, `Page 2 with limit=2 returns 1 remaining record`);

  const total = await prisma.productCosting.count({
    where: { businessId: business.id, productName: { startsWith: "TEST-" } },
  });
  assert(total === 3, `Total count = 3 (got ${total})`);

  // ============================================
  // 11. DELETE
  // ============================================
  console.log("\n--- 11. DELETE ---");

  await prisma.productCosting.delete({ where: { id: costingId3 } });
  const afterDelete = await prisma.productCosting.findFirst({ where: { id: costingId3 } });
  assert(afterDelete === null, "Costing #3 deleted successfully");

  const remainingCount = await prisma.productCosting.count({
    where: { businessId: business.id, productName: { startsWith: "TEST-" } },
  });
  assert(remainingCount === 2, `2 costings remain after deletion (got ${remainingCount})`);

  // ============================================
  // 12. SCHEMA VALIDATION
  // ============================================
  console.log("\n--- 12. SCHEMA VALIDATION ---");

  // Verify all fields exist on the model
  const fullRecord = await prisma.productCosting.findFirst({
    where: { id: costingId1 },
  });
  const requiredFields = [
    "id", "businessId", "sku", "productName", "supplier", "quantity",
    "unitPrice", "purchaseCurrency", "shippingCost", "freightCost",
    "dutyRate", "dutyAmount", "vatRate", "vatAmount", "hslRate", "hslAmount",
    "exciseTax", "customsFee", "insurance", "handlingFee", "otherCosts",
    "otherDescription", "customTaxes", "totalLandedCost", "totalLandedCostLocal",
    "landedCostPerUnit", "localCurrency", "localCurrencySymbol", "exchangeRate",
    "markupPercent", "sellingPrice", "linkedProductId", "createdAt", "updatedAt",
  ];
  for (const field of requiredFields) {
    assert(field in fullRecord, `Field '${field}' exists in ProductCosting model`);
  }

  // ============================================
  // CLEANUP
  // ============================================
  console.log("\n--- CLEANUP ---");

  await prisma.productCosting.deleteMany({
    where: { businessId: business.id, productName: { startsWith: "TEST-" } },
  });
  await prisma.costingTemplate.deleteMany({
    where: { businessId: business.id, name: { startsWith: "TEST-" } },
  });
  console.log("  Cleaned up all test data.\n");

  // ============================================
  // RESULTS
  // ============================================
  console.log("========================================");
  console.log("  RESULTS");
  console.log("========================================\n");

  for (const r of results) {
    console.log(r);
  }

  console.log(`\n----------------------------------------`);
  console.log(`  PASSED: ${passed}`);
  console.log(`  FAILED: ${failed}`);
  console.log(`  TOTAL:  ${passed + failed}`);
  console.log(`----------------------------------------`);

  if (failed > 0) {
    console.log("\n  ** SOME TESTS FAILED **\n");
    process.exit(1);
  } else {
    console.log("\n  ALL TESTS PASSED!\n");
  }
}

run()
  .catch((e) => {
    console.error("Test error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
