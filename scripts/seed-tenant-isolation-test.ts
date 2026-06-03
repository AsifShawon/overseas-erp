import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as argon2 from "argon2";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set in environment.");
  }

  console.log("🌱 Database connection setup for Company B seed...");
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("🌱 Seeding Company B for multi-tenant isolation verification...");

  // 1. Resolve Standard SaaS plan
  const standardPlan = await prisma.saaSPlan.findUnique({
    where: { code: "STANDARD" },
  });
  if (!standardPlan) {
    throw new Error("STANDARD SaaS plan not found in database. Run db seed first.");
  }

  // 2. Resolve Roles
  const superAdminRole = await prisma.role.findUnique({ where: { name: "Super Admin" } });
  const agentRole = await prisma.role.findUnique({ where: { name: "Agent" } });
  const applicantRole = await prisma.role.findUnique({ where: { name: "Applicant" } });

  if (!superAdminRole || !agentRole || !applicantRole) {
    throw new Error("Required system Roles (Super Admin, Agent, Applicant) not found. Run db seed first.");
  }

  const passwordHash = await argon2.hash("Password123!");

  // 3. Create/Find Company B
  const companySlug = "test-study-abroad-agency";
  let companyB = await prisma.company.findUnique({
    where: { slug: companySlug },
  });

  if (!companyB) {
    companyB = await prisma.company.create({
      data: {
        name: "Test Study Abroad Agency",
        slug: companySlug,
        ownerEmail: "owner@teststudy.local",
        ownerName: "Test Company Owner",
        status: "ACTIVE",
        country: "Bangladesh",
      },
    });
    console.log(`✔ Created Company B: ${companyB.name} [ID: ${companyB.id}]`);
  } else {
    console.log(`ℹ Found existing Company B: ${companyB.name} [ID: ${companyB.id}]`);
  }

  // 4. Ensure Company B subscription
  const existingSub = await prisma.companySubscription.findUnique({
    where: { companyId: companyB.id },
  });
  if (!existingSub) {
    await prisma.companySubscription.create({
      data: {
        companyId: companyB.id,
        planId: standardPlan.id,
        status: "ACTIVE",
        startedAt: new Date(),
      },
    });
    console.log("✔ Created Standard subscription for Company B.");
  }

  // 5. Ensure Company B settings
  const existingSettings = await prisma.companySettings.findUnique({
    where: { companyId: companyB.id },
  });
  if (!existingSettings) {
    await prisma.companySettings.create({
      data: {
        companyId: companyB.id,
        defaultLocale: "en",
        allowAgentPortal: true,
        allowApplicantPortal: true,
        allowPublicJobs: true,
      },
    });
    console.log("✔ Created CompanySettings for Company B.");
  }

  // 6. Create Owner User and Membership
  let ownerUser = await prisma.user.findUnique({
    where: { email: "owner@teststudy.local" },
  });
  if (!ownerUser) {
    ownerUser = await prisma.user.create({
      data: {
        email: "owner@teststudy.local",
        passwordHash,
        fullName: "Test Company Owner",
        roleId: superAdminRole.id,
        isActive: true,
      },
    });
    console.log(`✔ Created Owner User: ${ownerUser.email}`);
  }

  const existingOwnerMembership = await prisma.userMembership.findUnique({
    where: {
      userId_companyId: {
        userId: ownerUser.id,
        companyId: companyB.id,
      },
    },
  });
  if (!existingOwnerMembership) {
    await prisma.userMembership.create({
      data: {
        userId: ownerUser.id,
        companyId: companyB.id,
        roleId: superAdminRole.id,
        status: "ACTIVE",
        isOwner: true,
      },
    });
    console.log("✔ Created Owner UserMembership for Company B.");
  }

  // 7. Create Agent User, Membership, and Profile
  let agentUser = await prisma.user.findUnique({
    where: { email: "agent@teststudy.local" },
  });
  if (!agentUser) {
    agentUser = await prisma.user.create({
      data: {
        email: "agent@teststudy.local",
        passwordHash,
        fullName: "Test Company Agent",
        roleId: agentRole.id,
        isActive: true,
      },
    });
    console.log(`✔ Created Agent User: ${agentUser.email}`);
  }

  const existingAgentMembership = await prisma.userMembership.findUnique({
    where: {
      userId_companyId: {
        userId: agentUser.id,
        companyId: companyB.id,
      },
    },
  });
  if (!existingAgentMembership) {
    await prisma.userMembership.create({
      data: {
        userId: agentUser.id,
        companyId: companyB.id,
        roleId: agentRole.id,
        status: "ACTIVE",
        isOwner: false,
      },
    });
    console.log("✔ Created Agent UserMembership for Company B.");
  }

  let agentProfile = await prisma.agent.findUnique({
    where: { userId: agentUser.id },
  });
  if (!agentProfile) {
    agentProfile = await prisma.agent.create({
      data: {
        userId: agentUser.id,
        agentCode: "AGT-TESTB-01",
        companyName: "Test Company B Sourcing Partner",
        tier: "B",
        phone: "01800000001",
        isActive: true,
        companyId: companyB.id,
      },
    });
    console.log(`✔ Created Agent Profile: ${agentProfile.agentCode}`);
  }

  // 8. Create Job Order
  const jobOrderNum = "JO-TESTB-01";
  let jobOrder = await prisma.jobOrder.findUnique({
    where: { orderNumber: jobOrderNum },
  });
  if (!jobOrder) {
    jobOrder = await prisma.jobOrder.create({
      data: {
        orderNumber: jobOrderNum,
        employerName: "Japan Tech Agri Corp",
        country: "Japan",
        trade: "Agriculture Worker",
        salary: 180000,
        totalQuota: 10,
        allocatedQuota: 1,
        commissionAmount: 1500,
        status: "ACTIVE",
        companyId: companyB.id,
      },
    });
    console.log(`✔ Created Job Order: ${jobOrder.orderNumber}`);
  }

  // 9. Create Applicant User, Membership, and Profile
  let applicantUser = await prisma.user.findUnique({
    where: { email: "applicant@teststudy.local" },
  });
  if (!applicantUser) {
    applicantUser = await prisma.user.create({
      data: {
        email: "applicant@teststudy.local",
        passwordHash,
        fullName: "Test Company Applicant",
        roleId: applicantRole.id,
        isActive: true,
      },
    });
    console.log(`✔ Created Applicant User: ${applicantUser.email}`);
  }

  const existingAppMembership = await prisma.userMembership.findUnique({
    where: {
      userId_companyId: {
        userId: applicantUser.id,
        companyId: companyB.id,
      },
    },
  });
  if (!existingAppMembership) {
    await prisma.userMembership.create({
      data: {
        userId: applicantUser.id,
        companyId: companyB.id,
        roleId: applicantRole.id,
        status: "ACTIVE",
        isOwner: false,
      },
    });
    console.log("✔ Created Applicant UserMembership for Company B.");
  }

  let applicantProfile = await prisma.applicant.findUnique({
    where: { passportNumber: "P-TESTB-112233" },
  });
  if (!applicantProfile) {
    applicantProfile = await prisma.applicant.create({
      data: {
        userId: applicantUser.id,
        agentId: agentProfile.id,
        jobOrderId: jobOrder.id,
        passportNumber: "P-TESTB-112233",
        passportExpiry: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000), // 5 years from now
        nationality: "Bangladesh",
        fullName: "Test Company Applicant",
        phone: "01700000000",
        email: "applicant@teststudy.local",
        dateOfBirth: new Date("1995-01-01"),
        trade: "Agriculture Worker",
        currentStage: "SELECTED",
        companyId: companyB.id,
      },
    });
    console.log(`✔ Created Applicant Profile: ${applicantProfile.fullName}`);
  }

  // 10. Create Invoice
  const invoiceNo = "INV-TESTB-01";
  let invoice = await prisma.invoice.findUnique({
    where: { invoiceNo },
  });
  if (!invoice) {
    invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        applicantId: applicantProfile.id,
        amount: 50000,
        outstanding: 20000,
        description: "Visa processing & service charge B",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        companyId: companyB.id,
      },
    });
    console.log(`✔ Created Invoice: ${invoice.invoiceNo}`);
  }

  // 11. Create Receipt
  const receiptNo = "REC-TESTB-01";
  let receipt = await prisma.receipt.findUnique({
    where: { receiptNo },
  });
  if (!receipt) {
    receipt = await prisma.receipt.create({
      data: {
        receiptNo,
        applicantId: applicantProfile.id,
        invoiceId: invoice.id,
        amountPaid: 30000,
        paymentMethod: "CASH",
        referenceNo: "REF-TESTB-01",
        receivedById: ownerUser.id,
        companyId: companyB.id,
      },
    });
    console.log(`✔ Created Receipt: ${receipt.receiptNo}`);
  }

  // 12. Create Ledger Entry for the Invoice and Receipt
  const invoiceLedger = await prisma.ledgerEntry.findFirst({
    where: { referenceId: invoice.id },
  });
  if (!invoiceLedger) {
    await prisma.ledgerEntry.create({
      data: {
        applicantId: applicantProfile.id,
        transactionType: "INVOICE",
        referenceId: invoice.id,
        debit: 50000,
        credit: 0,
        runningBalance: 50000,
        timestamp: new Date(),
        companyId: companyB.id,
      },
    });
    console.log("✔ Created Invoice Ledger Entry.");
  }

  const receiptLedger = await prisma.ledgerEntry.findFirst({
    where: { referenceId: receipt.id },
  });
  if (!receiptLedger) {
    await prisma.ledgerEntry.create({
      data: {
        applicantId: applicantProfile.id,
        transactionType: "RECEIPT",
        referenceId: receipt.id,
        debit: 0,
        credit: 30000,
        runningBalance: 20000,
        timestamp: new Date(),
        companyId: companyB.id,
      },
    });
    console.log("✔ Created Receipt Ledger Entry.");
  }

  // 13. Create Notification
  const existingNotification = await prisma.notification.findFirst({
    where: { userId: ownerUser.id, companyId: companyB.id },
  });
  if (!existingNotification) {
    await prisma.notification.create({
      data: {
        userId: ownerUser.id,
        title: "Welcome to Test Study Abroad Agency",
        message: "This notification is scoped to Company B only.",
        isRead: false,
        companyId: companyB.id,
      },
    });
    console.log("✔ Created Notification for Company B owner.");
  }

  // 14. Create Audit Log
  const existingAudit = await prisma.auditLog.findFirst({
    where: { companyId: companyB.id, actionType: "SEED_COMPANY_B" },
  });
  if (!existingAudit) {
    await prisma.auditLog.create({
      data: {
        userId: ownerUser.id,
        roleName: "Super Admin",
        actionType: "SEED_COMPANY_B",
        tableName: "Company",
        recordId: companyB.id,
        delta: { status: "ACTIVE" } as any,
        companyId: companyB.id,
        ipAddress: "127.0.0.1",
      },
    });
    console.log("✔ Created AuditLog for Company B.");
  }

  console.log("🎉 Seeding Company B completed successfully!");

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error("❌ Seeding Company B failed:", err);
  process.exit(1);
});
