// prisma/seed-super-admin.ts
// Idempotent script to create the super admin platform business and user

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL || "admin@salonixpro.com";
  const password = process.env.SUPER_ADMIN_PASSWORD || "Admin@123";
  const slug = "salonixpro-platform";

  // Upsert the platform business
  const business = await prisma.business.upsert({
    where: { slug },
    update: {},
    create: {
      name: "SalonixPro Platform",
      slug,
      email,
      isPlatform: true,
      onboardingComplete: true,
      subscriptionStatus: "ACTIVE",
    },
  });

  console.log(`Platform business: ${business.id} (${business.name})`);

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Upsert the super admin user
  const user = await prisma.user.upsert({
    where: {
      businessId_email: {
        businessId: business.id,
        email,
      },
    },
    update: {
      passwordHash,
      role: "SUPER_ADMIN",
      mustChangePassword: false,
    },
    create: {
      businessId: business.id,
      email,
      username: "superadmin",
      passwordHash,
      firstName: "Super",
      lastName: "Admin",
      role: "SUPER_ADMIN",
      mustChangePassword: false,
    },
  });

  console.log(`Super admin user: ${user.id} (${user.email})`);
  console.log(`\nLogin credentials:`);
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${password}`);
}

main()
  .catch((e) => {
    console.error("Error seeding super admin:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
