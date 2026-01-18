// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Create demo business
  const business = await prisma.business.upsert({
    where: { slug: "demo-salon" },
    update: {},
    create: {
      name: "Demo Salon",
      slug: "demo-salon",
      email: "demo@salonixpro.com",
      phone: "758-123-4567",
      address: "123 Main Street",
      city: "Castries",
      country: "Saint Lucia",
      currency: "XCD",
      currencySymbol: "EC$",
      timezone: "America/St_Lucia",
      businessHours: [
        { day: "Sunday", dayIndex: 0, isOpen: false, openTime: "09:00", closeTime: "17:00" },
        { day: "Monday", dayIndex: 1, isOpen: true, openTime: "09:00", closeTime: "18:00" },
        { day: "Tuesday", dayIndex: 2, isOpen: true, openTime: "09:00", closeTime: "18:00" },
        { day: "Wednesday", dayIndex: 3, isOpen: true, openTime: "09:00", closeTime: "18:00" },
        { day: "Thursday", dayIndex: 4, isOpen: true, openTime: "09:00", closeTime: "18:00" },
        { day: "Friday", dayIndex: 5, isOpen: true, openTime: "09:00", closeTime: "18:00" },
        { day: "Saturday", dayIndex: 6, isOpen: true, openTime: "09:00", closeTime: "16:00" },
      ],
    },
  });
  console.log("✅ Business created:", business.name);

  // Create admin user
  const passwordHash = await bcrypt.hash("Admin@123", 12);
  const admin = await prisma.user.upsert({
    where: {
      businessId_username: {
        businessId: business.id,
        username: "admin",
      },
    },
    update: {},
    create: {
      businessId: business.id,
      email: "admin@demo-salon.com",
      username: "admin",
      passwordHash: passwordHash,
      firstName: "Admin",
      lastName: "User",
      role: "OWNER",
    },
  });
  console.log("✅ Admin user created:", admin.username);

  // Create service categories
  const categories = [
    { name: "Haircuts", icon: "✂️" },
    { name: "Color Services", icon: "🎨" },
    { name: "Treatments", icon: "💆" },
    { name: "Styling", icon: "💇" },
    { name: "Extensions", icon: "✨" },
  ];

  for (const cat of categories) {
    await prisma.serviceCategory.upsert({
      where: {
        businessId_name: {
          businessId: business.id,
          name: cat.name,
        },
      },
      update: {},
      create: {
        businessId: business.id,
        name: cat.name,
        icon: cat.icon,
      },
    });
  }
  console.log("✅ Service categories created");

  // Get category IDs
  const haircutsCat = await prisma.serviceCategory.findFirst({
    where: { businessId: business.id, name: "Haircuts" },
  });
  const colorCat = await prisma.serviceCategory.findFirst({
    where: { businessId: business.id, name: "Color Services" },
  });
  const treatmentsCat = await prisma.serviceCategory.findFirst({
    where: { businessId: business.id, name: "Treatments" },
  });
  const stylingCat = await prisma.serviceCategory.findFirst({
    where: { businessId: business.id, name: "Styling" },
  });

  // Create services
  const services = [
    { name: "Women's Haircut", duration: 45, price: 65, categoryId: haircutsCat?.id },
    { name: "Men's Haircut", duration: 30, price: 45, categoryId: haircutsCat?.id },
    { name: "Kids Haircut", duration: 30, price: 35, categoryId: haircutsCat?.id },
    { name: "Full Color", duration: 120, price: 150, categoryId: colorCat?.id },
    { name: "Highlights", duration: 150, price: 200, categoryId: colorCat?.id },
    { name: "Balayage", duration: 180, price: 280, categoryId: colorCat?.id },
    { name: "Root Touch-Up", duration: 60, price: 85, categoryId: colorCat?.id },
    { name: "Deep Conditioning", duration: 30, price: 45, categoryId: treatmentsCat?.id },
    { name: "Keratin Treatment", duration: 180, price: 350, categoryId: treatmentsCat?.id },
    { name: "Brazilian Blowout", duration: 180, price: 320, categoryId: treatmentsCat?.id },
    { name: "Blowout", duration: 45, price: 55, categoryId: stylingCat?.id },
    { name: "Updo", duration: 60, price: 85, categoryId: stylingCat?.id },
    { name: "Bridal Style", duration: 90, price: 150, categoryId: stylingCat?.id },
  ];

  for (const service of services) {
    await prisma.service.create({
      data: {
        businessId: business.id,
        categoryId: service.categoryId,
        name: service.name,
        duration: service.duration,
        price: service.price,
      },
    });
  }
  console.log("✅ Services created");

  // Create a stylist
  const stylist = await prisma.stylist.create({
    data: {
      businessId: business.id,
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah@demo-salon.com",
      phone: "758-555-0101",
      bio: "Senior stylist with 10 years of experience",
    },
  });
  console.log("✅ Stylist created:", stylist.firstName);

  // Create stylist schedule (Mon-Sat, 9am-6pm)
  for (let day = 1; day <= 6; day++) {
    await prisma.stylistSchedule.create({
      data: {
        stylistId: stylist.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "18:00",
        isWorking: true,
      },
    });
  }
  // Sunday off
  await prisma.stylistSchedule.create({
    data: {
      stylistId: stylist.id,
      dayOfWeek: 0,
      startTime: "09:00",
      endTime: "18:00",
      isWorking: false,
    },
  });
  console.log("✅ Stylist schedule created");

  // Create product categories
  const productCategories = [
    { name: "Shampoo & Conditioner", icon: "🧴" },
    { name: "Styling Products", icon: "💅" },
    { name: "Hair Extensions", icon: "💇" },
    { name: "Tools & Accessories", icon: "🔧" },
  ];

  for (const cat of productCategories) {
    await prisma.productCategory.upsert({
      where: {
        businessId_name: {
          businessId: business.id,
          name: cat.name,
        },
      },
      update: {},
      create: {
        businessId: business.id,
        name: cat.name,
        icon: cat.icon,
      },
    });
  }
  console.log("✅ Product categories created");

  // Get product category IDs
  const shampooCat = await prisma.productCategory.findFirst({
    where: { businessId: business.id, name: "Shampoo & Conditioner" },
  });
  const stylingProdCat = await prisma.productCategory.findFirst({
    where: { businessId: business.id, name: "Styling Products" },
  });

  // Create some products
  const products = [
    { sku: "SH-001", name: "Hydrating Shampoo", retailPrice: 28, stockOnHand: 15, categoryId: shampooCat?.id },
    { sku: "CD-001", name: "Deep Moisture Conditioner", retailPrice: 32, stockOnHand: 12, categoryId: shampooCat?.id },
    { sku: "ST-001", name: "Curl Defining Cream", retailPrice: 24, stockOnHand: 8, categoryId: stylingProdCat?.id },
    { sku: "ST-002", name: "Heat Protection Spray", retailPrice: 22, stockOnHand: 20, categoryId: stylingProdCat?.id },
    { sku: "ST-003", name: "Finishing Hairspray", retailPrice: 18, stockOnHand: 3, categoryId: stylingProdCat?.id },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: {
        businessId: business.id,
        categoryId: product.categoryId,
        sku: product.sku,
        name: product.name,
        retailPrice: product.retailPrice,
        stockOnHand: product.stockOnHand,
        reorderLevel: 5,
      },
    });
  }
  console.log("✅ Products created");

  // Create some sample clients
  const clients = [
    { firstName: "Maria", lastName: "Johnson", phone: "758-555-1001", email: "maria@example.com" },
    { firstName: "Ashley", lastName: "Brown", phone: "758-555-1002", email: "ashley@example.com" },
    { firstName: "Jennifer", lastName: "Davis", phone: "758-555-1003", email: "jennifer@example.com" },
    { firstName: "Lisa", lastName: "Wilson", phone: "758-555-1004", email: "lisa@example.com" },
    { firstName: "Nicole", lastName: "Garcia", phone: "758-555-1005", email: "nicole@example.com" },
  ];

  for (const client of clients) {
    await prisma.client.upsert({
      where: {
        businessId_phone: {
          businessId: business.id,
          phone: client.phone,
        },
      },
      update: {},
      create: {
        businessId: business.id,
        ...client,
      },
    });
  }
  console.log("✅ Clients created");

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📋 Demo Credentials:");
  console.log("   Username: admin");
  console.log("   Password: Admin@123");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
