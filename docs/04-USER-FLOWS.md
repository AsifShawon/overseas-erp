# 04 — User Flows

This document describes every major end-to-end flow through the system. Each flow includes the starting page, steps, system actions, database tables affected, output, and permissions required.

---

## Flow 1: Super Admin Full Day Flow

**Starting page:** `/login`  
**Permission required:** All (Super Admin has full access)

### Steps
1. Navigate to `/login`
2. Enter credentials (`admin@agency.com` / `SuperAdmin@2026!`)
3. Click **Sign In**
4. **System action:** `POST /api/auth/login` — validates credentials with argon2, signs JWT access token (15 min) and refresh token (7 days), stores refresh in HttpOnly cookie, fetches permissions from DB, writes LOGIN_SUCCESS audit log
5. Redirected to `/dashboard` (Super Admin dashboard view)
6. Dashboard shows: active applicants, archived applicants, total agents, job orders, total invoiced/collected/outstanding, pending commissions, stage distribution chart, passport expiry warnings, pending documents count, recent audit logs, recent notifications, and job orders table
7. Navigate to **Audit Logs** — view the last 100 audit events: logins, stage transitions, document uploads, financial records
8. Navigate to **Applicants** — view list with filters by stage, trade, country, agent
9. Click on an applicant → open dossier
10. View bio-data, workflow history, documents, invoices, receipts, ledger
11. Navigate to **RBAC Settings** — adjust a role's permissions if needed

**Database tables affected:** AuditLog (LOGIN_SUCCESS), Notification (read), User, Applicant, Agent, JobOrder, Invoice, Receipt, LedgerEntry, Commission

---

## Flow 2: Operations Admin Pipeline Review

**Starting page:** `/dashboard`  
**Permission required:** VIEW_DASHBOARD, VIEW_APPLICANTS, VIEW_REPORTS, VIEW_AUDIT_LOGS, VIEW_ACCOUNTS, VIEW_COMMISSIONS

### Steps
1. Open Dashboard — review pipeline overview
2. Note: 12 applicants in MEDICAL_WAITING, 5 documents pending verification
3. Navigate to **Documents** page — see all pending verification documents
4. Navigate to applicant dossier of a pending document — click verify on medical report
5. **System action:** `PATCH /api/applicants/[id]/documents/[docId]` — updates document status to VERIFIED, writes audit log
6. Return to Applicants — filter by stage MEDICAL_WAITING
7. Open one applicant — click **Move Stage** → select MEDICAL_FIT
8. **System action:** `POST /api/applicants/[id]/workflows` — checks document prerequisites (MEDICAL_REPORT must be verified), creates WorkflowHistory, notifies applicant and agent, writes audit log
9. Navigate to **Reports** page — export applicant list CSV for management
10. **System action:** `GET /api/exports/applicants` — returns UTF-8 BOM CSV file

**Database tables affected:** Document (status update), WorkflowHistory (new row), Applicant (currentStage update), Notification (created), AuditLog (created)

---

## Flow 3: HR Officer Applicant Creation and Selection

**Starting page:** `/applicants`  
**Permission required:** VIEW_APPLICANTS, CREATE_APPLICANT, UPDATE_APPLICANT, TRANSITION_WORKFLOW, UPLOAD_DOCUMENT

### Steps
1. Click **New Applicant** button on Applicants page
2. Fill in form: full name, passport number, passport expiry, DOB, phone, email, trade, agent (optional), job order (optional)
3. Click **Create Applicant**
4. **System action:** `POST /api/applicants` — validates with Zod schema, checks passport uniqueness, creates Applicant record, writes audit log (CREATE_APPLICANT)
5. New applicant appears in list with stage: APPLIED
6. Open applicant dossier
7. Click **Move Stage** → select INTERVIEWED, add remarks about interview outcome
8. **System action:** `POST /api/applicants/[id]/workflows` — validates role (HR Officer allowed: APPLIED→INTERVIEWED), updates stage, creates WorkflowHistory, writes audit log
9. Click **Move Stage** → select SELECTED
10. Upload initial documents (passport scan) via Document Upload panel
11. **System action:** `POST /api/applicants/[id]/documents` — saves file to `storage/applicants/{id}/documents/`, creates Document record (status: PENDING_VERIFICATION), creates audit log, notifies Super Admin, Operations Admin, Documentation Officer

**Database tables affected:** Applicant (created/updated), WorkflowHistory (new rows), Document (created), AuditLog (multiple), Notification (created)

