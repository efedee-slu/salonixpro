// scripts/create-paypal-plans.js
// Run with: node scripts/create-paypal-plans.js

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || "sandbox";

const PAYPAL_API_BASE = PAYPAL_MODE === "sandbox" 
  ? "https://api-m.sandbox.paypal.com" 
  : "https://api-m.paypal.com";

async function getAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64");
  
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function createProduct(accessToken) {
  const response = await fetch(`${PAYPAL_API_BASE}/v1/catalogs/products`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "SalonixPro v2",
      description: "Professional Salon Management Software - New Pricing",
      type: "SERVICE",
      category: "SOFTWARE",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create product: ${error}`);
  }

  const data = await response.json();
  return data.id;
}

async function createPlan(accessToken, productId, planType) {
  const plans = {
    monthly: {
      name: "SalonixPro Monthly ($12)",
      description: "Monthly subscription to SalonixPro - $12/month",
      price: "12.00",
      interval: "MONTH",
    },
    yearly: {
      name: "SalonixPro Yearly ($100)",
      description: "Yearly subscription to SalonixPro - $100/year (Save $44!)",
      price: "100.00",
      interval: "YEAR",
    },
  };

  const plan = plans[planType];

  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/plans`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_id: productId,
      name: plan.name,
      description: plan.description,
      billing_cycles: [
        {
          frequency: {
            interval_unit: plan.interval,
            interval_count: 1,
          },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: {
              value: plan.price,
              currency_code: "USD",
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: "CANCEL",
        payment_failure_threshold: 3,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create ${planType} plan: ${error}`);
  }

  const data = await response.json();
  return data.id;
}

async function main() {
  console.log("\n========================================");
  console.log("  CREATING NEW PAYPAL SUBSCRIPTION PLANS");
  console.log("========================================\n");

  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
    console.error("ERROR: Missing PayPal credentials!");
    console.log("\nMake sure your .env file has:");
    console.log("  PAYPAL_CLIENT_ID=your_client_id");
    console.log("  PAYPAL_SECRET=your_secret");
    process.exit(1);
  }

  console.log(`Mode: ${PAYPAL_MODE.toUpperCase()}`);
  console.log(`API: ${PAYPAL_API_BASE}\n`);

  try {
    // Step 1: Get access token
    console.log("Step 1: Getting access token...");
    const accessToken = await getAccessToken();
    console.log("✓ Access token obtained!\n");

    // Step 2: Create product
    console.log("Step 2: Creating product...");
    const productId = await createProduct(accessToken);
    console.log(`✓ Product created: ${productId}\n`);

    // Step 3: Create monthly plan
    console.log("Step 3: Creating Monthly Plan ($12/month)...");
    const monthlyPlanId = await createPlan(accessToken, productId, "monthly");
    console.log(`✓ Monthly plan created: ${monthlyPlanId}\n`);

    // Step 4: Create yearly plan
    console.log("Step 4: Creating Yearly Plan ($100/year)...");
    const yearlyPlanId = await createPlan(accessToken, productId, "yearly");
    console.log(`✓ Yearly plan created: ${yearlyPlanId}\n`);

    // Success!
    console.log("========================================");
    console.log("  SUCCESS! NEW PLANS CREATED!");
    console.log("========================================\n");
    
    console.log("Copy these lines to your .env file:\n");
    console.log("----------------------------------------");
    console.log(`PAYPAL_PRODUCT_ID="${productId}"`);
    console.log(`PAYPAL_PLAN_MONTHLY="${monthlyPlanId}"`);
    console.log(`PAYPAL_PLAN_YEARLY="${yearlyPlanId}"`);
    console.log("----------------------------------------\n");

    console.log("Then restart your server: npm run dev\n");

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    process.exit(1);
  }
}

main();
