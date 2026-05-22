# 06 — Module Guide

This document explains every module: what it does, which UI pages it includes, which API endpoints it uses, which database models it touches, who can access it, and how to demo it.

---

## Module 1: Dashboard

### Purpose
The dashboard gives each role a tailored view of their key performance indicators and action queues. There is no generic dashboard — every role sees different data relevant to their job.

### Main UI Pages
- `src/app/dashboard/page.tsx`

### Main API Endpoints
- `GET /api/reports/dashboard` — returns role-specific aggregates

### Database Models
- Applicant, Agent, JobOrder, Invoice, Receipt, Commission, AuditLog, Notification, Document

### Permissions
- `VIEW_DASHBOARD` — required to access the page
- Applicant role: blocked (redirected to portal)

### Current Status
✅ LIVE — All 7 role views functional with real database aggregates

### Dashboard Views by Role
| Role | Key Metrics |
|------|------------|
| Super Admin / Ops Admin | Active/archived applicants, total agents, job order quota, financial totals, stage distribution, passport expiry alerts, pending docs, recent audit logs |
| HR Officer | Applied / Interviewed / Selected counts, recruitment queue, open job orders |
| Documentation Officer | Pending document count, verified doc count, medical stage counts, applicants needing document review |
| Visa Officer | Visa Submitted / Stamped / Rejected counts, cleared for visa count, visa queue |
| Accounts Officer | Total invoiced, collected, outstanding, overdue invoice count, pending commissions |
| Agent | Own candidate totals, deployed count, own commission accrued vs paid |

### Demo Steps
1. Log in as Super Admin → see full dashboard
2. Log out → log in as HR Officer → see filtered HR dashboard
3. Log out → log in as Accounts Officer → see financial dashboard

---

## Module 2: Applicants

### Purpose
Central registry of all candidates being processed. Staff can search, filter, create, edit, and manage applicants. Agents see only their own candidates. Applicants cannot access this module.

### Main UI Pages
- `src/app/applicants/page.tsx` — list page with search, filters, pagination
- `src/app/applicants/[id]/page.tsx` — applicant dossier (full profile + all related data)

### Main API Endpoints
- `GET /api/applicants` — list with pagination and filters
- `POST /api/applicants` — create new applicant
- `GET /api/applicants/[id]` — fetch applicant with all relations
- `PATCH /api/applicants/[id]` — update applicant bio-data

### Database Models
- Applicant (primary), Agent (join), JobOrder (join), WorkflowHistory, Document, Invoice, Receipt, LedgerEntry

### Permissions
- `VIEW_APPLICANTS` — list and view
- `CREATE_APPLICANT` — create new record
- `UPDATE_APPLICANT` — edit bio-data

### Current Status
✅ LIVE — Full CRUD with pagination, search, filter, audit log, agent scoping

### Demo Steps
1. Navigate to `/applicants`
2. Search by passport number or name
3. Filter by stage (e.g. VISA_SUBMITTED)
4. Click **New Applicant** → fill in form → submit
5. Click applicant name → view full dossier
6. Edit bio-data field → submit → check audit log for UPDATE_APPLICANT entry

---

## Module 3: Job Orders

### Purpose
Job orders represent employment demand from overseas employers. Each order has a quota of positions, salary, country, and employer name. Applicants are linked to a job order when selected.

### Main UI Pages
- `src/app/job-orders/page.tsx`

### Main API Endpoints
- No dedicated API endpoint in `src/app/api/` for job orders yet  
- Job order data is embedded in the dashboard API and applicant creation forms

### Database Models
- JobOrder, Applicant (foreign key), Commission (foreign key)

### Permissions
- `VIEW_DASHBOARD` — used as the gating permission for this link

### Current Status
🔶 PARTIAL — Job order display works through dashboard and applicant forms. Dedicated CRUD API for job orders (create/update/delete) is not confirmed in the current API folder. Job order data is read from DB via dashboard and create-applicant form.

### Notes
- Job Orders are seeded in the database via `prisma/seed.ts`
- The Job Orders page shows the list but may be read-only in the current build
- Agents do not see the Job Orders sidebar item (hidden by sidebar logic)

---

## Module 4: Agents

### Purpose
Agent management allows Super Admin and Operations Admin to create and manage external recruitment partner profiles. Each agent has a unique agent code (AGT-XXX), company name, license number, and tier (A/B/C).

### Main UI Pages
- `src/app/agents/page.tsx`

### Main API Endpoints
- Agent management may use dedicated API endpoints (verify in code). Agent data is read via commission and dashboard APIs.

### Database Models
- Agent, User (one-to-one), Applicant (agent has many), Commission (agent has many)

### Permissions
- `MANAGE_AGENTS` — required to view and manage agents

