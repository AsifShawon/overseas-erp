import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set in environment.");
  }

  console.log("🌱 Database connection setup...");
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("🌱 Running UserMembership backfill script...");

  // 1. Find Demo Overseas Agency company by slug = "demo-overseas-agency"
  const defaultSlug = "demo-overseas-agency";
  const company = await prisma.company.findUnique({
    where: { slug: defaultSlug },
  });

  if (!company) {
    console.error(`❌ Default company with slug "${defaultSlug}" not found. Please run backfill-tenant.ts first.`);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  }

  console.log(`ℹ️ Found target company: ${company.name} [ID: ${company.id}]`);
  const ownerEmail = company.ownerEmail || "admin@agency.com";
  console.log(`ℹ️ Owner email designated for this company is: ${ownerEmail}`);

  // 2. Fetch all users
  const users = await prisma.user.findMany({
    include: {
      role: true,
    },
  });

  let skippedCount = 0;
  let createdCount = 0;
  let existingCount = 0;

  for (const user of users) {
    if (!user.roleId) {
      console.log(`⚠️ User ${user.email} has no roleId. Skipping.`);
      skippedCount++;
      continue;
    }

    // Keep platform admin separate
    if (user.isPlatformAdmin && user.email !== ownerEmail) {
      console.log(`ℹ️ Skipping platform admin user: ${user.email}`);
      skippedCount++;
      continue;
    }

    // Check if membership already exists for this user and company
    const existingMembership = await prisma.userMembership.findUnique({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId: company.id,
        },
      },
    });

    if (existingMembership) {
      console.log(`ℹ️ Membership already exists for user ${user.email} under company ${company.name}`);
      existingCount++;
      continue;
    }

    const isOwner = user.email === ownerEmail;

    // Create UserMembership
    await prisma.userMembership.create({
      data: {
        userId: user.id,
        companyId: company.id,
        roleId: user.roleId,
        status: "ACTIVE",
        isOwner: isOwner,
      },
    });

    console.log(`✔ Created UserMembership for ${user.email} (Role: ${user.role.name}, isOwner: ${isOwner})`);
    createdCount++;
  }

  console.log("\n🎉 UserMembership backfill completed successfully!");
  console.log(`Summary:`);
  console.log(`- Total Users Processed: ${users.length}`);
  console.log(`- Memberships Created: ${createdCount}`);
  console.log(`- Memberships Existing: ${existingCount}`);
  console.log(`- Users Skipped: ${skippedCount}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error("❌ Membership backfill failed:", err);
  process.exit(1);
});
