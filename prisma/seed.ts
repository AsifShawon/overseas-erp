/**
 * Overseas Manpower ERP – Database Seed Script
 *
 * Seeds the following in strict dependency order:
 * 1. Permissions (16 granular access codes)
 * 2. Roles (8 system roles)
 * 3. RolePermission mappings
 * 4. Users (1 Super Admin + 2 Staff + 2 Agent users + 1 Applicant user)
 * 5. Agents (3 external recruiting partners)
 * 6. JobOrders (3 foreign demand vacancies)
 * 7. Applicants (4 sample candidates matching src/lib/mockData.ts)
 * 8. Documents (per applicant)
 * 9. Invoices, Receipts, LedgerEntries
 * 10. Commissions
 * 11. Notifications
 * 12. AuditLogs
 *
 * Run with: npx prisma db seed
 */

import { PrismaClient, WorkflowStage, DocumentType, DocumentStatus, PaymentMethod, LedgerTransactionType, CommissionStatus } from "../generated/prisma/client";

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as argon2 from "argon2";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


// ==========================================
// PERMISSION DEFINITIONS
// ==========================================
const PERMISSIONS = [
  { name: "VIEW_DASHBOARD",              module: "Dashboard" },
  { name: "VIEW_APPLICANTS",             module: "Applicant Management" },
  { name: "CREATE_APPLICANT",            module: "Applicant Management" },
  { name: "UPDATE_APPLICANT",            module: "Applicant Management" },
  { name: "ARCHIVE_APPLICANT",           module: "Applicant Management" },
  { name: "TRANSITION_WORKFLOW",         module: "Workflow" },
  { name: "UPLOAD_DOCUMENT",             module: "Document Management" },
  { name: "VERIFY_DOCUMENT",             module: "Document Management" },
  { name: "MANAGE_AGENTS",               module: "Agent Management" },
  { name: "RECORD_PAYMENT",              module: "Accounts" },
  { name: "VIEW_ACCOUNTS",               module: "Accounts" },
  { name: "VIEW_COMMISSIONS",            module: "Commissions" },
  { name: "VIEW_REPORTS",                module: "Reports" },
  { name: "VIEW_AUDIT_LOGS",             module: "Audit Logs" },
  { name: "MANAGE_RBAC",                 module: "RBAC" },
  { name: "VIEW_NOTIFICATIONS",          module: "Notifications" },
  { name: "MANAGE_JOB_ORDERS",           module: "Job Orders" },
  { name: "VIEW_COMPANY_USERS",          module: "Company Management" },
  { name: "INVITE_COMPANY_USER",         module: "Company Management" },
  { name: "UPDATE_COMPANY_USER",         module: "Company Management" },
  { name: "SUSPEND_COMPANY_USER",        module: "Company Management" },
  { name: "RESET_COMPANY_USER_PASSWORD", module: "Company Management" },
  { name: "VIEW_COMPANY_ROLES",          module: "Company Management" },

  // Branch Management Permissions
  { name: "VIEW_BRANCHES",               module: "Branch Management" },
  { name: "CREATE_BRANCH",               module: "Branch Management" },
  { name: "UPDATE_BRANCH",               module: "Branch Management" },
  { name: "SUSPEND_BRANCH",              module: "Branch Management" },
  { name: "VIEW_BRANCH_USERS",           module: "Branch Management" },
  { name: "ASSIGN_BRANCH_USERS",          module: "Branch Management" },
  { name: "VIEW_ALL_BRANCH_DATA",        module: "Branch Management" },
  { name: "VIEW_OWN_BRANCH_DATA",        module: "Branch Management" },
] as const;

type PermissionName = (typeof PERMISSIONS)[number]["name"];

