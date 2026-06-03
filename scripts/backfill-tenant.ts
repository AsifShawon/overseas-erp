import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set in environment.");
  }

  console.log("🌱 Database backfill connection setup...");
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("🌱 Running database tenant backfill...");

  // 1. Find or create the default Company
  const defaultSlug = "demo-overseas-agency";
  const defaultCompanyName = "Demo Overseas Agency";

  // Find the first Super Admin email to map as owner
  const adminUser = await prisma.user.findFirst({
    where: {
      role: {
        name: "Super Admin",
      },
    },
  });

  const ownerEmail = adminUser?.email || "admin@demo.local";
  const ownerName = adminUser?.fullName || "Demo Owner";

  console.log(`ℹ️ Mapping default owner: ${ownerName} (${ownerEmail})`);

  let company = await prisma.company.findUnique({
    where: { slug: defaultSlug },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: defaultCompanyName,
        slug: defaultSlug,
        ownerEmail,
        ownerName,
        status: "ACTIVE",
        country: "Bangladesh",
      },
    });
    console.log(`✔ Created default company: ${company.name} [ID: ${company.id}]`);
  } else {
    console.log(`ℹ️ Found existing default company: ${company.name} [ID: ${company.id}]`);
  }

  // 2. Ensure CompanySubscription exists using SaaSPlan code STANDARD
  const standardPlan = await prisma.saaSPlan.findUnique({
    where: { code: "STANDARD" },
  });

  if (!standardPlan) {
    throw new Error("STANDARD SaaS plan not found in database. Run db seed first.");
  }

  const existingSubscription = await prisma.companySubscription.findUnique({
    where: { companyId: company.id },
  });

  if (!existingSubscription) {
    await prisma.companySubscription.create({
      data: {
        companyId: company.id,
        planId: standardPlan.id,
        status: "ACTIVE",
        startedAt: new Date(),
      },
    });
    console.log("✔ Created Standard subscription for default company.");
  } else {
    console.log("ℹ️ Standard subscription already exists.");
  }

  // 3. Ensure CompanySettings exists for default company
  const existingSettings = await prisma.companySettings.findUnique({
    where: { companyId: company.id },
  });

  if (!existingSettings) {
    await prisma.companySettings.create({
      data: {
        companyId: company.id,
        defaultLocale: "bn",
        allowAgentPortal: true,
        allowApplicantPortal: true,
        allowPublicJobs: true,
      },
    });
    console.log("✔ Created CompanySettings for default company.");
  } else {
    console.log("ℹ️ CompanySettings already exists.");
  }

  // 4. Backfill all existing rows where companyId is null
  const modelsToBackfill = [
    "agent",
    "applicant",
    "jobOrder",
    "workflowHistory",
    "document",
    "invoice",
    "receipt",
    "ledgerEntry",
    "commission",
    "notification",
    "auditLog",
  ] as const;

  const summaryCounts: Record<string, number> = {};

  for (const modelName of modelsToBackfill) {
    const prismaModel = (prisma as any)[modelName];
    if (!prismaModel) {
      console.warn(`⚠ Prisma client model '${modelName}' not found.`);
      continue;
    }

    const { count } = await prismaModel.updateMany({
      where: { companyId: null },
      data: { companyId: company.id },
    });

    summaryCounts[modelName] = count;
    console.log(`✔ Backfilled ${count} records for model '${modelName}'.`);
  }

  console.log("🎉 Database backfill completed successfully!");
  console.log("Summary of backfilled rows:", summaryCounts);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error("❌ Backfill failed:", err);
  process.exit(1);
});