### Current Status
🔶 PARTIAL — Agent profiles are created via seed. Agent management UI page exists. Full CRUD API (create agent, update agent) should be verified in `src/app/api/`.

### Notes
- The `Agent.tier` field (A/B/C) exists in the schema but tier-based commission scaling is not implemented in the commission logic
- Agent users log in with their own credentials and see scoped views

---

## Module 5: Documents

### Purpose
The documents module provides a global view of all compliance documents across all applicants. Staff can see pending documents and navigate to the relevant applicant to verify them.

### Main UI Pages
- `src/app/documents/page.tsx` — global document queue

### Main API Endpoints
- `POST /api/applicants/[id]/documents` — upload document
- `PATCH /api/applicants/[id]/documents/[docId]` — verify / reject document
- `GET /api/applicants/[id]/documents/[docId]/download` — secure authenticated download

### Database Models
- Document, Applicant (join), User (verifiedById)

### Permissions
- `UPLOAD_DOCUMENT` — upload files
- `VERIFY_DOCUMENT` — mark VERIFIED or REJECTED
- `VIEW_APPLICANTS` — needed to see the applicant context

### Current Status
✅ LIVE — Upload, verify, reject, and secure download all functional

### Document Types
`PASSPORT`, `PHOTO`, `CV`, `MEDICAL_REPORT`, `POLICE_CLEARANCE`, `VISA_STICKER`, `AIR_TICKET`, `OTHER`

### Document Status Flow
`PENDING_UPLOAD` → `PENDING_VERIFICATION` → `VERIFIED` or `REJECTED` or `EXPIRED`

### Demo Steps
1. Open any applicant dossier
2. Click **Upload Document** → select type: PASSPORT → choose PDF file → submit
3. Document appears with status: PENDING_VERIFICATION
4. Staff with VERIFY_DOCUMENT permission clicks **Verify** → status changes to VERIFIED
5. Click **Download** → browser downloads the file securely (requires auth token)

---

## Module 6: Accounts (General Ledger)

### Purpose
The Accounts module provides a double-entry ledger view of all financial transactions. Every invoice creates a debit entry; every receipt creates a credit entry. The running balance per applicant is tracked.

### Main UI Pages
- `src/app/accounts/page.tsx`

### Main API Endpoints
- `GET /api/accounts/ledger` — paginated ledger with filters and stats

### Database Models
- LedgerEntry, Invoice (reference), Receipt (reference), Applicant (join)

### Permissions
- `VIEW_ACCOUNTS` — required

### Current Status
✅ LIVE — Full ledger view with financial summary stats

### Double-Entry Logic
- **Invoice created** → LedgerEntry: debit = invoice amount, credit = 0
- **Receipt recorded** → LedgerEntry: debit = 0, credit = amount paid
- **Running balance** = cumulative sum of (debit - credit) for the applicant
- A positive running balance means the applicant owes money

---

## Module 7: Receipts & Invoices

### Purpose
Provides a combined browser for all invoices and receipts across all applicants. Accounts Officers use this to find specific payments, check invoice status, and print vouchers.

### Main UI Pages
- `src/app/receipts-invoices/page.tsx`

### Main API Endpoints
- `GET /api/finance/invoices` — all invoices with status computation
- `GET /api/finance/receipts` — all receipts with joined invoice and applicant data

### Database Models
- Invoice, Receipt, Applicant (join)

### Permissions
- `VIEW_ACCOUNTS` — required

### Current Status
✅ LIVE — Paginated list of invoices and receipts with status badges and print support

---

## Module 8: Commissions

### Purpose
Tracks agent commissions for every placed candidate. Accounts staff can accrue a commission when a candidate is deployed and mark it as paid when the agent receives payment.

### Main UI Pages
- `src/app/commissions/page.tsx`

### Main API Endpoints
- `GET /api/finance/commissions` — list with stats (scoped for Agent)
- `POST /api/finance/commissions/accrue` — create commission record (ACCRUED)
- `PATCH /api/finance/commissions/[id]/payout` — mark as PAID with payoutRef

### Database Models
- Commission, Agent, Applicant, JobOrder

### Permissions
- `VIEW_COMMISSIONS` — view the register (both staff and agents, scoped)
- `RECORD_PAYMENT` — accrue and payout (Accounts Officer)

### Unique Constraint
`@@unique([agentId, applicantId])` — prevents duplicate commissions for the same candidate from the same agent.

### Current Status
✅ LIVE — Accrue and payout functional; agent scoping enforced

### Demo Steps
1. As Accounts Officer: navigate to Commissions
2. Click **Accrue Commission** → select agent, applicant (must be DEPLOYED), job order → submit
3. Commission appears with status: ACCRUED
4. When paying agent: click **Release Payout** → enter bank reference → submit
5. Commission status changes to: PAID