---

## Flow 4: Documentation Officer Document Upload and Verification

**Starting page:** `/documents`  
**Permission required:** UPLOAD_DOCUMENT, VERIFY_DOCUMENT, TRANSITION_WORKFLOW (compliance stages only)

### Steps
1. Open Documents page — see list of all documents with PENDING_VERIFICATION status
2. Click on a pending document to open its applicant dossier
3. Review the document — click **Verify** or **Reject**
4. **System action (Verify):** `PATCH /api/applicants/[id]/documents/[docId]` — sets status to VERIFIED, records verifiedById (staff user ID), writes audit log
5. **System action (Reject):** same endpoint — sets status to REJECTED, writes audit log with remarks
6. Once medical report is verified, open applicant dossier
7. Click **Move Stage** → select MEDICAL_FIT
8. **System action:** `POST /api/applicants/[id]/workflows` — checks that MEDICAL_REPORT document exists with VERIFIED status, proceeds with transition, creates WorkflowHistory, sends notification, writes audit log
9. If document is missing: system returns 400 error — "MEDICAL_REPORT must be uploaded and verified before transitioning to MEDICAL_FIT"

**Database tables affected:** Document (status update), WorkflowHistory (new row), Applicant (currentStage update), AuditLog (created), Notification (created)

---

## Flow 5: Visa Officer Workflow Flow

**Starting page:** `/applicants` filtered by TRAINING_COMPLETED  
**Permission required:** VIEW_APPLICANTS, UPLOAD_DOCUMENT, TRANSITION_WORKFLOW (visa stages only)

### Steps
1. Open Applicants — filter by stage TRAINING_COMPLETED
2. Open applicant ready for visa
3. Verify that PASSPORT document is verified (required for VISA_SUBMITTED)
4. Click **Move Stage** → VISA_SUBMITTED
5. **System action:** `POST /api/applicants/[id]/workflows` — checks PASSPORT verified, proceeds
6. Once visa is stamped: upload VISA_STICKER document via dossier
7. Click **Move Stage** → VISA_STAMPED
8. **System action:** checks VISA_STICKER verified
9. Book air ticket: upload AIR_TICKET document
10. Click **Move Stage** → TICKETED
11. **System action:** checks AIR_TICKET verified
12. On departure day: click **Move Stage** → DEPLOYED
13. **System action:** checks PASSPORT + MEDICAL_REPORT + VISA_STICKER + AIR_TICKET all verified, creates WorkflowHistory, sends notifications to applicant and agent, writes audit log

**Database tables affected:** Document (new rows), WorkflowHistory (new rows), Applicant (currentStage updates), AuditLog (created), Notification (created)

---

## Flow 6: Accounts Officer Invoice and Receipt Flow

**Starting page:** `/applicants` (or `/receipts-invoices`)  
**Permission required:** VIEW_APPLICANTS, VIEW_ACCOUNTS, RECORD_PAYMENT, VIEW_COMMISSIONS

### Steps

**Creating an Invoice:**
1. Open applicant dossier (from Applicants page)
2. Scroll to **Finance** section → click **Issue Invoice**
3. Fill in: amount, due date, description (e.g. "Processing Fee")
4. Submit
5. **System action:** `POST /api/applicants/[id]/invoices` — creates Invoice record, creates LedgerEntry (type: INVOICE, debit = amount), generates invoice number (INV-YYYY-XXXXX), writes audit log, sends notification
6. Invoice appears in dossier with status: DUE (outstanding = full amount)

**Recording a Receipt:**
1. Applicant brings payment — Accounts Officer opens applicant dossier
2. Click **Record Receipt** → select invoice, enter amount paid, payment method (Cash/Bank Transfer/Cheque/Mobile Banking), reference number (optional)
3. Submit
4. **System action:** `POST /api/applicants/[id]/receipts` — creates Receipt, updates Invoice.outstanding (subtracts amount paid), creates LedgerEntry (type: RECEIPT, credit = amountPaid), calculates running balance, generates receipt number (REC-YYYY-XXXXX), writes audit log, sends notification
5. If fully paid: invoice status becomes PAID (outstanding = 0)
6. If partial: invoice status becomes PARTIAL

**Viewing Ledger:**
1. Navigate to **Accounts** page
2. See paginated ledger: all debit (invoices) and credit (receipts) entries with running balance
3. Filter by applicant name, passport, invoice no, receipt no, or transaction type
4. View summary: total billed, total collected, total outstanding, total commissions accrued

