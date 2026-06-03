-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "Applicant" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "Commission" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "JobOrder" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "LedgerEntry" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "Receipt" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "WorkflowHistory" ADD COLUMN     "companyId" TEXT;

-- CreateIndex
CREATE INDEX "Agent_companyId_idx" ON "Agent"("companyId");

-- CreateIndex
CREATE INDEX "Applicant_companyId_idx" ON "Applicant"("companyId");

-- CreateIndex
CREATE INDEX "Applicant_companyId_currentStage_idx" ON "Applicant"("companyId", "currentStage");

-- CreateIndex
CREATE INDEX "Applicant_companyId_agentId_idx" ON "Applicant"("companyId", "agentId");

-- CreateIndex
CREATE INDEX "AuditLog_companyId_idx" ON "AuditLog"("companyId");

-- CreateIndex
CREATE INDEX "AuditLog_companyId_timestamp_idx" ON "AuditLog"("companyId", "timestamp");

-- CreateIndex
CREATE INDEX "Commission_companyId_idx" ON "Commission"("companyId");

-- CreateIndex
CREATE INDEX "Commission_companyId_agentId_idx" ON "Commission"("companyId", "agentId");

-- CreateIndex
CREATE INDEX "Commission_companyId_applicantId_idx" ON "Commission"("companyId", "applicantId");

-- CreateIndex
CREATE INDEX "Commission_companyId_status_idx" ON "Commission"("companyId", "status");

-- CreateIndex
CREATE INDEX "Document_companyId_idx" ON "Document"("companyId");

-- CreateIndex
CREATE INDEX "Invoice_companyId_idx" ON "Invoice"("companyId");

-- CreateIndex
CREATE INDEX "Invoice_companyId_applicantId_idx" ON "Invoice"("companyId", "applicantId");

-- CreateIndex
CREATE INDEX "JobOrder_companyId_idx" ON "JobOrder"("companyId");

-- CreateIndex
CREATE INDEX "JobOrder_companyId_status_idx" ON "JobOrder"("companyId", "status");

-- CreateIndex
CREATE INDEX "LedgerEntry_companyId_idx" ON "LedgerEntry"("companyId");

-- CreateIndex
CREATE INDEX "Notification_companyId_idx" ON "Notification"("companyId");

-- CreateIndex
CREATE INDEX "Notification_companyId_userId_idx" ON "Notification"("companyId", "userId");

-- CreateIndex
CREATE INDEX "Receipt_companyId_idx" ON "Receipt"("companyId");

-- CreateIndex
CREATE INDEX "Receipt_companyId_applicantId_idx" ON "Receipt"("companyId", "applicantId");

-- CreateIndex
CREATE INDEX "Receipt_companyId_invoiceId_idx" ON "Receipt"("companyId", "invoiceId");

-- CreateIndex
CREATE INDEX "WorkflowHistory_companyId_idx" ON "WorkflowHistory"("companyId");

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOrder" ADD CONSTRAINT "JobOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowHistory" ADD CONSTRAINT "WorkflowHistory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