// ==========================================
// ROLE DEFINITIONS WITH PERMISSION MAPPINGS
// ==========================================
const ROLE_PERMISSIONS: Record<string, PermissionName[]> = {
  "Super Admin": [
    "VIEW_DASHBOARD", "VIEW_APPLICANTS", "CREATE_APPLICANT", "UPDATE_APPLICANT",
    "ARCHIVE_APPLICANT", "TRANSITION_WORKFLOW", "UPLOAD_DOCUMENT", "VERIFY_DOCUMENT",
    "MANAGE_AGENTS", "RECORD_PAYMENT", "VIEW_ACCOUNTS", "VIEW_COMMISSIONS",
    "VIEW_REPORTS", "VIEW_AUDIT_LOGS", "MANAGE_RBAC", "VIEW_NOTIFICATIONS",
    "MANAGE_JOB_ORDERS",
    "VIEW_COMPANY_USERS", "INVITE_COMPANY_USER", "UPDATE_COMPANY_USER",
    "SUSPEND_COMPANY_USER", "RESET_COMPANY_USER_PASSWORD", "VIEW_COMPANY_ROLES",
    "VIEW_BRANCHES", "CREATE_BRANCH", "UPDATE_BRANCH", "SUSPEND_BRANCH",
    "VIEW_BRANCH_USERS", "ASSIGN_BRANCH_USERS", "VIEW_ALL_BRANCH_DATA", "VIEW_OWN_BRANCH_DATA",
  ],
  "Operations Admin": [
    "VIEW_DASHBOARD", "VIEW_APPLICANTS", "CREATE_APPLICANT", "UPDATE_APPLICANT",
    "ARCHIVE_APPLICANT", "TRANSITION_WORKFLOW", "UPLOAD_DOCUMENT", "VERIFY_DOCUMENT",
    "MANAGE_AGENTS", "VIEW_ACCOUNTS", "VIEW_COMMISSIONS",
    "VIEW_REPORTS", "VIEW_AUDIT_LOGS", "VIEW_NOTIFICATIONS",
    "MANAGE_JOB_ORDERS",
    "VIEW_COMPANY_USERS", "INVITE_COMPANY_USER", "UPDATE_COMPANY_USER",
    "SUSPEND_COMPANY_USER", "RESET_COMPANY_USER_PASSWORD", "VIEW_COMPANY_ROLES",
    "VIEW_BRANCHES", "CREATE_BRANCH", "UPDATE_BRANCH", "SUSPEND_BRANCH",
    "VIEW_BRANCH_USERS", "ASSIGN_BRANCH_USERS", "VIEW_ALL_BRANCH_DATA", "VIEW_OWN_BRANCH_DATA",
  ],
  "HR Officer": [
    "VIEW_DASHBOARD", "VIEW_APPLICANTS", "CREATE_APPLICANT", "UPDATE_APPLICANT",
    "TRANSITION_WORKFLOW", "UPLOAD_DOCUMENT", "VIEW_NOTIFICATIONS",
    "VIEW_OWN_BRANCH_DATA",
  ],
  "Documentation Officer": [
    "VIEW_DASHBOARD", "VIEW_APPLICANTS", "TRANSITION_WORKFLOW",
    "UPLOAD_DOCUMENT", "VERIFY_DOCUMENT", "VIEW_NOTIFICATIONS",
    "VIEW_OWN_BRANCH_DATA",
  ],
  "Visa Officer": [
    "VIEW_DASHBOARD", "VIEW_APPLICANTS", "TRANSITION_WORKFLOW",
    "UPLOAD_DOCUMENT", "VIEW_NOTIFICATIONS",
    "VIEW_OWN_BRANCH_DATA",
  ],
  "Accounts Officer": [
    "VIEW_DASHBOARD", "VIEW_APPLICANTS", "VIEW_ACCOUNTS", "VIEW_COMMISSIONS",
    "RECORD_PAYMENT", "VIEW_REPORTS", "VIEW_NOTIFICATIONS",
    "VIEW_OWN_BRANCH_DATA",
  ],
  "Branch Manager": [
    "VIEW_DASHBOARD", "VIEW_APPLICANTS", "VIEW_NOTIFICATIONS",
    "VIEW_OWN_BRANCH_DATA", "VIEW_BRANCH_USERS", "ASSIGN_BRANCH_USERS",
  ],
  "Agent": [
    "VIEW_DASHBOARD", "VIEW_APPLICANTS", "CREATE_APPLICANT", "UPDATE_APPLICANT",
    "UPLOAD_DOCUMENT", "VIEW_COMMISSIONS", "VIEW_NOTIFICATIONS",
  ],
  "Applicant": [
    "VIEW_DASHBOARD", "UPLOAD_DOCUMENT", "VIEW_NOTIFICATIONS",
  ],
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  "Super Admin":            "Ultimate system supervisor. Full permission overrides across all modules.",
  "Operations Admin":       "Day-to-day agency manager. Reviews pipelines and exports system reports.",
  "HR Officer":             "Handles applicant screening, interviews, pre-selection, and job order mapping.",
  "Documentation Officer":  "Manages compliance checklists, medical centers, training, and passport files.",
  "Visa Officer":           "Assembles embassy packets, visa sticker loggings, and consulate slots.",
  "Accounts Officer":       "Controls candidate invoices, payments, general ledger, and agent commissions.",
  "Branch Manager":         "Branch supervisor. Scoped to view own branch data and manage branch users.",
  "Agent":                  "External recruitment partner. Sourced cohort access limits apply.",
  "Applicant":              "Placed candidate. Scoped to personal progress portal only.",
};

