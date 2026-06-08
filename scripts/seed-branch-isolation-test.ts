import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as argon2 from "argon2";
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

  console.log("🌱 Seeding branch isolation test data...");

  // 1. Find or create company
  let company = await prisma.company.findFirst({
    where: { name: "Branch Test Company" },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: "Branch Test Company",
        slug: "branchtest",
        ownerEmail: "owner@branchtest.com",
        status: "ACTIVE",
      },
    });
  }

  // 2. Find or create HO, Branch A, and Branch B
  let hoBranch = await prisma.branch.findFirst({
    where: { companyId: company.id, code: "HO" },
  });
  if (!hoBranch) {
    hoBranch = await prisma.branch.create({
      data: {
        companyId: company.id,
        name: "Head Office",
        code: "HO",
        city: "Dhaka",
        isHeadOffice: true,
        status: "ACTIVE",
      },
    });
  }

  let branchA = await prisma.branch.findFirst({
    where: { companyId: company.id, code: "BRA" },
  });
  if (!branchA) {
    branchA = await prisma.branch.create({
      data: {
        companyId: company.id,
        name: "Branch A",
        code: "BRA",
        city: "Chittagong",
        status: "ACTIVE",
      },
    });
  }

  let branchB = await prisma.branch.findFirst({
    where: { companyId: company.id, code: "BRB" },
  });
  if (!branchB) {
    branchB = await prisma.branch.create({
      data: {
        companyId: company.id,
        name: "Branch B",
        code: "BRB",
        city: "Sylhet",
        status: "ACTIVE",
      },
    });
  }

  // 3. Find roles
  const superAdminRole = await prisma.role.findFirst({
    where: { name: "Super Admin" },
  });
  const hrOfficerRole = await prisma.role.findFirst({
    where: { name: "HR Officer" },
  });

  if (!superAdminRole || !hrOfficerRole) {
    throw new Error("Required roles (Super Admin, HR Officer) not found in DB.");
  }

  const passwordHash = await argon2.hash("Password123");

  // 4. Create Users, UserMemberships, and BranchMemberships
  // A. Company Owner (all branches via Super Admin)
  let ownerUser = await prisma.user.findUnique({
    where: { email: "owner@branchtest.com" },
  });
  if (!ownerUser) {
    ownerUser = await prisma.user.create({
      data: {
        email: "owner@branchtest.com",
        fullName: "Company Owner",
        passwordHash,
        roleId: superAdminRole.id,
        isActive: true,
      },
    });
  }

  let ownerMembership = await prisma.userMembership.findFirst({
    where: { userId: ownerUser.id, companyId: company.id },
  });
  if (!ownerMembership) {
    ownerMembership = await prisma.userMembership.create({
      data: {
        userId: ownerUser.id,
        companyId: company.id,
        roleId: superAdminRole.id,
        status: "ACTIVE",
        isOwner: true,
      },
    });
  }

  // Backfill Owner to HO branch
  let ownerBranchMembership = await prisma.branchMembership.findFirst({
    where: { userId: ownerUser.id, branchId: hoBranch.id },
  });
  if (!ownerBranchMembership) {
    await prisma.branchMembership.create({
      data: {
        userId: ownerUser.id,
        companyId: company.id,
        branchId: hoBranch.id,
        roleId: superAdminRole.id,
        status: "ACTIVE",
        isBranchManager: true,
      },
    });
  }

  // B. HR A User (assigned to Branch A only)
  let hrAUser = await prisma.user.findUnique({
    where: { email: "hra@branchtest.com" },
  });
  if (!hrAUser) {
    hrAUser = await prisma.user.create({
      data: {
        email: "hra@branchtest.com",
        fullName: "HR Officer A",
        passwordHash,
        roleId: hrOfficerRole.id,
        isActive: true,
      },
    });
  }

  let hrAMembership = await prisma.userMembership.findFirst({
    where: { userId: hrAUser.id, companyId: company.id },
  });
  if (!hrAMembership) {
    hrAMembership = await prisma.userMembership.create({
      data: {
        userId: hrAUser.id,
        companyId: company.id,
        roleId: hrOfficerRole.id,
        status: "ACTIVE",
        isOwner: false,
      },
    });
  }

  let hrABranchMembership = await prisma.branchMembership.findFirst({
    where: { userId: hrAUser.id, branchId: branchA.id },
  });
  if (!hrABranchMembership) {
    await prisma.branchMembership.create({
      data: {
        userId: hrAUser.id,
        companyId: company.id,
        branchId: branchA.id,
        roleId: hrOfficerRole.id,
        status: "ACTIVE",
        isBranchManager: false,
      },
    });
  }

  // C. HR B User (assigned to Branch B only)
  let hrBUser = await prisma.user.findUnique({
    where: { email: "hrb@branchtest.com" },
  });
  if (!hrBUser) {
    hrBUser = await prisma.user.create({
      data: {
        email: "hrb@branchtest.com",
        fullName: "HR Officer B",
        passwordHash,
        roleId: hrOfficerRole.id,
        isActive: true,
      },
    });
  }

  let hrBMembership = await prisma.userMembership.findFirst({
    where: { userId: hrBUser.id, companyId: company.id },
  });
  if (!hrBMembership) {
    hrBMembership = await prisma.userMembership.create({
      data: {
        userId: hrBUser.id,
        companyId: company.id,
        roleId: hrOfficerRole.id,
        status: "ACTIVE",
        isOwner: false,
      },
    });
  }

  let hrBBranchMembership = await prisma.branchMembership.findFirst({
    where: { userId: hrBUser.id, branchId: branchB.id },
  });
  if (!hrBBranchMembership) {
    await prisma.branchMembership.create({
      data: {
        userId: hrBUser.id,
        companyId: company.id,
        branchId: branchB.id,
        roleId: hrOfficerRole.id,
        status: "ACTIVE",
        isBranchManager: false,
      },
    });
  }

  // 5. Seed operational data
  // Clean old test records in these branches
  await prisma.invoice.deleteMany({ where: { branchId: { in: [branchA.id, branchB.id] } } });
  await prisma.applicant.deleteMany({ where: { branchId: { in: [branchA.id, branchB.id] } } });
  await prisma.jobOrder.deleteMany({ where: { branchId: { in: [branchA.id, branchB.id] } } });
  await prisma.agent.deleteMany({ where: { branchId: { in: [branchA.id, branchB.id] } } });

  // A. Branch A data
  const agentAUser = await prisma.user.create({
    data: {
      email: `agenta_${Date.now()}@branchtest.com`,
      fullName: "Agent A",
      passwordHash,
      roleId: (await prisma.role.findFirst({ where: { name: "Agent" } }))!.id,
    },
  });
  const agentA = await prisma.agent.create({
    data: {
      userId: agentAUser.id,
      agentCode: `AGTA-${Date.now().toString().slice(-4)}`,
      companyName: "Agent A Agency",
      companyId: company.id,
      branchId: branchA.id,
    },
  });

  const jobA = await prisma.jobOrder.create({
    data: {
      companyId: company.id,
      branchId: branchA.id,
      orderNumber: `JOA-${Date.now().toString().slice(-4)}`,
      employerName: "Employer A",
      country: "KSA",
      trade: "Carpenter",
      salary: 1500,
      totalQuota: 10,
      allocatedQuota: 1,
      commissionAmount: 500,
    },
  });

  const applicantA = await prisma.applicant.create({
    data: {
      companyId: company.id,
      branchId: branchA.id,
      fullName: "Applicant A",
      passportNumber: `PPA-${Date.now().toString().slice(-4)}`,
      passportExpiry: new Date("2030-12-31"),
      phone: "01700000001",
      dateOfBirth: new Date("1995-05-15"),
      trade: "Carpenter",
      currentStage: "APPLIED",
      agentId: agentA.id,
      jobOrderId: jobA.id,
    },
  });

  const invoiceA = await prisma.invoice.create({
    data: {
      companyId: company.id,
      branchId: branchA.id,
      applicantId: applicantA.id,
      invoiceNo: `INVA-${Date.now().toString().slice(-4)}`,
      amount: 5000,
      outstanding: 5000,
      description: "Service Charge",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // B. Branch B data
  const agentBUser = await prisma.user.create({
    data: {
      email: `agentb_${Date.now()}@branchtest.com`,
      fullName: "Agent B",
      passwordHash,
      roleId: (await prisma.role.findFirst({ where: { name: "Agent" } }))!.id,
    },
  });
  const agentB = await prisma.agent.create({
    data: {
      userId: agentBUser.id,
      agentCode: `AGTB-${Date.now().toString().slice(-4)}`,
      companyName: "Agent B Agency",
      companyId: company.id,
      branchId: branchB.id,
    },
  });

  const jobB = await prisma.jobOrder.create({
    data: {
      companyId: company.id,
      branchId: branchB.id,
      orderNumber: `JOB-${Date.now().toString().slice(-4)}`,
      employerName: "Employer B",
      country: "UAE",
      trade: "Mason",
      salary: 1600,
      totalQuota: 5,
      allocatedQuota: 2,
      commissionAmount: 400,
    },
  });

  const applicantB = await prisma.applicant.create({
    data: {
      companyId: company.id,
      branchId: branchB.id,
      fullName: "Applicant B",
      passportNumber: `PPB-${Date.now().toString().slice(-4)}`,
      passportExpiry: new Date("2030-12-31"),
      phone: "01800000002",
      dateOfBirth: new Date("1996-06-20"),
      trade: "Mason",
      currentStage: "APPLIED",
      agentId: agentB.id,
      jobOrderId: jobB.id,
    },
  });

  const invoiceB = await prisma.invoice.create({
    data: {
      companyId: company.id,
      branchId: branchB.id,
      applicantId: applicantB.id,
      invoiceNo: `INVB-${Date.now().toString().slice(-4)}`,
      amount: 4000,
      outstanding: 4000,
      description: "Visa Processing Fee",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("✅ Seed isolation test data success!");
  console.log(`- Company ID: ${company.id}`);
  console.log(`- Branch A ID: ${branchA.id} [HR User: hra@branchtest.com, Applicant: ${applicantA.id}]`);
  console.log(`- Branch B ID: ${branchB.id} [HR User: hrb@branchtest.com, Applicant: ${applicantB.id}]`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
