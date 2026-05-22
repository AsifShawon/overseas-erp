# 05 — Feature Status: LIVE vs PENDING

This document lists every implemented and planned feature with its current status.

**Status definitions:**
- ✅ **LIVE** — Fully implemented, API and UI functional with real database
- 🔶 **PARTIAL** — Core logic implemented but some aspects incomplete or rough
- 🔷 **MOCK** — UI present but using hardcoded/fake data (no real API call)
- ❌ **FUTURE** — Not yet built, planned for a future phase

---

## Authentication & Session

| Feature | Status | Main Files | Notes |
|---------|--------|-----------|-------|
| Email + password login | ✅ LIVE | `src/app/api/auth/login/route.ts`, `src/app/login/` | Argon2 password verify |
| Refresh token (HttpOnly cookie) | ✅ LIVE | `src/app/api/auth/refresh/route.ts` | 7-day refresh token |
| Access token (15-minute JWT) | ✅ LIVE | `src/lib/auth.ts` | jose library, HS256 |
| Silent refresh (auto-renew) | ✅ LIVE | `src/context/MockAuthContext.tsx` | Polls every 10 minutes |
| Logout + cookie clear | ✅ LIVE | `src/app/api/auth/logout/route.ts` | Clears HttpOnly cookie |
| Session guard / redirect to login | ✅ LIVE | `src/context/MockAuthContext.tsx` | Redirect if no session |
| Login audit log | ✅ LIVE | `src/app/api/auth/login/route.ts` | LOGIN_SUCCESS written |
| Two-factor authentication | ❌ FUTURE | Schema has `twoFactorSecret` field | Column exists, logic not built |
| Account deactivation check | ✅ LIVE | `src/app/api/auth/login/route.ts` | `isActive = false` blocks login |

---

## RBAC (Role-Based Access Control)

| Feature | Status | Main Files | Notes |
|---------|--------|-----------|-------|
| Dynamic permissions from DB | ✅ LIVE | `src/lib/rbac.ts`, `RolePermission` table | Fetched at login |
| Frontend permission gates | ✅ LIVE | `src/context/MockAuthContext.tsx`, `Sidebar.tsx` | `hasAccess()` hook |
| Backend permission enforcement | ✅ LIVE | All `route.ts` files | DB permission check per request |
| Role-specific data boundaries | ✅ LIVE | All API route handlers | Agent/Applicant scope enforced |
| RBAC Settings UI page | 🔶 PARTIAL | `src/app/rbac/` | Page exists; full CRUD for roles/permissions may be limited |
| Permission assignment UI | 🔶 PARTIAL | `src/app/rbac/` | Visible to Super Admin only |

---

## Dashboard

| Feature | Status | Main Files | Notes |
|---------|--------|-----------|-------|
| Super Admin / Ops Admin dashboard | ✅ LIVE | `src/app/dashboard/page.tsx`, `src/app/api/reports/dashboard/route.ts` | All aggregates from DB |
| HR Officer dashboard | ✅ LIVE | Same above | Applied/Interviewed/Selected queue |
| Documentation Officer dashboard | ✅ LIVE | Same above | Pending doc count, medical queue |
| Visa Officer dashboard | ✅ LIVE | Same above | Visa queue |
| Accounts Officer dashboard | ✅ LIVE | Same above | Financial totals, pending invoices |
| Agent dashboard | ✅ LIVE | Same above | Own candidate totals and commissions |
| Applicant dashboard | ❌ Not applicable | `src/app/applicant/portal/` | Applicant uses portal, not dashboard |
| Passport expiry warnings | ✅ LIVE | `src/app/api/reports/dashboard/route.ts` | Top 5 soonest expiries within 6 months |
| Pending document alerts | ✅ LIVE | Same | Count of PENDING_VERIFICATION documents |
| Stage distribution counts | ✅ LIVE | Same | groupBy currentStage |

---

## Applicants

