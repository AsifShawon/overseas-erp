import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { signAccessToken, resolveUserSessionPayload } from "../src/lib/auth";
import { GET as getApplicants, POST as createApplicant } from "../src/app/api/applicants/route";
import { GET as getApplicantDetail } from "../src/app/api/applicants/[id]/route";
import { GET as getDashboard } from "../src/app/api/reports/dashboard/route";

// Assert helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  } else {
    console.log(`✓ Assertion Passed: ${message}`);
  }
}

// helper to create a mock Request
function createMockRequest(url: string, token: string, method = "GET", body?: any, headers: any = {}) {
  const reqHeaders: any = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    ...headers,
  };
  return new Request(url, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set in environment.");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("🔍 Running Branch Isolation Scoping Tests...");

  // 1. Resolve test company and branches
  const company = await prisma.company.findFirst({ where: { name: "Branch Test Company" } });
  if (!company) {
    throw new Error("Test company not seeded. Run scripts/seed-branch-isolation-test.ts first.");
  }

  const branchA = await prisma.branch.findFirst({ where: { companyId: company.id, code: "BRA" } });
  const branchB = await prisma.branch.findFirst({ where: { companyId: company.id, code: "BRB" } });
  
  if (!branchA || !branchB) {
    throw new Error("Test branches not found.");
  }

  // 2. Load users
  const ownerUser = await prisma.user.findUnique({ where: { email: "owner@branchtest.com" } });
  const hrAUser = await prisma.user.findUnique({ where: { email: "hra@branchtest.com" } });
  const hrBUser = await prisma.user.findUnique({ where: { email: "hrb@branchtest.com" } });

  if (!ownerUser || !hrAUser || !hrBUser) {
    throw new Error("Test users not found.");
  }

  // 3. Resolve session payloads and generate tokens
  const ownerPayload = await resolveUserSessionPayload(ownerUser.id);
  const hrAPayload = await resolveUserSessionPayload(hrAUser.id);
  const hrBPayload = await resolveUserSessionPayload(hrBUser.id);
  
  console.log("DEBUG - HR A Payload:", hrAPayload);

  if (!ownerPayload || !hrAPayload || !hrBPayload) {
    throw new Error("Failed to resolve user session payloads.");
  }

  const ownerToken = await signAccessToken(ownerPayload);
  const hrAToken = await signAccessToken(hrAPayload);
  const hrBToken = await signAccessToken(hrBPayload);

  // 4. Load applicants seeded
  const applicantA = await prisma.applicant.findFirst({ where: { fullName: "Applicant A", branchId: branchA.id } });
  const applicantB = await prisma.applicant.findFirst({ where: { fullName: "Applicant B", branchId: branchB.id } });

  if (!applicantA || !applicantB) {
    throw new Error("Seeded applicants not found.");
  }

  // ==========================================
  // TEST 1: HR A can query candidates in Branch A but not Branch B
  // ==========================================
  console.log("\n🧪 Running TEST 1: List scoping for branch staff...");
  const req1 = createMockRequest("http://localhost/api/applicants", hrAToken);
  const res1 = await getApplicants(req1);
  assert(res1.status === 200, "HR A list call status should be 200");
  const data1 = await res1.json();
  const list1 = data1.data || [];
  assert(list1.length > 0, "HR A should see at least one applicant");
  assert(list1.every((app: any) => app.branchId === branchA.id), "All applicants seen by HR A must belong to Branch A");
  assert(!list1.some((app: any) => app.id === applicantB.id), "HR A must NOT see Applicant B");

  // ==========================================
  // TEST 2: HR A cannot access Applicant B detail
  // ==========================================
  console.log("\n🧪 Running TEST 2: Detail query boundary enforcement...");
  const req2 = createMockRequest(`http://localhost/api/applicants/${applicantB.id}`, hrAToken);
  const res2 = await getApplicantDetail(req2, { params: Promise.resolve({ id: applicantB.id }) });
  assert(res2.status === 403, "HR A must be forbidden (403) from loading Applicant B detail");

  // ==========================================
  // TEST 3: HR A cannot create an applicant under Branch B
  // ==========================================
  console.log("\n🧪 Running TEST 3: BranchId spoofing rejection on creation...");
  const req3 = createMockRequest("http://localhost/api/applicants", hrAToken, "POST", {
    fullName: "Spoofed Candidate",
    passportNumber: `SPOOF-${Date.now().toString().slice(-4)}`,
    passportExpiry: "2032-12-31",
    phone: "01799999999",
    dateOfBirth: "1995-05-15",
    trade: "Electrician",
    branchId: branchB.id, // Trying to write into Branch B
  });
  const res3 = await createApplicant(req3);
  assert(res3.status === 403, "Spoofed branchId creation must return 403 Forbidden");

  // ==========================================
  // TEST 4: Cross-company branchId is rejected
  // ==========================================
  console.log("\n🧪 Running TEST 4: Cross-company branchId validation...");
  // Create another company and branch
  const otherCompany = await prisma.company.create({
    data: {
      name: "Other Company",
      slug: `otherco-${Date.now()}`,
      ownerEmail: "other@company.com",
    },
  });
  const otherBranch = await prisma.branch.create({
    data: { name: "Other Branch", code: "OTH", companyId: otherCompany.id },
  });

  const req4 = createMockRequest("http://localhost/api/applicants", ownerToken, "POST", {
    fullName: "Cross Company Candidate",
    passportNumber: `CROSS-${Date.now().toString().slice(-4)}`,
    passportExpiry: "2032-12-31",
    phone: "01788888888",
    dateOfBirth: "1994-06-20",
    trade: "Plumber",
    branchId: otherBranch.id, // Trying to write to another company's branch
  });
  const res4 = await createApplicant(req4);
  assert(res4.status === 400 || res4.status === 403, "Cross-company branchId write must be rejected (400 or 403)");
  
  // Cleanup other company/branch
  await prisma.branch.delete({ where: { id: otherBranch.id } });
  await prisma.company.delete({ where: { id: otherCompany.id } });

  // ==========================================
  // TEST 5: Company Owner can view all applicants
  // ==========================================
  console.log("\n🧪 Running TEST 5: Owner viewing all company data...");
  const req5 = createMockRequest("http://localhost/api/applicants", ownerToken);
  const res5 = await getApplicants(req5);
  assert(res5.status === 200, "Owner call should succeed");
  const data5 = await res5.json();
  const list5 = data5.data || [];
  assert(list5.some((app: any) => app.id === applicantA.id), "Owner should see Applicant A");
  assert(list5.some((app: any) => app.id === applicantB.id), "Owner should see Applicant B");

  // ==========================================
  // TEST 6: Owner can select branch filter using header
  // ==========================================
  console.log("\n🧪 Running TEST 6: Owner filtering by active branch...");
  const req6 = createMockRequest("http://localhost/api/applicants", ownerToken, "GET", null, {
    "X-Branch-Id": branchA.id,
  });
  const res6 = await getApplicants(req6);
  assert(res6.status === 200, "Owner filtered call should succeed");
  const data6 = await res6.json();
  const list6 = data6.data || [];
  assert(list6.every((app: any) => app.branchId === branchA.id), "Owner filtered list should only have Branch A applicants");
  assert(!list6.some((app: any) => app.id === applicantB.id), "Owner filtered list should NOT show Applicant B");

  // ==========================================
  // TEST 7: HR A Dashboard is correctly scoped
  // ==========================================
  console.log("\n🧪 Running TEST 7: Dashboard metrics scoping check...");
  const req7 = createMockRequest("http://localhost/api/reports/dashboard", hrAToken);
  const res7 = await getDashboard(req7);
  if (res7.status !== 200) {
    console.error(`HR A dashboard call failed. Status: ${res7.status}, Body:`, await res7.text());
  }
  assert(res7.status === 200, "HR A dashboard call should succeed");
  const stats7 = await res7.json();
  // Since HR A has HR Officer role, let's verify HR Officer fields: appliedCount, interviewedCount, selectedCount, etc.
  assert(stats7.appliedCount === 1, `HR A should see 1 applied candidate (saw: ${stats7.appliedCount})`);

  // ==========================================
  // TEST 8: Owner Dashboard is correctly scoped
  // ==========================================
  console.log("\n🧪 Running TEST 8: Owner dashboard metrics scoping check...");
  const req8 = createMockRequest("http://localhost/api/reports/dashboard", ownerToken);
  const res8 = await getDashboard(req8);
  assert(res8.status === 200, "Owner dashboard call should succeed");
  const stats8 = await res8.json();
  // Since Owner has Super Admin role, let's verify Super Admin fields: activeApplicants
  assert(stats8.activeApplicants === 2, `Owner should see 2 active candidates (saw: ${stats8.activeApplicants})`);

  console.log("\n🎉 ALL SCOPING & ISOLATION BOUNDARY TESTS PASSED SUCCESSFULLY!");
  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error("❌ Test script failed:", err);
  process.exit(1);
});
