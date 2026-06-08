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

  console.log("🌱 Running UserMembership to BranchMembership backfill script...");

  // 1. Fetch all companies
  const companies = await prisma.company.findMany();
  console.log(`ℹ️ Found ${companies.length} companies to process.`);

  for (const company of companies) {
    console.log(`\n🏢 Company: ${company.name} [ID: ${company.id}]`);

    // Find HO branch
    const hoBranch = await prisma.branch.findFirst({
      where: {
        companyId: company.id,
        code: "HO",
      },
    });

    if (!hoBranch) {
      console.log(`⚠️ Warning: No "HO" branch found for company ${company.name}. Skipping membership backfill.`);
      continue;
    }

    // Get active user memberships
    const userMemberships = await prisma.userMembership.findMany({
      where: {
        companyId: company.id,
        status: "ACTIVE",
      },
      include: {
        role: true,
      },
    });

    let createdCount = 0;
    let existingCount = 0;

    for (const membership of userMemberships) {
      // Check if duplicate exists
      const existing = await prisma.branchMembership.findFirst({
        where: {
          userId: membership.userId,
          branchId: hoBranch.id,
          roleId: membership.roleId,
        },
      });

      if (existing) {
        existingCount++;
        continue;
      }

      const isBranchManager = 
        membership.isOwner || 
        membership.role.name === "Super Admin" || 
        membership.role.name === "Operations Admin";

      await prisma.branchMembership.create({
        data: {
          userId: membership.userId,
          companyId: company.id,
          branchId: hoBranch.id,
          roleId: membership.roleId,
          status: "ACTIVE",
          isBranchManager,
        },
      });

      createdCount++;
    }

    console.log(`   ✓ BranchMemberships created: ${createdCount}`);
    console.log(`   ✓ BranchMemberships already existed: ${existingCount}`);
  }

  await prisma.$disconnect();
  await pool.end();
  console.log("\n🎉 UserMembership to BranchMembership backfill finished successfully!");
}

main().catch((err) => {
  console.error("❌ Backfill failed:", err);
  process.exit(1);
});