| Feature | Status | Main Files | Notes |
|---------|--------|-----------|-------|
| Applicant list with pagination | ✅ LIVE | `src/app/applicants/page.tsx`, `GET /api/applicants` | 10 per page default |
| Search by name / passport / phone | ✅ LIVE | `GET /api/applicants?search=` | Case-insensitive |
| Filter by stage / trade / country / agent | ✅ LIVE | `GET /api/applicants?stage=&trade=&country=&agentId=` | |
| View archived applicants | ✅ LIVE | `GET /api/applicants?archived=true` | Toggle on UI |
| Create applicant | ✅ LIVE | `POST /api/applicants` | Zod validation, passport uniqueness |
| Edit applicant bio-data | ✅ LIVE | `PATCH /api/applicants/[id]` | Delta captured in audit log |
| View applicant dossier | ✅ LIVE | `src/app/applicants/[id]/page.tsx`, `GET /api/applicants/[id]` | Full relation includes |
| Agent-scoped applicant list | ✅ LIVE | `GET /api/applicants` | `agentId` enforced in query |

---

## Applicant Detail

| Feature | Status | Main Files | Notes |
|---------|--------|-----------|-------|
| Bio-data section | ✅ LIVE | `src/app/applicants/[id]/page.tsx` | |
| Workflow history timeline | ✅ LIVE | Same | WorkflowHistory records displayed |
| Document panel | ✅ LIVE | Same | Lists all documents with status badges |
| Finance panel (invoices, receipts, ledger) | ✅ LIVE | Same | Shows all financial data per applicant |
| Move stage (transition button) | ✅ LIVE | `POST /api/applicants/[id]/workflows` | Role-aware, gate-enforced |
| Upload document button | ✅ LIVE | `POST /api/applicants/[id]/documents` | Multipart upload |
| Issue invoice button | ✅ LIVE | `POST /api/applicants/[id]/invoices` | RECORD_PAYMENT permission |
| Record receipt button | ✅ LIVE | `POST /api/applicants/[id]/receipts` | RECORD_PAYMENT permission |
| Archive / Restore button | ✅ LIVE | `PATCH /api/applicants/[id]/archive` | ARCHIVE_APPLICANT permission |
| Print voucher (receipt) | 🔶 PARTIAL | Frontend only | Browser print; no PDF generation |

---

## Workflow Mutations

| Feature | Status | Main Files | Notes |
|---------|--------|-----------|-------|
| Stage transition API | ✅ LIVE | `POST /api/applicants/[id]/workflows` | Full DB transaction |
| Role-restricted stage access | ✅ LIVE | `src/lib/workflow-rules.ts` | HR/Docs/Visa stage zones |
| Document prerequisite gates | ✅ LIVE | `src/lib/workflow-rules.ts` | MEDICAL_FIT, VISA stages, DEPLOYED |
| Admin override with remarks | ✅ LIVE | `POST /api/applicants/[id]/workflows` | Super Admin / Ops Admin only |
| Stage transition notifications | ✅ LIVE | Same | Notifies applicant user and agent user |
| Stage transition audit log | ✅ LIVE | Same | delta includes before/after stage |
| WorkflowHistory row | ✅ LIVE | Same | One row per transition |

---

## Documents Upload / Verify / Download

| Feature | Status | Main Files | Notes |
|---------|--------|-----------|-------|
| Document upload (staff) | ✅ LIVE | `POST /api/applicants/[id]/documents` | PDF/JPG/PNG, max 5MB |
| Document upload (agent-scoped) | ✅ LIVE | Same | agentId boundary enforced |
| Document upload (applicant-scoped) | ✅ LIVE | Same | Own profile only |
| Document verify / reject | ✅ LIVE | `PATCH /api/applicants/[id]/documents/[docId]` | VERIFY_DOCUMENT permission |
| Secure document download | ✅ LIVE | `GET /api/applicants/[id]/documents/[docId]/download` | JWT auth required, streams file |
| Document expiry tracking | ✅ LIVE | `Document.expiryDate` | Optional expiry field |
| Document type enum validation | ✅ LIVE | `POST /api/applicants/[id]/documents` | PASSPORT, MEDICAL_REPORT, etc. |
| Document upload notification | ✅ LIVE | `POST /api/applicants/[id]/documents` | Notifies Super Admin, Ops Admin, Docs Officer |
| Document upload audit log | ✅ LIVE | Same | Captures file metadata in delta |
| Bulk document viewer (global) | 🔶 PARTIAL | `src/app/documents/page.tsx` | Fetches docs across all applicants |

---

## Stage Gates

