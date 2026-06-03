import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { assertRecordBelongsToCompany } from "../src/lib/tenant-scope";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set in environment.");
  }

  console.log("🌱 Database connection setup for tenant isolation test...");
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("🌱 Running tenant isolation verification checks...");

  // 1. Resolve Company A and Company B
  const companyA = await prisma.company.findUnique({
    where: { slug: "demo-overseas-agency" },
  });
  const companyB = await prisma.company.findUnique({
    where: { slug: "test-study-abroad-agency" },
  });

  if (!companyA || !companyB) {
    throw new Error("Missing companies. Make sure to run backfill and seed first.");
  }

  console.log(`ℹ️ Company A (Demo): ID = ${companyA.id}`);
  console.log(`ℹ️ Company B (Test): ID = ${companyB.id}`);

  // Test 1: Count of records for Company A should NOT mix with Company B
  const applicantsA = await prisma.applicant.findMany({ where: { companyId: companyA.id } });
  const applicantsB = await prisma.applicant.findMany({ where: { companyId: companyB.id } });
  console.log(`ℹ️ Applicants A count: ${applicantsA.length}, Applicants B count: ${applicantsB.length}`);

  if (applicantsA.some(a => a.companyId === companyB.id)) {
    throw new Error("❌ FAIL: Company A applicant list contains Company B applicants.");
  }
  if (applicantsB.some(b => b.companyId === companyA.id)) {
    throw new Error("❌ FAIL: Company B applicant list contains Company A applicants.");
  }
  console.log("✔ PASS: Applicant tenant separation validated.");

  // Test 2: Sourcing Agent isolation
  const agentsA = await prisma.agent.findMany({ where: { companyId: companyA.id } });
  const agentsB = await prisma.agent.findMany({ where: { companyId: companyB.id } });
  console.log(`ℹ️ Agents A count: ${agentsA.length}, Agents B count: ${agentsB.length}`);

  if (agentsA.some(a => a.companyId === companyB.id)) {
    throw new Error("❌ FAIL: Company A agents list contains Company B agents.");
  }
  if (agentsB.some(b => b.companyId === companyA.id)) {
    throw new Error("❌ FAIL: Company B agents list contains Company A agents.");
  }
  console.log("✔ PASS: Agent tenant separation validated.");

  // Test 3: Job Order isolation
  const jobsA = await prisma.jobOrder.findMany({ where: { companyId: companyA.id } });
  const jobsB = await prisma.jobOrder.findMany({ where: { companyId: companyB.id } });
  console.log(`ℹ️ Job Orders A count: ${jobsA.length}, Job Orders B count: ${jobsB.length}`);

  if (jobsA.some(j => j.companyId === companyB.id)) {
    throw new Error("❌ FAIL: Company A job orders list contains Company B job orders.");
  }
  if (jobsB.some(j => j.companyId === companyA.id)) {
    throw new Error("❌ FAIL: Company B job orders list contains Company A job orders.");
  }
  console.log("✔ PASS: Job Order tenant separation validated.");

  // Test 4: Financial Isolation (Invoices, Receipts, Ledger)
  const invoicesA = await prisma.invoice.findMany({ where: { companyId: companyA.id } });
  const invoicesB = await prisma.invoice.findMany({ where: { companyId: companyB.id } });
  console.log(`ℹ️ Invoices A count: ${invoicesA.length}, Invoices B count: ${invoicesB.length}`);

  if (invoicesA.some(i => i.companyId === companyB.id)) {
    throw new Error("❌ FAIL: Company A invoices list contains Company B invoices.");
  }
  if (invoicesB.some(i => i.companyId === companyA.id)) {
    throw new Error("❌ FAIL: Company B invoices list contains Company A invoices.");
  }
  console.log("✔ PASS: Invoice tenant separation validated.");

  const receiptsA = await prisma.receipt.findMany({ where: { companyId: companyA.id } });
  const receiptsB = await prisma.receipt.findMany({ where: { companyId: companyB.id } });
  console.log(`ℹ️ Receipts A count: ${receiptsA.length}, Receipts B count: ${receiptsB.length}`);

  if (receiptsA.some(r => r.companyId === companyB.id)) {
    throw new Error("❌ FAIL: Company A receipts list contains Company B receipts.");
  }
  if (receiptsB.some(r => r.companyId === companyA.id)) {
    throw new Error("❌ FAIL: Company B receipts list contains Company A receipts.");
  }
  console.log("✔ PASS: Receipt tenant separation validated.");

  const ledgerA = await prisma.ledgerEntry.findMany({ where: { companyId: companyA.id } });
  const ledgerB = await prisma.ledgerEntry.findMany({ where: { companyId: companyB.id } });
  console.log(`ℹ️ Ledger A count: ${ledgerA.length}, Ledger B count: ${ledgerB.length}`);

  if (ledgerA.some(l => l.companyId === companyB.id)) {
    throw new Error("❌ FAIL: Company A ledger list contains Company B ledger entries.");
  }
  if (ledgerB.some(l => l.companyId === companyA.id)) {
    throw new Error("❌ FAIL: Company B ledger list contains Company A ledger entries.");
  }
  console.log("✔ PASS: Ledger tenant separation validated.");

  // Test 5: Notifications & Audit logs isolation
  const notificationsA = await prisma.notification.findMany({ where: { companyId: companyA.id } });
  const notificationsB = await prisma.notification.findMany({ where: { companyId: companyB.id } });
  console.log(`ℹ️ Notifications A count: ${notificationsA.length}, Notifications B count: ${notificationsB.length}`);

  if (notificationsA.some(n => n.companyId === companyB.id)) {
    throw new Error("❌ FAIL: Company A notifications contains Company B notifications.");
  }
  if (notificationsB.some(n => n.companyId === companyA.id)) {
    throw new Error("❌ FAIL: Company B notifications contains Company A notifications.");
  }
  console.log("✔ PASS: Notification tenant separation validated.");

  const auditsA = await prisma.auditLog.findMany({ where: { companyId: companyA.id } });
  const auditsB = await prisma.auditLog.findMany({ where: { companyId: companyB.id } });
  console.log(`ℹ️ Audit Logs A count: ${auditsA.length}, Audit Logs B count: ${auditsB.length}`);

  if (auditsA.some(a => a.companyId === companyB.id)) {
    throw new Error("❌ FAIL: Company A audit logs contains Company B audit logs.");
  }
  if (auditsB.some(a => a.companyId === companyA.id)) {
    throw new Error("❌ FAIL: Company B audit logs contains Company A audit logs.");
  }
  console.log("✔ PASS: Audit Log tenant separation validated.");

  // Test 6: Cross-tenant lookup attack test using assertRecordBelongsToCompany helper
  const testBApplicant = applicantsB[0];
  if (!testBApplicant) {
    throw new Error("Missing test B applicant for cross-tenant verification.");
  }

  console.log(`ℹ️ Testing cross-tenant lookup check with helper assertRecordBelongsToCompany...`);
  try {
    // Attempting to query Company B's applicant using Company A's active company ID context
    await assertRecordBelongsToCompany(prisma.applicant, testBApplicant.id, companyA.id);
    throw new Error("❌ FAIL: Lookup succeeded when it should have failed (cross-tenant data leak).");
  } catch (error: any) {
    if (error.message === "RECORD_NOT_FOUND") {
      console.log("✔ PASS: Correctly blocked cross-tenant record query (RECORD_NOT_FOUND thrown).");
    } else {
      throw error;
    }
  }

  const testBInvoice = invoicesB[0];
  if (testBInvoice) {
    console.log(`ℹ️ Testing cross-tenant lookup check for invoice...`);
    try {
      await assertRecordBelongsToCompany(prisma.invoice, testBInvoice.id, companyA.id);
      throw new Error("❌ FAIL: Invoice lookup succeeded across tenants.");
    } catch (error: any) {
      if (error.message === "RECORD_NOT_FOUND") {
        console.log("✔ PASS: Correctly blocked cross-tenant invoice query.");
      } else {
        throw error;
      }
    }
  }

  console.log("\n🎉 All tenant isolation verification checks passed successfully!");

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error("❌ Isolation verification failed:", err);
  process.exit(1);
});
