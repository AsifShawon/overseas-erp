import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { resolveUserSessionPayload } from "../src/lib/auth";

async function runTests() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  console.log("🧪 Setting up test-auth-bridge database client...");
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("🧪 Running validation tests for SaaS authentication bridge...\n");

  // Test Case 1: Existing Demo Super Admin user (admin@agency.com)
  console.log("👉 Test Case 1: Resolving session payload for standard seeded Super Admin (admin@agency.com)");
  const superAdminUser = await prisma.user.findUnique({
    where: { email: "admin@agency.com" },
  });

  if (!superAdminUser) {
    console.error("❌ Failed: seeded admin@agency.com not found.");
  } else {
    const payload = await resolveUserSessionPayload(superAdminUser.id);
    if (payload && payload.activeCompanyId && payload.activeCompanyName === "Demo Overseas Agency" && payload.isPlatformAdmin === false) {
      console.log(`✅ Success: Resolved correctly. Company ID: ${payload.activeCompanyId}, Company Status: ${payload.companyStatus}`);
    } else {
      console.error("❌ Failed: Unexpected payload output:", payload);
    }
  }

  console.log("");

  // Test Case 2: Platform Admin (platform@agency.com)
  console.log("👉 Test Case 2: Resolving session payload for Platform Admin (platform@agency.com)");
  const platformAdmin = await prisma.user.findFirst({
    where: { isPlatformAdmin: true, email: { not: "admin@agency.com" } },
  });

  if (!platformAdmin) {
    console.log("ℹ️ Info: Platform Admin user not found. Skipping Test Case 2.");
  } else {
    const payload = await resolveUserSessionPayload(platformAdmin.id);
    if (payload && payload.isPlatformAdmin === true && payload.activeCompanyId === null) {
      console.log("✅ Success: Resolved platform admin correctly. No active company ID, platform access enabled.");
    } else {
      console.error("❌ Failed: Unexpected payload output for Platform Admin:", payload);
    }
  }

  console.log("");

  // Test Case 3: Suspended Company User Validation
  console.log("👉 Test Case 3: Verifying login blocking for suspended companies");
  // 1. Create a dummy suspended company and user
  const testSlug = `test-suspended-co-${Math.random().toString(36).slice(-4)}`;
  const testCompany = await prisma.company.create({
    data: {
      name: "Test Suspended Co",
      slug: testSlug,
      ownerEmail: "suspended-owner@test.com",
      status: "SUSPENDED",
    },
  });

  const testUser = await prisma.user.create({
    data: {
      email: `suspended-owner-${Math.random().toString(36).slice(-4)}@test.com`,
      fullName: "Suspended Owner",
      passwordHash: "dummyhash",
      roleId: superAdminUser?.roleId || "role-super-admin",
    },
  });

  const testMembership = await prisma.userMembership.create({
    data: {
      userId: testUser.id,
      companyId: testCompany.id,
      roleId: testUser.roleId,
      status: "ACTIVE",
      isOwner: true,
    },
  });

  // 2. Attempt to resolve payload (it should return null because company is SUSPENDED)
  const resolvedPayload = await resolveUserSessionPayload(testUser.id);
  if (resolvedPayload === null) {
    console.log("✅ Success: User resolution blocked correctly because their company is SUSPENDED.");
  } else {
    console.error("❌ Failed: Expected resolution to be blocked (null), but got payload:", resolvedPayload);
  }

  // 3. Clean up test data
  console.log("🧹 Cleaning up Test Case 3 database rows...");
  await prisma.userMembership.delete({ where: { id: testMembership.id } });
  await prisma.user.delete({ where: { id: testUser.id } });
  await prisma.company.delete({ where: { id: testCompany.id } });

  console.log("\n🧪 Auth bridge tests completed!");
  await prisma.$disconnect();
  await pool.end();
}

runTests().catch((err) => {
  console.error("❌ Tests execution failed:", err);
  process.exit(1);
});