| Feature | Status | Main Files | Notes |
|---------|--------|-----------|-------|
| MEDICAL_FIT gate: MEDICAL_REPORT required | ✅ LIVE | `src/lib/workflow-rules.ts` | |
| VISA_SUBMITTED gate: PASSPORT required | ✅ LIVE | Same | |
| VISA_STAMPED gate: VISA_STICKER required | ✅ LIVE | Same | |
| TICKETED gate: AIR_TICKET required | ✅ LIVE | Same | |
| DEPLOYED gate: All 4 docs required | ✅ LIVE | Same | PASSPORT + MEDICAL_REPORT + VISA_STICKER + AIR_TICKET |
| Admin override of gate (with remarks) | ✅ LIVE | `POST /api/applicants/[id]/workflows` | Super Admin / Ops Admin only |

---

## Invoices

| Feature | Status | Main Files | Notes |
|---------|--------|-----------|-------|
| Create invoice per applicant | ✅ LIVE | `POST /api/applicants/[id]/invoices` | INV-YYYY-XXXXX number |
| List all invoices | ✅ LIVE | `GET /api/finance/invoices` | Paginated, searchable |
| Invoice status: DUE / PARTIAL / PAID | ✅ LIVE | `GET /api/finance/invoices` | Computed from outstanding field |
| Invoice creates ledger debit entry | ✅ LIVE | `POST /api/applicants/[id]/invoices` | LedgerEntry type: INVOICE |
| Invoice audit log | ✅ LIVE | Same | CREATE_INVOICE action |
| Invoice notification | ✅ LIVE | Same | Notifies applicant user |
| Invoice edit / delete | ❌ FUTURE | Not implemented | Financial records not deleted by design |

---

## Receipts

| Feature | Status | Main Files | Notes |
|---------|--------|-----------|-------|
| Record receipt (link to invoice) | ✅ LIVE | `POST /api/applicants/[id]/receipts` | REC-YYYY-XXXXX number |
| Payment method tracking | ✅ LIVE | Same | Cash, Bank Transfer, Cheque, Mobile Banking |
| Reference number (bank/cheque) | ✅ LIVE | Same | Optional field |
| Receipt updates invoice outstanding | ✅ LIVE | Same | `outstanding -= amountPaid` |
| Receipt creates ledger credit entry | ✅ LIVE | Same | LedgerEntry type: RECEIPT |
| Running balance calculation | ✅ LIVE | Same | Computed per applicant |
| Receipt audit log | ✅ LIVE | Same | RECORD_RECEIPT action |
| Receipt notification | ✅ LIVE | Same | Notifies applicant user |
| List all receipts | ✅ LIVE | `GET /api/finance/receipts` | With joined invoice data |
| Receipt print / PDF voucher | 🔶 PARTIAL | Frontend dossier page | Browser print only; no server-side PDF |

---

## Ledger

| Feature | Status | Main Files | Notes |
|---------|--------|-----------|-------|
| Double-entry ledger table | ✅ LIVE | `LedgerEntry` model | Debit + Credit + RunningBalance |
| Ledger view (general ledger) | ✅ LIVE | `GET /api/accounts/ledger` | Paginated |
| Filter by applicant / invoice / receipt / type | ✅ LIVE | Same | Search query param |
| Financial summary (billed, collected, outstanding) | ✅ LIVE | Same | Aggregated from Invoice/Receipt tables |
| Per-applicant ledger in dossier | ✅ LIVE | `GET /api/applicants/[id]` | Returns `ledgerEntries` array |

---

## Accounts Page

| Feature | Status | Main Files | Notes |
|---------|--------|-----------|-------|
| General ledger page | ✅ LIVE | `src/app/accounts/page.tsx` | VIEW_ACCOUNTS permission |
| Summary stats bar | ✅ LIVE | `GET /api/accounts/ledger` | |
| Agent/Applicant blocked | ✅ LIVE | `GET /api/accounts/ledger` | 403 enforced |

---

## Receipts & Invoices Page

| Feature | Status | Main Files | Notes |
|---------|--------|-----------|-------|
| Combined receipts/invoices browser | ✅ LIVE | `src/app/receipts-invoices/page.tsx` | VIEW_ACCOUNTS permission |
| Search and pagination | ✅ LIVE | `GET /api/finance/invoices`, `GET /api/finance/receipts` | |
| Invoice status badges | ✅ LIVE | Frontend computed | DUE / PARTIAL / PAID |
| Receipt voucher print | 🔶 PARTIAL | Frontend only | Browser print |

