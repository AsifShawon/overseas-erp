# 03 — Role-Based Navigation

## Overview

Every user is assigned exactly one Role. Their role determines:
- Which sidebar navigation items they see
- Which pages they can access
- Which API operations they can perform
- Which records they can see (data boundaries)

The UI renders dynamically in either **Bangla (default)** or **English** based on the user's active runtime language toggle, which is persisted across sessions in `localStorage`. Regardless of the active display language, security permission checks and data boundaries remain strictly enforced in the backend database.

---

## Sidebar Navigation by Role

### Super Admin
**Sees all items:** Dashboard, Applicants, Job Orders, Agents, Documents, Accounts, Commissions, Receipts & Invoices, Reports, Notifications, Audit Logs, RBAC Settings

**Can do:** Everything in the system. Can override stage gates with remarks. Can manage roles and permissions.

**Cannot do:** Nothing is restricted.

**Daily workflow example:**
1. Open Dashboard — review pipeline KPIs and pending documents count
2. Check Audit Logs — review actions taken by staff overnight
3. Visit Applicants — review flagged pipeline issues
4. Go to Accounts — review financial totals and overdue invoices
5. Open RBAC Settings — adjust a staff member's permissions if needed

---

### Operations Admin
**Sees:** Dashboard, Applicants, Job Orders, Agents, Documents, Accounts, Commissions, Receipts & Invoices, Reports, Notifications, Audit Logs

**Cannot see:** RBAC Settings

**Can do:** Everything except manage role/permission configuration. Can override stage gates with remarks. Can create applicants, verify documents, manage agents.

**Cannot do:** Cannot access RBAC Settings or make financial payments directly (no RECORD_PAYMENT permission).

**Daily workflow example:**
1. Open Dashboard — review pipeline and financial overview
2. Visit Documents — verify pending documents
3. Visit Applicants — check pipeline and move stages where needed
4. Open Reports — generate and export CSV data for management review

---

### HR Officer
**Sees:** Dashboard, Applicants, Documents, Notifications

**Cannot see:** Job Orders (sidebar hidden), Agents, Accounts, Commissions, Receipts & Invoices, Reports, Audit Logs, RBAC Settings

**Can do:** Create and update applicants. Move workflow within HR stages (Applied, Interviewed, Selected). Upload documents for applicants.

**Cannot do:** Access financial data. Move workflow beyond Selected stage. View commissions, ledger, or audit logs.

**Daily workflow example:**
1. Open Dashboard — view HR-specific queue: Applied, Interviewed, Selected counts
2. Visit Applicants — register new candidates or update interview status
3. Move applicant from APPLIED → INTERVIEWED → SELECTED
4. Upload initial documents (passport, photo, CV) for selected candidates

---

### Documentation Officer
**Sees:** Dashboard, Applicants, Documents, Notifications

**Cannot see:** Job Orders, Agents, Accounts, Commissions, Receipts & Invoices, Reports, Audit Logs, RBAC Settings

**Can do:** Upload documents. Verify or reject uploaded documents. Move workflow within compliance stages (Medical Waiting, Medical Fit, Medical Unfit, Training Completed).

**Cannot do:** Create or update applicant bio-data. Access financial records. Move workflow into HR or Visa stages.

**Daily workflow example:**
1. Open Dashboard — view pending documents count and medical stage applicants
2. Visit Documents — review all pending verification documents
3. Open applicant dossier — verify passport or medical report
4. Move applicant from MEDICAL_WAITING → MEDICAL_FIT (once verified)

---

### Visa Officer
**Sees:** Dashboard, Applicants, Documents, Notifications

**Cannot see:** Agents, Accounts, Commissions, Receipts & Invoices, Reports, Audit Logs, RBAC Settings

**Can do:** Upload documents (visa sticker, air ticket). Move workflow within visa and logistic stages (Visa Submitted, Visa Stamped, Visa Rejected, Ticketed, Deployed).

