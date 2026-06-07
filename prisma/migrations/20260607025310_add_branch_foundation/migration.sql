-- CreateEnum
CREATE TYPE "BranchStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "Applicant" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "Commission" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "JobOrder" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "LedgerEntry" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "Receipt" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "branchId" TEXT;

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isHeadOffice" BOOLEAN NOT NULL DEFAULT false,
    "status" "BranchStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "isBranchManager" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Branch_companyId_idx" ON "Branch"("companyId");

-- CreateIndex
CREATE INDEX "Branch_companyId_status_idx" ON "Branch"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_companyId_code_key" ON "Branch"("companyId", "code");

-- CreateIndex
CREATE INDEX "BranchMembership_userId_idx" ON "BranchMembership"("userId");

-- CreateIndex
CREATE INDEX "BranchMembership_companyId_idx" ON "BranchMembership"("companyId");

-- CreateIndex
CREATE INDEX "BranchMembership_branchId_idx" ON "BranchMembership"("branchId");

-- CreateIndex
CREATE INDEX "BranchMembership_companyId_branchId_idx" ON "BranchMembership"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "BranchMembership_companyId_status_idx" ON "BranchMembership"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BranchMembership_userId_branchId_roleId_key" ON "BranchMembership"("userId", "branchId", "roleId");

-- CreateIndex
CREATE INDEX "Agent_companyId_branchId_idx" ON "Agent"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "Applicant_companyId_branchId_idx" ON "Applicant"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "Applicant_companyId_branchId_currentStage_idx" ON "Applicant"("companyId", "branchId", "currentStage");

-- CreateIndex
CREATE INDEX "AuditLog_companyId_branchId_idx" ON "AuditLog"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "Commission_companyId_branchId_idx" ON "Commission"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "Invoice_companyId_branchId_idx" ON "Invoice"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "Invoice_companyId_branchId_applicantId_idx" ON "Invoice"("companyId", "branchId", "applicantId");

-- CreateIndex
CREATE INDEX "JobOrder_companyId_branchId_idx" ON "JobOrder"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "JobOrder_companyId_branchId_status_idx" ON "JobOrder"("companyId", "branchId", "status");

-- CreateIndex
CREATE INDEX "LedgerEntry_companyId_branchId_idx" ON "LedgerEntry"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "Notification_companyId_branchId_idx" ON "Notification"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "Receipt_companyId_branchId_idx" ON "Receipt"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "Receipt_companyId_branchId_applicantId_idx" ON "Receipt"("companyId", "branchId", "applicantId");

-- CreateIndex
CREATE INDEX "Task_companyId_branchId_idx" ON "Task"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "Task_companyId_branchId_status_idx" ON "Task"("companyId", "branchId", "status");

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOrder" ADD CONSTRAINT "JobOrder_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchMembership" ADD CONSTRAINT "BranchMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchMembership" ADD CONSTRAINT "BranchMembership_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchMembership" ADD CONSTRAINT "BranchMembership_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchMembership" ADD CONSTRAINT "BranchMembership_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