---

## Commissions

| Feature | Status | Main Files | Notes |
|---------|--------|-----------|-------|
| Commission list (staff view) | ✅ LIVE | `GET /api/finance/commissions` | With agent/applicant/job order joins |
| Commission list (agent-scoped) | ✅ LIVE | Same | `agentId` enforced |
| Commission stats: accrued, paid, cancelled, total | ✅ LIVE | Same | Aggregated totals in response |
| Accrue commission | ✅ LIVE | `POST /api/finance/commissions/accrue` | Creates Commission record (ACCRUED) |
| Unique commission constraint | ✅ LIVE | `Commission.@@unique([agentId, applicantId])` | One per placed candidate |
| Release payout (mark PAID) | ✅ LIVE | `PATCH /api/finance/commissions/[id]/payout` | Records payoutRef and payoutDate |
| Cancel commission | 🔶 PARTIAL | Not documented in UI flow | Status enum has CANCELLED |
| Commission page | ✅ LIVE | `src/app/commissions/page.tsx` | VIEW_COMMISSIONS permission |

---

## Notifications

| Feature | Status | Main Files | Notes |
|---------|--------|-----------|-------|
| In-app notifications list | ✅ LIVE | `GET /api/notifications`, `src/app/notifications/page.tsx` | |
| Mark single notification read | ✅ LIVE | `PATCH /api/notifications/[id]` | |
| Mark all notifications read | ✅ LIVE | `POST /api/notifications/mark-all-read` | |
| Auto-notify on stage transition | ✅ LIVE | Workflow API | Notifies applicant and agent |
| Auto-notify on document upload | ✅ LIVE | Document API | Notifies Super Admin, Ops Admin, Docs Officer |
| Auto-notify on invoice created | ✅ LIVE | Invoice API | Notifies applicant |
| Auto-notify on receipt recorded | ✅ LIVE | Receipt API | Notifies applicant |
| Notification badge (unread count) | 🔶 PARTIAL | Topbar may show indicator | Real-time push not implemented |
| Email notification | ❌ FUTURE | `.env.example` has SMTP placeholder | Not built |
| SMS notification | ❌ FUTURE | `.env.example` has Twilio placeholder | Not built |
| WhatsApp notification | ❌ FUTURE | — | Not built |

---

## Audit Logs

| Feature | Status | Main Files | Notes |
|---------|--------|-----------|-------|
| Audit log list page | ✅ LIVE | `src/app/audit-logs/page.tsx`, `GET /api/audit-logs` | VIEW_AUDIT_LOGS permission |
| Auto-log: login success | ✅ LIVE | Login API | |
| Auto-log: create applicant | ✅ LIVE | Applicants API | |
| Auto-log: update applicant | ✅ LIVE | Applicants API | Delta before/after |
| Auto-log: stage transition | ✅ LIVE | Workflow API | |
| Auto-log: document upload | ✅ LIVE | Documents API | |
| Auto-log: document verify/reject | ✅ LIVE | Documents API | |
| Auto-log: create invoice | ✅ LIVE | Invoice API | |
| Auto-log: record receipt | ✅ LIVE | Receipt API | |
| Auto-log: archive / restore | ✅ LIVE | Archive API | |
| Auto-log: accrue commission | ✅ LIVE | Commission API | |
| Auto-log: payout commission | ✅ LIVE | Commission payout API | |
| IP address capture | ✅ LIVE | All mutation APIs | `x-forwarded-for` header |
| Delta (before/after) JSON | ✅ LIVE | Update/transition logs | Stored in `delta` Json field |
| Export audit log CSV | ✅ LIVE | `GET /api/exports/audit-logs` | VIEW_AUDIT_LOGS permission |

---

## CSV Exports