**Cannot do:** Access financial records. Verify compliance documents (that is Documentation Officer's job). Move workflow into HR or compliance stages.

**Daily workflow example:**
1. Open Dashboard — view visa queue and passport expiry alerts
2. Visit Applicants — filter by VISA_SUBMITTED
3. Upload visa sticker once stamped
4. Move applicant: VISA_SUBMITTED → VISA_STAMPED
5. Upload air ticket once booked
6. Move applicant: VISA_STAMPED → TICKETED → DEPLOYED

---

### Accounts Officer
**Sees:** Dashboard, Applicants (read-only view), Accounts, Commissions, Receipts & Invoices, Notifications

**Cannot see:** Job Orders sidebar, Agents, Documents, Reports, Audit Logs, RBAC Settings

**Can do:** Create invoices for applicants (via applicant dossier). Record receipts. View general ledger. View and manage commissions (accrue and release payout). Export financial CSVs.

**Cannot do:** Move workflow stages. Upload or verify documents. Manage applicant bio-data. View audit logs or RBAC settings.

**Daily workflow example:**
1. Open Dashboard — review financial totals: invoiced, collected, outstanding, pending commissions
2. Visit Receipts & Invoices — find overdue invoices
3. Open applicant dossier — create invoice or record a new payment receipt
4. Visit Commissions — accrue commission for newly deployed candidates, or release payout

---

### Agent
**Sees:** Dashboard, Applicants (own candidates only), Documents (own candidates only), Commissions (own commissions only), Notifications

**Cannot see:** Job Orders, Agents, Accounts, Receipts & Invoices, Reports, Audit Logs, RBAC Settings

**Can do:** Register new applicants (automatically linked to own agent profile). Update their own candidates. Upload documents for their candidates. View their own commission records.

**Cannot do:** See other agents' candidates. Access any financial records. Move workflow stages. Verify documents. Access audit logs.

**Data boundary:** When an Agent queries applicants or commissions, the backend automatically enforces `agentId = agent.id` — they physically cannot retrieve other records.

**Daily workflow example:**
1. Open Dashboard — view own candidate totals and commission accrued vs paid
2. Visit Applicants — check status of submitted candidates
3. Upload a document (passport or photo) for a newly registered candidate
4. Visit Commissions — check if any commission has been accrued or paid

---

### Applicant
**Sees:** Portal page only (no staff sidebar)

The Applicant role does not use the standard staff sidebar. After login, they are automatically redirected to `/applicant/portal`.

**Can do:** View own profile, current stage, document statuses, invoices, receipts, and ledger entries.

**Cannot do:** Edit profile. Upload documents directly through the portal UI (document upload for applicants goes through staff or agent). Access any other applicant's data. Access any staff or financial management pages.

**Data boundary:** The applicant portal API (`GET /api/applicant/portal`) returns only the record where `Applicant.userId = logged-in userId`. No other records are accessible.

**Daily workflow example:**
1. Log in → redirected to applicant portal
2. View current workflow stage (e.g. VISA_SUBMITTED)
3. Check document statuses (verified, pending, rejected)
4. View invoice and payment receipt history
5. Review ledger balance

---

## Role × Navigation Matrix

Columns: Role  
Rows: Navigation modules  
Values: ✅ Full Access / 👁 View Only / 🔒 Own Only / ❌ Hidden

| Navigation Item | Super Admin | Ops Admin | HR Officer | Docs Officer | Visa Officer | Accounts Officer | Agent | Applicant |
|----------------|-------------|-----------|------------|--------------|--------------|-----------------|-------|-----------|
| Dashboard | ✅ Full | ✅ Full | ✅ HR view | ✅ Docs view | ✅ Visa view | ✅ Finance view | 🔒 Own | ❌ Portal only |
| Applicants | ✅ Full | ✅ Full | ✅ Create/Update | 👁 View | 👁 View | 👁 View | 🔒 Own | ❌ Portal only |
| Job Orders | ✅ Full | ✅ Full | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden |
| Agents | ✅ Full | ✅ Full | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden |
| Documents | ✅ Full | ✅ Verify | ✅ Upload | ✅ Verify | ✅ Upload | ❌ Hidden | 🔒 Own upload | ❌ Portal only |
| Accounts (Ledger) | ✅ Full | 👁 View | ❌ Hidden | ❌ Hidden | ❌ Hidden | ✅ Full | ❌ Hidden | ❌ Hidden |
| Commissions | ✅ Full | 👁 View | ❌ Hidden | ❌ Hidden | ❌ Hidden | ✅ Full | 🔒 Own view | ❌ Hidden |
| Receipts & Invoices | ✅ Full | 👁 View | ❌ Hidden | ❌ Hidden | ❌ Hidden | ✅ Full | ❌ Hidden | ❌ Hidden |
| Reports / Exports | ✅ Full | ✅ Full | ❌ Hidden | ❌ Hidden | ❌ Hidden | ✅ Finance | ❌ Hidden | ❌ Hidden |
| Notifications | ✅ All | ✅ All | ✅ Own | ✅ Own | ✅ Own | ✅ Own | 🔒 Own | 🔒 Own |
| Audit Logs | ✅ Full | 👁 View | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden |
| RBAC Settings | ✅ Full | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden |
| Applicant Portal | ❌ Staff only | ❌ Staff only | ❌ Staff only | ❌ Staff only | ❌ Staff only | ❌ Staff only | ❌ Staff only | ✅ Own only |

---

## Permission Codes Reference

| Permission Code | What It Grants |
|----------------|----------------|
| `VIEW_DASHBOARD` | Access to the dashboard page |
| `VIEW_APPLICANTS` | Access to applicant list and detail pages |
| `CREATE_APPLICANT` | Create new applicant records |
| `UPDATE_APPLICANT` | Update existing applicant bio-data |
| `ARCHIVE_APPLICANT` | Soft-archive and restore applicants |
| `TRANSITION_WORKFLOW` | Move an applicant between workflow stages |
| `UPLOAD_DOCUMENT` | Upload compliance documents for an applicant |
| `VERIFY_DOCUMENT` | Mark documents as Verified or Rejected |
| `MANAGE_AGENTS` | Create and manage agent profiles |
| `RECORD_PAYMENT` | Create invoices and record receipts |
| `VIEW_ACCOUNTS` | View ledger, invoices, and receipt records |
| `VIEW_COMMISSIONS` | View commission register (scoped for Agent) |
| `VIEW_REPORTS` | Access reports and export endpoints |
| `VIEW_AUDIT_LOGS` | View the audit log page and export |
| `MANAGE_RBAC` | Access RBAC Settings page |
| `VIEW_NOTIFICATIONS` | View in-app notifications |

---

## How Role Checking Works in Code

**Frontend (UI gating):**
```tsx
// Sidebar.tsx — link is hidden if user lacks permission
if (link.permission && !hasAccess(link.permission)) return null;

// Additional Agent-specific hiding
if (user.roleName === "Agent" && link.href === "/rbac") return null;
```

**Backend (API enforcement):**
```ts
// Every route handler does this first
const decoded = await authenticateRequest(request); // verify JWT
if (!decoded) return 401;

const permissions = await getUserPermissions(userId); // load from DB
if (!permissions.includes("REQUIRED_PERMISSION")) return 403;

// Data boundary for Agents
if (roleName === "Agent") {
  const agent = await prisma.agent.findUnique({ where: { userId } });
  where.agentId = agent.id; // enforced at query level
}
```
