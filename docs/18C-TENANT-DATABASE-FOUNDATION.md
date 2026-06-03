# 18C — Tenant Database Foundation (Prompt 5A)

This document describes the schema adjustments, query indexes, and safe backfill procedures implemented to migrate the Overseas Manpower ERP from a single-company architecture to a multi-tenant SaaS architecture.

---

## 1. Schema Scoping (Overview)

The 11 database models holding core ERP business data have been updated to support a relation to the `Company` (tenant) model.
To ensure safe backward compatibility and zero database migration downtime:
- `companyId` is defined as a **nullable** `String?` field.
- The `company` relation is defined as **optional** (`Company?`).
- In the next SaaS phase (Prompt 5B), once all database fields are verified backfilled, `companyId` will be converted to a required `String` (with non-null `Company` relation) and compound unique keys will be applied.

### Updated Schema Layout

```prisma
model Company {
  id                 String               @id @default(cuid())
  name               String
  slug               String               @unique
  ...
  agents             Agent[]
  applicants         Applicant[]
  jobOrders          JobOrder[]
  workflowHistories  WorkflowHistory[]
  documents          Document[]
  invoices           Invoice[]
  receipts           Receipt[]
  ledgerEntries      LedgerEntry[]
  commissions        Commission[]
  notifications      Notification[]
  auditLogs          AuditLog[]
}
```

---

## 2. Models Scoped with `companyId`

The following 11 models contain `companyId String?` and `company Company? @relation(fields: [companyId], references: [id])`:

1. **Agent**
2. **Applicant**
3. **JobOrder**
4. **WorkflowHistory**
5. **Document**
6. **Invoice**
7. **Receipt**
8. **LedgerEntry**
9. **Commission**
10. **Notification**
11. **AuditLog**

---

## 3. Query Optimization Indexes Added

The following indexes have been defined on the scoped models to ensure performant tenant queries:

- **Agent**:
  - `@@index([companyId])`
- **Applicant**:
  - `@@index([companyId])`
  - `@@index([companyId, currentStage])`
  - `@@index([companyId, agentId])`
- **JobOrder**:
  - `@@index([companyId])`
  - `@@index([companyId, status])`
- **WorkflowHistory**:
  - `@@index([companyId])`
- **Document**:
  - `@@index([companyId])`
- **Invoice**:
  - `@@index([companyId])`
  - `@@index([companyId, applicantId])`
- **Receipt**:
  - `@@index([companyId])`
  - `@@index([companyId, applicantId])`
  - `@@index([companyId, invoiceId])`
- **LedgerEntry**:
  - `@@index([companyId])`
- **Commission**:
  - `@@index([companyId])`
  - `@@index([companyId, agentId])`
  - `@@index([companyId, applicantId])`
  - `@@index([companyId, status])`
- **Notification**:
  - `@@index([companyId])`
  - `@@index([companyId, userId])`
- **AuditLog**:
  - `@@index([companyId])`
  - `@@index([companyId, timestamp])`

---

## 4. Unique Constraints (Deferred to Prompt 5B)

> [!WARNING]
> Converting globally unique constraints (e.g., `Agent.agentCode`, `Applicant.passportNumber`, `JobOrder.orderNumber`, `Invoice.invoiceNo`, `Receipt.receiptNo`) to compound company-scoped uniques (e.g., `@@unique([companyId, agentCode])`) immediately is deferred to the next phase (Prompt 5B).
>
> During the schema update, `companyId` is initially populated with `NULL`. Adding a compound unique constraint containing a nullable column creates database-specific uniqueness rules (e.g. Postgres allows multiple NULL values for `companyId` but standard Prisma behaviors expect clean index resolves).
>
> Once this migration finishes and all records have been successfully backfilled with the default company ID, the migration in Prompt 5B will safely convert columns to required (`NOT NULL`), drop global indexes, and establish company-scoped unique keys.
>
> `User.email` will remain globally unique for all phases.

---

## 5. Safe Idempotent Backfill Mechanism

**Script location**: `scripts/backfill-tenant.ts`  
**Execution command**: `npx tsx scripts/backfill-tenant.ts`

### Backfill Actions:
1. **Default Company Creation**:
   - Searches the database for the default company with slug `"demo-overseas-agency"`.
   - If not found, creates it:
     - Name: `"Demo Overseas Agency"`
     - Slug: `"demo-overseas-agency"`
     - Owner Email: Mapped to the first database `Super Admin` user (`admin@agency.com`), falling back to `"admin@demo.local"` if not found.
     - Owner Name: Mapped to the administrator's full name.
     - Status: `ACTIVE`
2. **Subscription Activation**:
   - Finds the `STANDARD` SaaSPlan.
   - If a subscription doesn't exist for the default company, creates a `CompanySubscription` in `ACTIVE` status.
3. **Settings Provisioning**:
   - If company settings do not exist, provisions `CompanySettings` with default locale `"bn"` and portal gates enabled.
4. **Record Scoping**:
   - Queries each of the 11 target models for rows where `companyId` is `NULL`.
   - Updates `companyId` to the default company's ID in an idempotent manner. Running the script multiple times will not duplicate the company or corrupt relations.

---

## 6. Verification and QA Checklist

### Automated Commands
```bash
# 1. Format schema file
npx prisma format

# 2. Run schema migration
npx prisma migrate dev --name add_company_id_to_business_tables

# 3. Regenerate client mappings
npx prisma generate

# 4. Execute backfill script
npx tsx scripts/backfill-tenant.ts

# 5. Compile check
npx tsc --noEmit

# 6. Optimized production build
npm run build
```

---

## 7. Manual Verification Steps Checklist

Platform admins or developers can run the following checks to confirm data migration safety:

### Backend Database Checks (SQL or Prisma Studio)
- [ ] **Default Company Check**: Confirm that `Company` table contains a row with slug `"demo-overseas-agency"`.
- [ ] **Subscription Check**: Confirm that `CompanySubscription` exists for the default company pointing to standard plan.
- [ ] **Company Settings Check**: Confirm `CompanySettings` exists for the default company.
- [ ] **Agent Scoping**: Confirm `SELECT COUNT(*) FROM "Agent" WHERE "companyId" IS NULL` returns `0`.
- [ ] **Applicant Scoping**: Confirm `SELECT COUNT(*) FROM "Applicant" WHERE "companyId" IS NULL` returns `0`.
- [ ] **JobOrder Scoping**: Confirm `SELECT COUNT(*) FROM "JobOrder" WHERE "companyId" IS NULL` returns `0`.
- [ ] **Document Scoping**: Confirm `SELECT COUNT(*) FROM "Document" WHERE "companyId" IS NULL` returns `0`.
- [ ] **Financial Tables Scoping**: Confirm `companyId` is populated for all rows in `Invoice`, `Receipt`, and `LedgerEntry` tables.
- [ ] **Commissions Scoping**: Confirm `SELECT COUNT(*) FROM "Commission" WHERE "companyId" IS NULL` returns `0`.
- [ ] **System Logs Scoping**: Confirm `companyId` is populated for all `Notification` and `AuditLog` records.

### Frontend ERP Functional Checks
- [ ] **Dashboard Loads**: Log in and verify the ERP staff dashboard loads stats correctly.
- [ ] **Applicants Registry**: Verify the applicant list and candidate detail pages load profile documents/ledger history.
- [ ] **Agent Directory**: Verify agent profiles and agency statistics display.
- [ ] **Finance Ledger Pages**: Verify invoices list, outstanding balances, and accrued commissions are queried correctly.