---

## Module 9: Reports / Exports

### Purpose
Provides CSV data exports for all major data entities. Designed for management reporting, backup, and integration with other tools.

### Main UI Pages
- `src/app/reports/page.tsx`

### Main API Endpoints
- `GET /api/exports/applicants`
- `GET /api/exports/invoices`
- `GET /api/exports/receipts`
- `GET /api/exports/ledger`
- `GET /api/exports/commissions`
- `GET /api/exports/audit-logs`

### Database Models
- All major models

### Permissions
- `VIEW_REPORTS` — for applicant/financial exports
- `VIEW_AUDIT_LOGS` — for audit log export

### Current Status
✅ LIVE — All 6 export endpoints functional with injection protection and Excel BOM

---

## Module 10: Notifications

### Purpose
In-app notification center. Key system events automatically create notifications for relevant users. Staff can mark notifications as read individually or all at once.

### Main UI Pages
- `src/app/notifications/page.tsx`

### Main API Endpoints
- `GET /api/notifications` — fetch own notifications (paginated)
- `PATCH /api/notifications/[id]` — mark single notification as read
- `POST /api/notifications/mark-all-read` — mark all notifications as read

### Database Models
- Notification, User

### Permissions
- `VIEW_NOTIFICATIONS` — access notification page (all roles have this)

### Auto-Notification Events
| Event | Who is Notified |
|-------|----------------|
| Stage transition | Linked applicant user, linked agent user |
| Document upload | Super Admin, Operations Admin, Documentation Officer users |
| Invoice created | Linked applicant user |
| Receipt recorded | Linked applicant user |

### Current Status
✅ LIVE — In-app notifications functional. Real-time push notifications not implemented (page refresh needed).

---

## Module 11: Audit Logs

### Purpose
Complete immutable audit trail of every significant action performed in the system. Used for compliance, debugging, and dispute resolution.

### Main UI Pages
- `src/app/audit-logs/page.tsx`

### Main API Endpoints
- `GET /api/audit-logs` — paginated audit log list
- `GET /api/exports/audit-logs` — CSV export

### Database Models
- AuditLog, User (join)

### Permissions
- `VIEW_AUDIT_LOGS` — required (Super Admin, Operations Admin only)

### Logged Action Types
`LOGIN_SUCCESS`, `CREATE_APPLICANT`, `UPDATE_APPLICANT`, `ARCHIVE_APPLICANT`, `TRANSITION_STAGE`, `UPLOAD_DOCUMENT`, `VERIFY_DOCUMENT`, `REJECT_DOCUMENT`, `CREATE_INVOICE`, `RECORD_RECEIPT`, `ACCRUE_COMMISSION`, `PAYOUT_COMMISSION`, and more.

### Current Status
✅ LIVE — Auto-written on all mutations; includes delta, IP, role, timestamp

---

## Module 12: RBAC Settings

### Purpose
Allows Super Admin to view and manage roles and their associated permissions. This is the configuration layer for the entire access control system.

### Main UI Pages
- `src/app/rbac/page.tsx`

### Main API Endpoints
- Not confirmed from current API folder scan — RBAC CRUD may use applicant APIs or a dedicated endpoint

### Database Models
- Role, Permission, RolePermission, User

### Permissions
- `MANAGE_RBAC` — required (Super Admin only)

### Current Status
🔶 PARTIAL — Page is accessible and displays RBAC data. Full create/edit/delete role and permission assignment via UI may be limited. Database roles are seeded via `prisma/seed.ts`.

---

## Module 13: Applicant Portal

### Purpose
A self-service page for placed candidates to check their application progress, document statuses, and financial information without contacting the agency.

### Main UI Pages
- `src/app/applicant/portal/page.tsx`

### Main API Endpoints
- `GET /api/applicant/portal` — complete self-service dossier (own record only)

### Database Models
- Applicant (own), Document, Invoice, Receipt, LedgerEntry

### Permissions
- Role must be "Applicant" — any other role is blocked with 403
- Only own record is returned (matched by `Applicant.userId = logged-in userId`)

### Current Status
✅ LIVE — Backend and frontend functional. Read-only view of own dossier.

### Security Note
Document file paths are replaced with secure download URLs in the portal API response. The raw storage path (`storage/applicants/...`) is never exposed to the browser.

### Demo Steps
1. Log in as Applicant (e.g. `applicant@applicant.com`)
2. System redirects to `/applicant/portal`
3. View current stage indicator
4. See document statuses (VERIFIED, PENDING, REJECTED)
5. View invoice amounts and payment receipts
6. View ledger running balance