**Database tables affected:** Invoice (created), Receipt (created), LedgerEntry (new rows), Applicant (via join), AuditLog (created), Notification (created)

---

## Flow 7: Agent Own Candidates and Commission Flow

**Starting page:** `/dashboard` (Agent view)  
**Permission required:** VIEW_DASHBOARD, VIEW_APPLICANTS (scoped), CREATE_APPLICANT (scoped), UPLOAD_DOCUMENT (scoped), VIEW_COMMISSIONS (scoped)

### Steps
1. Log in as Agent → Dashboard shows: own total applicants, active, deployed, commission accrued, commission paid, own applicant list
2. Navigate to Applicants — only own candidates appear (backend enforces `agentId = agent.id`)
3. Click **New Applicant** — fill in candidate details
4. **System action:** Backend automatically sets `agentId` to the logged-in agent's profile ID — agent cannot assign to another agent
5. Open applicant dossier — upload passport scan for the candidate
6. Navigate to **Commissions** — see only own commission records (backend enforces `agentId = agent.id`)
7. Commission appears as ACCRUED once an Accounts Officer marks it

**Database tables affected:** Applicant (agent-scoped), Document (agent-scoped upload), Commission (agent-scoped view)

---

## Flow 8: Applicant Self-Service Portal Flow

**Status:** ✅ LIVE (backend + basic frontend)

**Starting page:** `/login`  
**Permission required:** Applicant role (scoped to own profile only)

### Steps
1. Navigate to `/login`
2. Enter applicant credentials
3. Click **Sign In**
4. **System action:** Login detects role = "Applicant" → redirects to `/applicant/portal` instead of `/dashboard`
5. Portal loads: `GET /api/applicant/portal` — fetches own applicant record via `Applicant.userId = logged-in userId`
6. Portal displays: name, passport, stage, job order, documents (with status), invoices, receipts, ledger balance
7. Document file paths are replaced with secure download URLs: `/api/applicants/{id}/documents/{docId}/download`
8. Applicant can view their progress but cannot edit anything

**Boundary enforcement:**  
- `/api/applicant/portal` returns 403 for any role other than "Applicant"  
- `/api/applicants/[id]` for Applicant role checks `applicantProfile.id === requested id`  
- Sidebar is hidden entirely for Applicant role  

**Database tables affected:** Applicant (read-only), Document (read-only), Invoice (read-only), Receipt (read-only), LedgerEntry (read-only)

---

## Flow 9: Soft Archive / Restore Flow

**Permission required:** ARCHIVE_APPLICANT

### Steps

**Archive:**
1. Open applicant dossier
2. Click **Archive Applicant** (or Archive button on list)
3. Confirm in dialog
4. **System action:** `PATCH /api/applicants/[id]/archive` — sets `isArchived = true`, sets `archivedAt = now()`, writes audit log (ARCHIVE_APPLICANT)
5. Applicant disappears from default list (query filter: `isArchived: false`)
6. All financial records are preserved — receipts, invoices, ledger, commissions remain intact

**Restore:**
1. On Applicants page, toggle "Show Archived" filter
2. Archived applicants appear with archive badge
3. Open archived applicant → click **Restore**
4. **System action:** same PATCH endpoint — sets `isArchived = false`, `archivedAt = null`, writes audit log

**Database tables affected:** Applicant (isArchived, archivedAt), AuditLog (created)

---

## Flow 10: CSV Export Flow

**Permission required:** VIEW_REPORTS (for most exports) / VIEW_ACCOUNTS (for finance exports) / VIEW_AUDIT_LOGS (for audit log export)

### Steps
1. Navigate to **Reports** page
2. Click **Export Applicants CSV**, **Export Invoices CSV**, etc.
3. **System action:** `GET /api/exports/{entity}` — fetches all matching records from DB, builds CSV using `src/lib/csv.ts`, returns response with:
   - `Content-Type: text/csv; charset=utf-8`
   - `Content-Disposition: attachment; filename="overseas-erp-{entity}-{date}.csv"`
   - UTF-8 BOM prefix (for Excel compatibility)
4. Browser triggers file download

**Available exports:**
- Applicants: `/api/exports/applicants`
- Invoices: `/api/exports/invoices`
- Receipts: `/api/exports/receipts`
- Ledger: `/api/exports/ledger`
- Commissions: `/api/exports/commissions`
- Audit Logs: `/api/exports/audit-logs`

**Database tables affected:** Read-only across respective tables (no writes)