| Feature | Status | Main Files | Notes |
|---------|--------|-----------|-------|
| Export applicants | ✅ LIVE | `GET /api/exports/applicants` | VIEW_REPORTS |
| Export invoices | ✅ LIVE | `GET /api/exports/invoices` | VIEW_REPORTS |
| Export receipts | ✅ LIVE | `GET /api/exports/receipts` | VIEW_REPORTS |
| Export ledger | ✅ LIVE | `GET /api/exports/ledger` | VIEW_REPORTS |
| Export commissions | ✅ LIVE | `GET /api/exports/commissions` | VIEW_REPORTS |
| Export audit logs | ✅ LIVE | `GET /api/exports/audit-logs` | VIEW_AUDIT_LOGS |
| UTF-8 BOM for Excel compatibility | ✅ LIVE | `src/lib/csv.ts` | |
| CSV injection protection | ✅ LIVE | `src/lib/csv.ts` | Prefixes `=`, `+`, `-`, `@` with `'` |

---

## Soft Archive / Restore

| Feature | Status | Main Files | Notes |
|---------|--------|-----------|-------|
| Archive applicant | ✅ LIVE | `PATCH /api/applicants/[id]/archive` | Sets isArchived=true, archivedAt |
| Restore applicant | ✅ LIVE | Same endpoint | Sets isArchived=false |
| Archived filter on list page | ✅ LIVE | `GET /api/applicants?archived=true` | |
| Financial records preserved | ✅ LIVE | By design | onDelete: Restrict prevents data loss |
| Archive audit log | ✅ LIVE | Archive API | |
| Hard delete | ❌ FUTURE | Not built by design | Intentionally omitted |

---

## Theme System

| Feature | Status | Main Files | Notes |
|---------|--------|-----------|-------|
| Light mode default | ✅ LIVE | `src/app/globals.css` | `:root` variables |
| Dark mode manual toggle | ✅ LIVE | `src/context/ThemeContext.tsx` | `data-theme="dark"` attribute |
| Theme persisted in localStorage | ✅ LIVE | `ThemeContext.tsx` | key: `erp-theme` |
| CSS design tokens | ✅ LIVE | `globals.css` | Full variable set |
| Tailwind custom variant binding | ✅ LIVE | `globals.css` | `@custom-variant dark` |
| Theme toggle button | ✅ LIVE | `src/components/theme/` | In Topbar |

---

## Applicant Portal

| Feature | Status | Main Files | Notes |
|---------|--------|-----------|-------|
| Portal API (backend) | ✅ LIVE | `GET /api/applicant/portal` | Role-scoped to Applicant only |
| Portal page (frontend) | ✅ LIVE | `src/app/applicant/portal/` | Read-only dossier view |
| Stage progress display | ✅ LIVE | Portal page | Visual stage indicator |
| Document list with status | ✅ LIVE | Portal page | Secure download links |
| Invoice and receipt display | ✅ LIVE | Portal page | Read-only |
| Ledger balance display | ✅ LIVE | Portal page | Running balance |
| Document upload by applicant (portal) | ❌ FUTURE | Backend supports it; portal UI not wired | API allows it; portal button may not exist |
| Profile edit by applicant | ❌ FUTURE | Blocked at API level | By design: staff manages bio-data |

---

## Agent Portal

| Feature | Status | Main Files | Notes |
|---------|--------|-----------|-------|
| Agent-scoped applicant list | ✅ LIVE | `GET /api/applicants` | agentId enforced |
| Agent-scoped dashboard | ✅ LIVE | `GET /api/reports/dashboard` | |
| Agent-scoped commissions | ✅ LIVE | `GET /api/finance/commissions` | |
| Agent-scoped document upload | ✅ LIVE | `POST /api/applicants/[id]/documents` | |
| Dedicated Agent portal page | 🔶 PARTIAL | Uses standard staff sidebar, not a dedicated portal | Agent uses standard pages with scoped data |

---

## PDF Generation

| Feature | Status | Notes |
|---------|--------|-------|
| Invoice PDF | ❌ FUTURE | Browser print exists |
| Receipt voucher PDF | ❌ FUTURE | Browser print exists |
| Applicant dossier PDF | ❌ FUTURE | Not built |

---

## SMS / Email / WhatsApp

| Feature | Status | Notes |
|---------|--------|-------|
| Email notifications | ❌ FUTURE | SMTP vars in .env.example |
| SMS notifications | ❌ FUTURE | Twilio vars in .env.example |
| WhatsApp notifications | ❌ FUTURE | Not started |