// ==========================================
// MAIN SEED FUNCTION
// ==========================================
async function main() {
  console.log("🌱 Starting database seed for Overseas Manpower ERP...\n");

  // ------------------------------------------
  // STEP 0: Seed SaaS Plans
  // ------------------------------------------
  console.log("📦 Seeding SaaS Plans...");
  await prisma.saaSPlan.upsert({
    where: { code: "STANDARD" },
    update: {},
    create: {
      name: "Standard",
      code: "STANDARD",
      description: "Standard SaaS package for all companies",
      monthlyPrice: 0,
      yearlyPrice: 0,
      isActive: true,
    },
  });
  console.log("   ✓ SaaS Plan 'Standard' seeded.\n");

  // ------------------------------------------
  // STEP 1: Seed Permissions
  // ------------------------------------------
  console.log("📋 Seeding Permissions...");
  const permissionMap: Record<string, string> = {}; // name -> id

  for (const perm of PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where:  { name: perm.name },
      update: { module: perm.module },
      create: { name: perm.name, module: perm.module },
    });
    permissionMap[perm.name] = record.id;
  }
  console.log(`   ✓ ${PERMISSIONS.length} permissions seeded.\n`);

  // ------------------------------------------
  // STEP 2: Seed Roles
  // ------------------------------------------
  console.log("🔐 Seeding Roles...");
  const roleMap: Record<string, string> = {}; // name -> id

  for (const [roleName, _perms] of Object.entries(ROLE_PERMISSIONS)) {
    const record = await prisma.role.upsert({
      where:  { name: roleName },
      update: { description: ROLE_DESCRIPTIONS[roleName] },
      create: { name: roleName, description: ROLE_DESCRIPTIONS[roleName] },
    });
    roleMap[roleName] = record.id;
  }
  console.log(`   ✓ ${Object.keys(ROLE_PERMISSIONS).length} roles seeded.\n`);

  // ------------------------------------------
  // STEP 3: Seed RolePermission Mappings
  // ------------------------------------------
  console.log("🔗 Seeding RolePermission mappings...");
  let mappingCount = 0;

  for (const [roleName, perms] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleMap[roleName];
    for (const permName of perms) {
      const permissionId = permissionMap[permName];
      await prisma.rolePermission.upsert({
        where:  { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
      mappingCount++;
    }
  }
  console.log(`   ✓ ${mappingCount} role-permission mappings seeded.\n`);

  // ------------------------------------------
  // STEP 4: Seed Users
  // ------------------------------------------
  console.log("👤 Seeding Users...");

  const superAdminHash      = await argon2.hash("SuperAdmin@2026!");
  const opsAdminHash        = await argon2.hash("OpsAdmin@2026!");
  const hrOfficerHash       = await argon2.hash("HrOfficer@2026!");
  const docsOfficerHash     = await argon2.hash("DocsOfficer@2026!");
  const visaOfficerHash     = await argon2.hash("VisaOfficer@2026!");
  const accountsOfficerHash = await argon2.hash("Accounts@2026!");
  const agentKabirHash      = await argon2.hash("AgentKabir@2026!");
  const agentTariqHash      = await argon2.hash("AgentTariq@2026!");
  const applicantHash       = await argon2.hash("Applicant@2026!");

  // Super Admin
  const superAdmin = await prisma.user.upsert({
    where:  { email: "admin@agency.com" },
    update: {},
    create: {
      email:        "admin@agency.com",
      passwordHash: superAdminHash,
      fullName:     "Richard Vance",
      phone:        "+880-2-9876543",
      roleId:       roleMap["Super Admin"],
      isActive:     true,
    },
  });

  // Operations Admin
  const opsAdmin = await prisma.user.upsert({
    where:  { email: "ops@agency.com" },
    update: {},
    create: {
      email:        "ops@agency.com",
      passwordHash: opsAdminHash,
      fullName:     "Helena Rostova",
      phone:        "+880-2-9876544",
      roleId:       roleMap["Operations Admin"],
      isActive:     true,
    },
  });

  // HR Officer
  const hrOfficer = await prisma.user.upsert({
    where:  { email: "hr@agency.com" },
    update: {},
    create: {
      email:        "hr@agency.com",
      passwordHash: hrOfficerHash,
      fullName:     "Sarah Jenkins",
      phone:        "+880-2-9876545",
      roleId:       roleMap["HR Officer"],
      isActive:     true,
    },
  });

  // Documentation Officer
  const docsOfficer = await prisma.user.upsert({
    where:  { email: "docs@agency.com" },
    update: {},
    create: {
      email:        "docs@agency.com",
      passwordHash: docsOfficerHash,
      fullName:     "David Miller",
      phone:        "+880-2-9876546",
      roleId:       roleMap["Documentation Officer"],
      isActive:     true,
    },
  });

  // Visa Officer
  await prisma.user.upsert({
    where:  { email: "visa@agency.com" },
    update: {},
    create: {
      email:        "visa@agency.com",
      passwordHash: visaOfficerHash,
      fullName:     "Fatima Al-Sayed",
      phone:        "+880-2-9876547",
      roleId:       roleMap["Visa Officer"],
      isActive:     true,
    },
  });

  // Accounts Officer
  const accountsOfficer = await prisma.user.upsert({
    where:  { email: "accounts@agency.com" },
    update: {},
    create: {
      email:        "accounts@agency.com",
      passwordHash: accountsOfficerHash,
      fullName:     "Lawrence Wilde",
      phone:        "+880-2-9876548",
      roleId:       roleMap["Accounts Officer"],
      isActive:     true,
    },
  });

  // Agent Users
  const agentKabirUser = await prisma.user.upsert({
    where:  { email: "agent@agent.com" },
    update: {},
    create: {
      email:        "agent@agent.com",
      passwordHash: agentKabirHash,
      fullName:     "Kabir Chowdhury",
      phone:        "+880-1711-234567",
      roleId:       roleMap["Agent"],
      isActive:     true,
    },
  });

  const agentTariqUser = await prisma.user.upsert({
    where:  { email: "tariq@apexrecruit.com" },
    update: {},
    create: {
      email:        "tariq@apexrecruit.com",
      passwordHash: agentTariqHash,
      fullName:     "Tariqul Islam",
      phone:        "+880-1819-765432",
      roleId:       roleMap["Agent"],
      isActive:     true,
    },
  });

  // Applicant User (claimed portal account for Mohammad Al-Amin)
  const applicantUser = await prisma.user.upsert({
    where:  { email: "applicant@applicant.com" },
    update: {},
    create: {
      email:        "applicant@applicant.com",
      passwordHash: applicantHash,
      fullName:     "Mohammad Al-Amin",
      phone:        "+880-1912-345678",
      roleId:       roleMap["Applicant"],
      isActive:     true,
    },
  });

  // Platform Admin User Seeding
  const platformEmail = process.env.PLATFORM_ADMIN_EMAIL;
  const platformPassword = process.env.PLATFORM_ADMIN_PASSWORD;

  if (platformEmail && platformPassword) {
    console.log("   👑 Seeding Platform Admin User...");
    const platformAdminHash = await argon2.hash(platformPassword);
    await prisma.user.upsert({
      where: { email: platformEmail },
      update: {
        isPlatformAdmin: true,
      },
      create: {
        email: platformEmail,
        passwordHash: platformAdminHash,
        fullName: "Platform Admin",
        roleId: roleMap["Super Admin"],
        isActive: true,
        isPlatformAdmin: true,
      },
    });
    console.log(`   ✓ Platform Admin (${platformEmail}) seeded.\n`);
  } else {
    console.log("   ℹ️ Skipping Platform Admin seeding: PLATFORM_ADMIN_EMAIL or PLATFORM_ADMIN_PASSWORD not set in .env.\n");
  }

  console.log(`   ✓ Users seeded.\n`);

  // ------------------------------------------
  // STEP 5: Seed Default Company and User Memberships
  // ------------------------------------------
  console.log("🏢 Seeding Default Company and User Memberships...");

  const defaultCompany = await prisma.company.upsert({
    where: { slug: "overseas-agency" },
    update: {
      name: "Overseas Manpower Agency",
      status: "ACTIVE",
      businessType: "Recruitment Agency",
      country: "Bangladesh",
      ownerName: superAdmin.fullName,
      ownerEmail: superAdmin.email,
    },
    create: {
      name: "Overseas Manpower Agency",
      slug: "overseas-agency",
      businessType: "Recruitment Agency",
      country: "Bangladesh",
      ownerName: superAdmin.fullName,
      ownerEmail: superAdmin.email,
      status: "ACTIVE",
    },
  });

  const membershipSeedData = [
    { user: superAdmin, roleName: "Super Admin", isOwner: true },
    { user: opsAdmin, roleName: "Operations Admin" },
    { user: hrOfficer, roleName: "HR Officer" },
    { user: docsOfficer, roleName: "Documentation Officer" },
    { user: accountsOfficer, roleName: "Accounts Officer" },
    { user: agentKabirUser, roleName: "Agent" },
    { user: agentTariqUser, roleName: "Agent" },
    { user: applicantUser, roleName: "Applicant" },
  ];

  for (const membership of membershipSeedData) {
    await prisma.userMembership.upsert({
      where: {
        userId_companyId: {
          userId: membership.user.id,
          companyId: defaultCompany.id,
        },
      },
      update: {
        roleId: roleMap[membership.roleName],
        status: "ACTIVE",
        isOwner: membership.isOwner ?? false,
      },
      create: {
        userId: membership.user.id,
        companyId: defaultCompany.id,
        roleId: roleMap[membership.roleName],
        status: "ACTIVE",
        isOwner: membership.isOwner ?? false,
      },
    });
  }

  console.log(`   ✓ Default company and ${membershipSeedData.length} user memberships seeded.\n`);

  // ------------------------------------------
  // STEP 6: Seed Agents
  // ------------------------------------------
  console.log("🤝 Seeding Agents...");

  const agentKabir = await prisma.agent.upsert({
    where:  { agentCode: "AGT-052" },
    update: {},
    create: {
      userId:      agentKabirUser.id,
      agentCode:   "AGT-052",
      companyName: "Chowdhury Sourcing Ltd",
      licenseNo:   "RL-9082",
      tier:        "A",
      phone:       "+880-1711-234567",
      isActive:    true,
    },
  });

  const agentTariq = await prisma.agent.upsert({
    where:  { agentCode: "AGT-031" },
    update: {},
    create: {
      userId:      agentTariqUser.id,
      agentCode:   "AGT-031",
      companyName: "Apex Recruiters Bangladesh",
      licenseNo:   "RL-8824",
      tier:        "B",
      phone:       "+880-1819-765432",
      isActive:    true,
    },
  });

  // Third agent (Mukhlesur Rahman – inactive, no user account per business rules)
  // We need a user record for the foreign key constraint; create an inactive one.
  const agentMukhlesHash = await argon2.hash("AgentMukhles@2026!");
  const agentMukhlesUser = await prisma.user.upsert({
    where:  { email: "mukhles@grambangla.com" },
    update: {},
    create: {
      email:        "mukhles@grambangla.com",
      passwordHash: agentMukhlesHash,
      fullName:     "Mukhlesur Rahman",
      phone:        "+880-1515-998877",
      roleId:       roleMap["Agent"],
      isActive:     false, // Deactivated agent
    },
  });

  const agentMukhles = await prisma.agent.upsert({
    where:  { agentCode: "AGT-079" },
    update: {},
    create: {
      userId:      agentMukhlesUser.id,
      agentCode:   "AGT-079",
      companyName: "Gram Bangla Labor Agency",
      licenseNo:   "RL-1025",
      tier:        "C",
      phone:       "+880-1515-998877",
      isActive:    false,
    },
  });

  console.log(`   ✓ 3 agents seeded.\n`);

  // ------------------------------------------
  // STEP 6: Seed Job Orders
  // ------------------------------------------
  console.log("📋 Seeding Job Orders...");

  const jobOrderKSA = await prisma.jobOrder.upsert({
    where:  { orderNumber: "JO-KSA-2026-004" },
    update: {},
    create: {
      orderNumber:      "JO-KSA-2026-004",
      employerName:     "Al-Juraid Contracting Co.",
      country:          "Saudi Arabia",
      trade:            "Electrician",
      salary:           1800.00, // SAR
      totalQuota:       50,
      allocatedQuota:   14,
      commissionAmount: 500.00, // BDT per candidate
      status:           "OPEN",
    },
  });

  const jobOrderUAE = await prisma.jobOrder.upsert({
    where:  { orderNumber: "JO-UAE-2026-012" },
    update: {},
    create: {
      orderNumber:      "JO-UAE-2026-012",
      employerName:     "Emaar Hospitality Group",
      country:          "United Arab Emirates",
      trade:            "Hospitality Executive",
      salary:           2200.00, // AED
      totalQuota:       20,
      allocatedQuota:   18,
      commissionAmount: 600.00,
      status:           "OPEN",
    },
  });

  const jobOrderMYS = await prisma.jobOrder.upsert({
    where:  { orderNumber: "JO-MYS-2026-081" },
    update: {},
    create: {
      orderNumber:      "JO-MYS-2026-081",
      employerName:     "Intel Semiconductor Penang",
      country:          "Malaysia",
      trade:            "Cleanroom Operator",
      salary:           1600.00, // MYR
      totalQuota:       100,
      allocatedQuota:   100,
      commissionAmount: 350.00,
      status:           "CLOSED",
    },
  });

  console.log(`   ✓ 3 job orders seeded.\n`);

  // ------------------------------------------
  // STEP 7: Seed Applicants
  // ------------------------------------------
  console.log("👥 Seeding Applicants...");

  // Applicant 1 – Mohammad Al-Amin (has claimed user account, VISA_SUBMITTED)
  const app1 = await prisma.applicant.upsert({
    where:  { passportNumber: "A03498822" },
    update: {},
    create: {
      userId:          applicantUser.id, // Claimed
      agentId:         agentKabir.id,
      jobOrderId:      jobOrderKSA.id,
      passportNumber:  "A03498822",
      passportExpiry:  new Date("2031-10-15"),
      nationality:     "Bangladesh",
      fullName:        "Mohammad Al-Amin",
      phone:           "+880-1912-345678",
      email:           "applicant@applicant.com",
      dateOfBirth:     new Date("1997-04-12"),
      nidNumber:       "4529082312",
      address:         "House 14, Road 3, Dhanmondi, Dhaka",
      emergencyContact:"Mst. Amina Begum (Mother) - +880-1912-998877",
      trade:           "Electrician",
      currentStage:    WorkflowStage.VISA_SUBMITTED,
      isArchived:      false,
    },
  });

  // Applicant 2 – Jasim Uddin (unclaimed, SELECTED, has rejected medical report)
  const app2 = await prisma.applicant.upsert({
    where:  { passportNumber: "A04992211" },
    update: {},
    create: {
      userId:          null, // Unclaimed
      agentId:         agentKabir.id,
      jobOrderId:      jobOrderKSA.id,
      passportNumber:  "A04992211",
      passportExpiry:  new Date("2030-05-18"),
      nationality:     "Bangladesh",
      fullName:        "Jasim Uddin",
      phone:           "+880-1712-445566",
      email:           null,
      dateOfBirth:     new Date("1994-08-22"),
      nidNumber:       "8911002341",
      address:         "Village: Kazipur, Dist: Sirajganj",
      emergencyContact:"Md. Rofiqul Islam (Brother) - +880-1712-001122",
      trade:           "Electrician",
      currentStage:    WorkflowStage.SELECTED,
      isArchived:      false,
    },
  });

  // Applicant 3 – Abu Bakar Siddique (unclaimed, TICKETED, visa stamped)
  const app3 = await prisma.applicant.upsert({
    where:  { passportNumber: "A05882200" },
    update: {},
    create: {
      userId:          null,
      agentId:         agentTariq.id,
      jobOrderId:      jobOrderUAE.id,
      passportNumber:  "A05882200",
      passportExpiry:  new Date("2029-12-01"),
      nationality:     "Bangladesh",
      fullName:        "Abu Bakar Siddique",
      phone:           "+880-1511-332211",
      email:           "abubakar@gmail.com",
      dateOfBirth:     new Date("1991-11-05"),
      nidNumber:       "1234908871",
      address:         "Vill: Ghorashal, Upazila: Palash, Narsingdi",
      emergencyContact:"Siddique Rahman (Father) - +880-1511-999999",
      trade:           "Hospitality Executive",
      currentStage:    WorkflowStage.TICKETED,
      isArchived:      false,
    },
  });

  // Applicant 4 – Tariqul Anam (soft-archived, MEDICAL_UNFIT, near-expiry passport)
  const app4 = await prisma.applicant.upsert({
    where:  { passportNumber: "A08776655" },
    update: {},
    create: {
      userId:          null,
      agentId:         agentMukhles.id,
      jobOrderId:      jobOrderMYS.id,
      passportNumber:  "A08776655",
      passportExpiry:  new Date("2026-06-30"), // Near expiry – triggers alerts
      nationality:     "Bangladesh",
      fullName:        "Tariqul Anam",
      phone:           "+880-1814-556677",
      email:           "tariqul@yahoo.com",
      dateOfBirth:     new Date("1988-02-14"),
      nidNumber:       "3489110022",
      address:         "Sector 4, Uttara, Dhaka",
      emergencyContact:"Shamim Anam (Brother) - +880-1814-112233",
      trade:           "Cleanroom Operator",
      currentStage:    WorkflowStage.MEDICAL_UNFIT,
      isArchived:      true,
      archivedAt:      new Date("2026-05-10T12:00:00Z"),
    },
  });

  console.log(`   ✓ 4 applicants seeded.\n`);

  // ------------------------------------------
  // STEP 8: Seed Documents
  // ------------------------------------------
  console.log("📄 Seeding Documents...");

  // App 1 Documents
  await prisma.document.createMany({
    skipDuplicates: true,
    data: [
      {
        applicantId:  app1.id,
        documentType: DocumentType.PASSPORT,
        fileName:     "Passport_AlAmin.pdf",
        fileUrl:      "seed-mock/Passport_AlAmin.pdf",
        storageProvider: "local",
        storagePath:  "seed-mock/Passport_AlAmin.pdf",
        mimeType:     "application/pdf",
        fileSize:     0,
        status:       DocumentStatus.VERIFIED,
        verifiedById: docsOfficer.id,
      },
      {
        applicantId:  app1.id,
        documentType: DocumentType.CV,
        fileName:     "CV_AlAmin.pdf",
        fileUrl:      "seed-mock/CV_AlAmin.pdf",
        storageProvider: "local",
        storagePath:  "seed-mock/CV_AlAmin.pdf",
        mimeType:     "application/pdf",
        fileSize:     0,
        status:       DocumentStatus.VERIFIED,
        verifiedById: docsOfficer.id,
      },
      {
        applicantId:  app1.id,
        documentType: DocumentType.MEDICAL_REPORT,
        fileName:     "Medical_AlAmin.pdf",
        fileUrl:      "seed-mock/Medical_AlAmin.pdf",
        storageProvider: "local",
        storagePath:  "seed-mock/Medical_AlAmin.pdf",
        mimeType:     "application/pdf",
        fileSize:     0,
        status:       DocumentStatus.VERIFIED,
        verifiedById: docsOfficer.id,
      },
      {
        applicantId:  app1.id,
        documentType: DocumentType.POLICE_CLEARANCE,
        fileName:     "Police_AlAmin.pdf",
        fileUrl:      "seed-mock/Police_AlAmin.pdf",
        storageProvider: "local",
        storagePath:  "seed-mock/Police_AlAmin.pdf",
        mimeType:     "application/pdf",
        fileSize:     0,
        status:       DocumentStatus.PENDING_VERIFICATION,
      },
      {
        applicantId:  app1.id,
        documentType: DocumentType.VISA_STICKER,
        fileName:     "Visa_Draft.pdf",
        fileUrl:      "seed-mock/Visa_Draft.pdf",
        storageProvider: "local",
        storagePath:  "seed-mock/Visa_Draft.pdf",
        mimeType:     "application/pdf",
        fileSize:     0,
        status:       DocumentStatus.PENDING_UPLOAD,
      },
    ],
  });

  // App 2 Documents
  await prisma.document.createMany({
    skipDuplicates: true,
    data: [
      {
        applicantId:  app2.id,
        documentType: DocumentType.PASSPORT,
        fileName:     "Passport_Jasim.pdf",
        fileUrl:      "seed-mock/Passport_Jasim.pdf",
        storageProvider: "local",
        storagePath:  "seed-mock/Passport_Jasim.pdf",
        mimeType:     "application/pdf",
        fileSize:     0,
        status:       DocumentStatus.VERIFIED,
        verifiedById: docsOfficer.id,
      },
      {
        applicantId:  app2.id,
        documentType: DocumentType.MEDICAL_REPORT,
        fileName:     "Med_Jasim.pdf",
        fileUrl:      "seed-mock/Med_Jasim.pdf",
        storageProvider: "local",
        storagePath:  "seed-mock/Med_Jasim.pdf",
        mimeType:     "application/pdf",
        fileSize:     0,
        status:       DocumentStatus.REJECTED,
        verifiedById: docsOfficer.id,
      },
    ],
  });

  // App 3 Documents
  await prisma.document.createMany({
    skipDuplicates: true,
    data: [
      {
        applicantId:  app3.id,
        documentType: DocumentType.PASSPORT,
        fileName:     "Passport_Bakar.pdf",
        fileUrl:      "seed-mock/Passport_Bakar.pdf",
        storageProvider: "local",
        storagePath:  "seed-mock/Passport_Bakar.pdf",
        mimeType:     "application/pdf",
        fileSize:     0,
        status:       DocumentStatus.VERIFIED,
        verifiedById: docsOfficer.id,
      },
      {
        applicantId:  app3.id,
        documentType: DocumentType.VISA_STICKER,
        fileName:     "Visa_Bakar.pdf",
        fileUrl:      "seed-mock/Visa_Bakar.pdf",
        storageProvider: "local",
        storagePath:  "seed-mock/Visa_Bakar.pdf",
        mimeType:     "application/pdf",
        fileSize:     0,
        status:       DocumentStatus.VERIFIED,
        verifiedById: docsOfficer.id,
      },
      {
        applicantId:  app3.id,
        documentType: DocumentType.AIR_TICKET,
        fileName:     "FlightTicket_Bakar.pdf",
        fileUrl:      "seed-mock/FlightTicket_Bakar.pdf",
        storageProvider: "local",
        storagePath:  "seed-mock/FlightTicket_Bakar.pdf",
        mimeType:     "application/pdf",
        fileSize:     0,
        status:       DocumentStatus.VERIFIED,
        verifiedById: docsOfficer.id,
      },
    ],
  });

  // App 4 Documents
  await prisma.document.createMany({
    skipDuplicates: true,
    data: [
      {
        applicantId:  app4.id,
        documentType: DocumentType.PASSPORT,
        fileName:     "Passport_Tariqul.pdf",
        fileUrl:      "seed-mock/Passport_Tariqul.pdf",
        storageProvider: "local",
        storagePath:  "seed-mock/Passport_Tariqul.pdf",
        mimeType:     "application/pdf",
        fileSize:     0,
        status:       DocumentStatus.VERIFIED,
        verifiedById: docsOfficer.id,
      },
      {
        applicantId:  app4.id,
        documentType: DocumentType.MEDICAL_REPORT,
        fileName:     "Unfit_Report.pdf",
        fileUrl:      "seed-mock/Unfit_Report.pdf",
        storageProvider: "local",
        storagePath:  "seed-mock/Unfit_Report.pdf",
        mimeType:     "application/pdf",
        fileSize:     0,
        status:       DocumentStatus.VERIFIED,
        verifiedById: docsOfficer.id,
      },
    ],
  });

  console.log(`   ✓ Documents seeded.\n`);

  // ------------------------------------------
  // STEP 9: Seed WorkflowHistory
  // ------------------------------------------
  console.log("🔄 Seeding WorkflowHistory...");

  // App1: APPLIED → VISA_SUBMITTED progression (key milestones)
  const app1Transitions: Array<{ oldStage: WorkflowStage; newStage: WorkflowStage; timestamp: string }> = [
    { oldStage: WorkflowStage.APPLIED,          newStage: WorkflowStage.INTERVIEWED,        timestamp: "2026-05-02T09:00:00Z" },
    { oldStage: WorkflowStage.INTERVIEWED,      newStage: WorkflowStage.SELECTED,           timestamp: "2026-05-04T10:00:00Z" },
    { oldStage: WorkflowStage.SELECTED,         newStage: WorkflowStage.MEDICAL_WAITING,    timestamp: "2026-05-06T11:00:00Z" },
    { oldStage: WorkflowStage.MEDICAL_WAITING,  newStage: WorkflowStage.MEDICAL_FIT,        timestamp: "2026-05-08T12:00:00Z" },
    { oldStage: WorkflowStage.MEDICAL_FIT,      newStage: WorkflowStage.TRAINING_COMPLETED, timestamp: "2026-05-09T13:00:00Z" },
    { oldStage: WorkflowStage.TRAINING_COMPLETED, newStage: WorkflowStage.VISA_SUBMITTED,   timestamp: "2026-05-11T14:00:00Z" },
  ];

  for (const t of app1Transitions) {
    await prisma.workflowHistory.create({
      data: {
        applicantId: app1.id,
        oldStage:    t.oldStage,
        newStage:    t.newStage,
        changedById: hrOfficer.id,
        changeNotes: "Standard pipeline progression",
        timestamp:   new Date(t.timestamp),
      },
    });
  }

  // App3: Quick progression to TICKETED
  const app3Transitions: Array<{ oldStage: WorkflowStage; newStage: WorkflowStage; timestamp: string }> = [
    { oldStage: WorkflowStage.APPLIED,          newStage: WorkflowStage.SELECTED,           timestamp: "2026-04-15T09:00:00Z" },
    { oldStage: WorkflowStage.SELECTED,         newStage: WorkflowStage.MEDICAL_FIT,        timestamp: "2026-04-22T10:00:00Z" },
    { oldStage: WorkflowStage.MEDICAL_FIT,      newStage: WorkflowStage.VISA_STAMPED,       timestamp: "2026-05-01T11:00:00Z" },
    { oldStage: WorkflowStage.VISA_STAMPED,     newStage: WorkflowStage.TICKETED,           timestamp: "2026-05-10T12:00:00Z" },
  ];

  for (const t of app3Transitions) {
    await prisma.workflowHistory.create({
      data: {
        applicantId: app3.id,
        oldStage:    t.oldStage,
        newStage:    t.newStage,
        changedById: opsAdmin.id,
        changeNotes: "UAE Hospitality deployment progression",
        timestamp:   new Date(t.timestamp),
      },
    });
  }

  // App4: APPLIED → MEDICAL_UNFIT
  await prisma.workflowHistory.create({
    data: {
      applicantId: app4.id,
      oldStage:    WorkflowStage.MEDICAL_WAITING,
      newStage:    WorkflowStage.MEDICAL_UNFIT,
      changedById: docsOfficer.id,
      changeNotes: "Candidate failed medical clearance. File halted.",
      timestamp:   new Date("2026-05-10T12:00:00Z"),
    },
  });

  console.log(`   ✓ Workflow histories seeded.\n`);

  // ------------------------------------------
  // STEP 10: Seed Invoices, Receipts & Ledger Entries
  // ------------------------------------------
  console.log("💰 Seeding Invoices, Receipts & Ledger Entries...");

  // App1 Invoice
  const inv1 = await prisma.invoice.upsert({
    where:  { invoiceNo: "INV-2026-042" },
    update: {},
    create: {
      applicantId: app1.id,
      invoiceNo:   "INV-2026-042",
      amount:      2500.00,
      outstanding: 1200.00,
      dueDate:     new Date("2026-06-10"),
      description: "KSA Electrician Package Fee (Consulate, Training & Service Charge)",
      createdAt:   new Date("2026-05-10"),
    },
  });

  // App2 Invoice (fully outstanding)
  await prisma.invoice.upsert({
    where:  { invoiceNo: "INV-2026-048" },
    update: {},
    create: {
      applicantId: app2.id,
      invoiceNo:   "INV-2026-048",
      amount:      2500.00,
      outstanding: 2500.00,
      dueDate:     new Date("2026-06-25"),
      description: "KSA Electrician Package Fee",
      createdAt:   new Date("2026-05-15"),
    },
  });

  // App3 Invoice (fully settled)
  const inv3 = await prisma.invoice.upsert({
    where:  { invoiceNo: "INV-2026-021" },
    update: {},
    create: {
      applicantId: app3.id,
      invoiceNo:   "INV-2026-021",
      amount:      3200.00,
      outstanding: 0.00,
      dueDate:     new Date("2026-05-20"),
      description: "UAE Hospitality Executive Package Fee",
      createdAt:   new Date("2026-05-01"),
    },
  });

  // Receipts
  const rec1 = await prisma.receipt.upsert({
    where:  { receiptNo: "REC-2026-015" },
    update: {},
    create: {
      applicantId:   app1.id,
      invoiceId:     inv1.id,
      receiptNo:     "REC-2026-015",
      amountPaid:    1300.00,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      referenceNo:   "TXN8922119028",
      receivedById:  accountsOfficer.id,
      createdAt:     new Date("2026-05-12"),
    },
  });

  const rec3 = await prisma.receipt.upsert({
    where:  { receiptNo: "REC-2026-004" },
    update: {},
    create: {
      applicantId:   app3.id,
      invoiceId:     inv3.id,
      receiptNo:     "REC-2026-004",
      amountPaid:    3200.00,
      paymentMethod: PaymentMethod.CASH,
      referenceNo:   null,
      receivedById:  accountsOfficer.id,
      createdAt:     new Date("2026-05-05"),
    },
  });

  // Ledger Entries – App1
  await prisma.ledgerEntry.createMany({
    skipDuplicates: true,
    data: [
      {
        applicantId:     app1.id,
        transactionType: LedgerTransactionType.INVOICE,
        referenceId:     inv1.id,
        debit:           2500.00,
        credit:          0.00,
        runningBalance:  2500.00,
        timestamp:       new Date("2026-05-10T10:00:00Z"),
      },
      {
        applicantId:     app1.id,
        transactionType: LedgerTransactionType.RECEIPT,
        referenceId:     rec1.id,
        debit:           0.00,
        credit:          1300.00,
        runningBalance:  1200.00,
        timestamp:       new Date("2026-05-12T14:30:00Z"),
      },
    ],
  });

  // Ledger Entries – App3
  await prisma.ledgerEntry.createMany({
    skipDuplicates: true,
    data: [
      {
        applicantId:     app3.id,
        transactionType: LedgerTransactionType.INVOICE,
        referenceId:     inv3.id,
        debit:           3200.00,
        credit:          0.00,
        runningBalance:  3200.00,
        timestamp:       new Date("2026-05-01T09:15:00Z"),
      },
      {
        applicantId:     app3.id,
        transactionType: LedgerTransactionType.RECEIPT,
        referenceId:     rec3.id,
        debit:           0.00,
        credit:          3200.00,
        runningBalance:  0.00,
        timestamp:       new Date("2026-05-05T11:45:00Z"),
      },
    ],
  });

  console.log(`   ✓ Invoices, receipts & ledger entries seeded.\n`);

  // ------------------------------------------
  // STEP 11: Seed Commissions
  // ------------------------------------------
  console.log("💸 Seeding Commissions...");

  await prisma.commission.upsert({
    where:  { agentId_applicantId: { agentId: agentKabir.id, applicantId: app1.id } },
    update: {},
    create: {
      agentId:     agentKabir.id,
      applicantId: app1.id,
      jobOrderId:  jobOrderKSA.id,
      amount:      500.00,
      status:      CommissionStatus.ACCRUED,
      payoutRef:   null,
      payoutDate:  null,
      createdAt:   new Date("2026-05-12T14:30:00Z"),
    },
  });

  await prisma.commission.upsert({
    where:  { agentId_applicantId: { agentId: agentTariq.id, applicantId: app3.id } },
    update: {},
    create: {
      agentId:     agentTariq.id,
      applicantId: app3.id,
      jobOrderId:  jobOrderUAE.id,
      amount:      600.00,
      status:      CommissionStatus.PAID,
      payoutRef:   "BANK-AGT-3199",
      payoutDate:  new Date("2026-05-18"),
      createdAt:   new Date("2026-05-05T11:45:00Z"),
    },
  });

  console.log(`   ✓ Commissions seeded.\n`);

  // ------------------------------------------
  // STEP 12: Seed Notifications
  // ------------------------------------------
  console.log("🔔 Seeding Notifications...");

  await prisma.notification.createMany({
    skipDuplicates: true,
    data: [
      {
        userId:    applicantUser.id,
        title:     "Visa Application Progressing",
        message:   "Your documents have been verified and submitted to the Saudi Consulate.",
        isRead:    false,
        createdAt: new Date("2026-05-20T10:00:00Z"),
      },
      {
        userId:    agentKabirUser.id,
        title:     "Commission Accrued",
        message:   "Candidate Mohammad Al-Amin has reached VISA_SUBMITTED. Commission of $500 accrued.",
        isRead:    false,
        createdAt: new Date("2026-05-12T14:35:00Z"),
      },
      {
        userId:    docsOfficer.id,
        title:     "Expiring Passport Warning",
        message:   "Candidate Tariqul Anam passport (A08776655) expires in less than 2 months (2026-06-30).",
        isRead:    true,
        createdAt: new Date("2026-05-01T08:00:00Z"),
      },
    ],
  });

  console.log(`   ✓ Notifications seeded.\n`);

  // ------------------------------------------
  // STEP 13: Seed Audit Logs
  // ------------------------------------------
  console.log("📝 Seeding Audit Logs...");

  await prisma.auditLog.createMany({
    data: [
      {
        userId:     hrOfficer.id,
        roleName:   "HR Officer",
        actionType: "CREATE_APPLICANT",
        tableName:  "Applicant",
        recordId:   app1.id,
        delta:      { fullName: "Mohammad Al-Amin", passportNumber: "A03498822", trade: "Electrician" },
        ipAddress:  "192.168.10.44",
        timestamp:  new Date("2026-05-10T10:05:00Z"),
      },
      {
        userId:     accountsOfficer.id,
        roleName:   "Accounts Officer",
        actionType: "RECORD_RECEIPT",
        tableName:  "Receipt",
        recordId:   rec1.id,
        delta:      { amountPaid: 1300, paymentMethod: "BANK_TRANSFER", invoiceId: inv1.id },
        ipAddress:  "192.168.10.51",
        timestamp:  new Date("2026-05-12T14:31:00Z"),
      },
      {
        userId:     docsOfficer.id,
        roleName:   "Documentation Officer",
        actionType: "VERIFY_DOCUMENT",
        tableName:  "Document",
        recordId:   null,
        delta:      { status: "VERIFIED", documentType: "PASSPORT" },
        ipAddress:  "192.168.10.42",
        timestamp:  new Date("2026-05-11T11:15:00Z"),
      },
      {
        userId:     superAdmin.id,
        roleName:   "Super Admin",
        actionType: "SYSTEM_SEED",
        tableName:  "System",
        recordId:   null,
        delta:      { message: "Initial database seed completed successfully." },
        ipAddress:  "127.0.0.1",
        timestamp:  new Date(),
      },
    ],
  });

  console.log(`   ✓ Audit logs seeded.\n`);

  // ------------------------------------------
  // COMPLETION SUMMARY
  // ------------------------------------------
  console.log("✅ Database seed completed successfully!\n");
  console.log("📊 Seeded Summary:");
  console.log(`   • Permissions:       ${PERMISSIONS.length}`);
  console.log(`   • Roles:             ${Object.keys(ROLE_PERMISSIONS).length}`);
  console.log(`   • RolePermissions:   ${mappingCount}`);
  console.log(`   • Users:             10 (1 Super Admin, 4 Staff, 3 Agents, 1 Applicant, 1 Inactive)`);
  console.log(`   • Agents:            3 (Kabir AGT-052, Tariq AGT-031, Mukhles AGT-079 inactive)`);
  console.log(`   • Job Orders:        3 (KSA, UAE, Malaysia)`);
  console.log(`   • Applicants:        4 (Al-Amin, Jasim, Abu Bakar, Tariqul)`);
  console.log(`   • Documents:         ${5 + 2 + 3 + 2} total across all applicants`);
  console.log(`   • Workflow History:  ${app1Transitions.length + app3Transitions.length + 1} transitions`);
  console.log(`   • Invoices:          3`);
  console.log(`   • Receipts:          2`);
  console.log(`   • Ledger Entries:    4`);
  console.log(`   • Commissions:       2`);
  console.log(`   • Notifications:     3`);
  console.log(`   • Audit Logs:        4\n`);
  console.log("🔑 Default Login Credentials:");
  console.log("   • Super Admin:          admin@agency.com      / SuperAdmin@2026!");
  console.log("   • Operations Admin:     ops@agency.com        / OpsAdmin@2026!");
  console.log("   • HR Officer:           hr@agency.com         / HrOfficer@2026!");
  console.log("   • Documentation:        docs@agency.com       / DocsOfficer@2026!");
  console.log("   • Visa Officer:         visa@agency.com       / VisaOfficer@2026!");
  console.log("   • Accounts Officer:     accounts@agency.com   / Accounts@2026!");
  console.log("   • Agent (Kabir):        agent@agent.com       / AgentKabir@2026!");
  console.log("   • Agent (Tariq):        tariq@apexrecruit.com / AgentTariq@2026!");
  console.log("   • Applicant (Al-Amin):  applicant@applicant.com / Applicant@2026!\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
