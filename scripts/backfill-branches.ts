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

  console.log("🌱 Running Branch foundation backfill script...");

  // 1. Fetch all companies
  const companies = await prisma.company.findMany();
  console.log(`ℹ️ Found ${companies.length} companies to process.`);

  for (const company of companies) {
    console.log(`\n🏢 Processing company: ${company.name} [ID: ${company.id}]`);

    // 2. Find or create default Head Office branch
    let headOffice = await prisma.branch.findFirst({
      where: {
        companyId: company.id,
        isHeadOffice: true,
      },
    });

    if (!headOffice) {
      // Check if there is one matching "HO" code but maybe not marked isHeadOffice
      headOffice = await prisma.branch.findUnique({
        where: {
          companyId_code: {
            companyId: company.id,
            code: "HO",
          },
        },
      });
    }

    if (!headOffice) {
      headOffice = await prisma.branch.create({
        data: {
          companyId: company.id,
          name: "Head Office",
          code: "HO",
          isHeadOffice: true,
          status: "ACTIVE",
        },
      });
      console.log(`   ✓ Created Head Office branch: ID ${headOffice.id}`);
    } else {
      console.log(`   ℹ️ Head Office branch already exists: ID ${headOffice.id}`);
      if (!headOffice.isHeadOffice) {
        // Correct isHeadOffice flag
        headOffice = await prisma.branch.update({
          where: { id: headOffice.id },
          data: { isHeadOffice: true },
        });
        console.log(`   ✓ Updated isHeadOffice = true for branch ${headOffice.id}`);
      }
    }

    const branchId = headOffice.id;

    // 3. Backfill tables
    const tables = [
      { name: "Applicant", model: prisma.applicant },
      { name: "Agent", model: prisma.agent },
      { name: "JobOrder", model: prisma.jobOrder },
      { name: "Invoice", model: prisma.invoice },
      { name: "Receipt", model: prisma.receipt },
      { name: "LedgerEntry", model: prisma.ledgerEntry },
      { name: "Commission", model: prisma.commission },
      { name: "Task", model: prisma.task },
      { name: "Notification", model: prisma.notification },
      { name: "AuditLog", model: prisma.auditLog },
    ];

    for (const table of tables) {
      const result = await (table.model as any).updateMany({
        where: {
          companyId: company.id,
          branchId: null,
        },
        data: {
          branchId,
        },
      });
      if (result.count > 0) {
        console.log(`   ✓ Backfilled ${result.count} records in ${table.name} to Branch ID ${branchId}`);
      } else {
        console.log(`   ℹ️ No records to backfill in ${table.name}`);
      }
    }
  }

  console.log("\n🎉 Branch backfill completed successfully!");

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error("❌ Branch backfill failed:", err);
  process.exit(1);
});
