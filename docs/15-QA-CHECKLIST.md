# 15 — QA Checklist

This checklist covers every module and scenario that should be tested before a release or demo. Check each item manually.

**Legend:**
- `[ ]` — Not tested
- `[x]` — Passed
- `[!]` — Failed / Issue found

---

## 1. Auth Module

### Login
- [ ] Valid credentials → login succeeds and redirects to /dashboard
- [ ] Invalid email → 401 error message displayed
- [ ] Invalid password → 401 error message displayed
- [ ] Deactivated account (`isActive=false`) → 401 with "deactivated" message
- [ ] Empty email/password → validation error before API call
- [ ] Applicant login → redirects to /applicant/portal (not /dashboard)

### Session Management
- [ ] After login, access token is in memory (not in localStorage or cookies)
- [ ] Refresh token cookie exists (check DevTools → Application → Cookies → refreshToken)
- [ ] Refresh token cookie is HttpOnly (cannot be accessed via JavaScript)
- [ ] After page refresh, session is restored via silent refresh
- [ ] After 15+ minutes of inactivity, access token expires but refresh restores it automatically
- [ ] After logout, refresh token cookie is cleared
- [ ] After logout, navigating to /dashboard redirects to /login

---

## 2. RBAC Module

### Permission Gates (Frontend)
- [ ] Super Admin sees all 12 sidebar items
- [ ] HR Officer does NOT see: Job Orders, Agents, Accounts, Commissions, Receipts & Invoices, Reports, Audit Logs, RBAC Settings
- [ ] Accounts Officer does NOT see: Documents, Audit Logs, RBAC Settings
- [ ] Agent does NOT see: Job Orders, Agents, Accounts, Receipts & Invoices, Reports, Audit Logs, RBAC Settings
- [ ] Applicant sees no sidebar (portal only)

### Permission Gates (Backend)
- [ ] Call GET /api/applicants without token → 401
- [ ] Call GET /api/applicants with Applicant token → 403
- [ ] Call GET /api/accounts/ledger with Agent token → 403
- [ ] Call GET /api/accounts/ledger with Applicant token → 403
- [ ] Call POST /api/applicants/[id]/workflows with Agent token → 403
- [ ] Call PATCH /api/applicants/[id] with Applicant token → 403

---

## 3. Applicants Module

### Listing
- [ ] List loads with pagination (10 per page default)
- [ ] Search by name finds correct applicants
- [ ] Search by passport number finds correct applicants
- [ ] Filter by stage shows only applicants at that stage
- [ ] Filter by trade shows only correct trade applicants
- [ ] Show Archived toggle shows archived applicants only
- [ ] Hide Archived (default) shows only isArchived=false applicants

### Agent Boundary
- [ ] Logged in as Agent → applicant list shows ONLY own candidates
- [ ] Logged in as Agent → try to open another agent's applicant by URL → 403
- [ ] Logged in as Agent → New Applicant → applicant is auto-linked to agent's ID

### Creation
- [ ] Create applicant with all required fields → success
- [ ] Create applicant with duplicate passport number → error message "already exists"
- [ ] Create applicant missing required fields → Zod validation error
- [ ] Created applicant appears in list with stage: APPLIED

### Edit
- [ ] Open applicant dossier → edit phone number → save → change reflected
- [ ] Edit with duplicate passport number → error
- [ ] Applicant role trying to edit → blocked

---

## 4. Workflow Module

### Stage Transitions
- [ ] HR Officer: APPLIED → INTERVIEWED → works
- [ ] HR Officer: APPLIED → VISA_SUBMITTED → blocked (403 or 400)
- [ ] Documentation Officer: SELECTED → MEDICAL_WAITING → works
- [ ] Documentation Officer: SELECTED → DEPLOYED → blocked
- [ ] Visa Officer: TRAINING_COMPLETED → VISA_SUBMITTED → works (if PASSPORT verified)
- [ ] Accounts Officer: any transition → blocked

### Stage Gates
- [ ] Try MEDICAL_FIT without verified MEDICAL_REPORT → 400 with clear error
- [ ] Try VISA_SUBMITTED without verified PASSPORT → 400 with clear error
- [ ] Try VISA_STAMPED without verified VISA_STICKER → 400 with clear error
- [ ] Try TICKETED without verified AIR_TICKET → 400 with clear error
- [ ] Try DEPLOYED without all 4 docs verified → 400 with clear error

### Admin Override
- [ ] Super Admin: try gate-blocked transition without remarks → 400 (must provide remarks)
- [ ] Super Admin: gate-blocked transition with remarks → succeeds
- [ ] Audit log shows overrideUsed: true and missingPrerequisites in delta

### Post-Transition
- [ ] WorkflowHistory record created with correct oldStage, newStage, changedById
- [ ] AuditLog created with TRANSITION_STAGE action and before/after delta
- [ ] Notification created for linked applicant user (if linked)
- [ ] Notification created for linked agent user (if agent linked)

---

## 5. Documents Module

### Upload
- [ ] Upload PDF → success
- [ ] Upload JPG → success
- [ ] Upload PNG → success
- [ ] Upload file over 5MB → error "exceeds 5MB limit"
- [ ] Upload unsupported type (e.g. .docx) → error "invalid file type"
- [ ] Uploaded document appears with status: PENDING_VERIFICATION

### Verification
- [ ] Documentation Officer: verify document → status changes to VERIFIED
- [ ] Documentation Officer: reject document → status changes to REJECTED with remarks
- [ ] HR Officer: try to verify document → blocked (no VERIFY_DOCUMENT permission)
- [ ] Agent: try to verify → blocked

### Secure Download
- [ ] Staff user: click download → file downloads
- [ ] Agent: download own candidate's document → success
- [ ] Agent: download another agent's candidate document → 403
- [ ] Applicant: download own document via portal → success
- [ ] Unauthenticated: access download URL directly → 401

### Audit and Notifications
- [ ] UPLOAD_DOCUMENT audit log created
- [ ] VERIFY_DOCUMENT audit log created
- [ ] Notification created for Super Admin, Ops Admin, Docs Officer on upload

---

## 6. Finance Module

### Invoices
- [ ] Create invoice for applicant → INV-YYYY-XXXXX number generated
- [ ] Invoice appears in dossier and on Receipts & Invoices page
- [ ] Invoice status: DUE (outstanding = amount)
- [ ] LedgerEntry created: type=INVOICE, debit=amount
- [ ] AuditLog created: CREATE_INVOICE
- [ ] Notification created for linked applicant user

### Receipts
- [ ] Record receipt → REC-YYYY-XXXXX number generated
- [ ] Receipt updates Invoice.outstanding (decreases by amount paid)
- [ ] Receipt invoice status: PARTIAL (if not fully paid)
- [ ] Receipt invoice status: PAID (if fully paid, outstanding = 0)
- [ ] LedgerEntry created: type=RECEIPT, credit=amountPaid, running balance decreases
- [ ] AuditLog created: RECORD_RECEIPT
- [ ] Notification created for linked applicant user

### Ledger
- [ ] GET /api/accounts/ledger returns all entries
- [ ] Stats: totalBilled = sum of all Invoice.amount
- [ ] Stats: totalCollected = sum of all Receipt.amountPaid
- [ ] Stats: totalOutstanding = sum of all Invoice.outstanding
- [ ] Running balance is correct per applicant
- [ ] Agent and Applicant roles blocked from ledger

---

## 7. Commissions Module

### Accrue
- [ ] Accrue commission for a deployed applicant → Commission created (ACCRUED)
- [ ] Try to accrue same commission twice → error (unique constraint)
- [ ] AuditLog created: ACCRUE_COMMISSION

### Payout
- [ ] Release payout with bank reference → Commission status changes to PAID
- [ ] payoutRef and payoutDate saved correctly
- [ ] AuditLog created: PAYOUT_COMMISSION

### Scoping
- [ ] Agent: views commissions → only own commissions visible
- [ ] Agent: filter by agentId (another agent) → returns only own (ignored)
- [ ] Applicant: accesses commissions → 403

---

## 8. Dashboard Module

### Role-Specific Data
- [ ] Super Admin dashboard: all KPIs and job orders visible
- [ ] HR Officer dashboard: only HR metrics visible (no financial data)
- [ ] Documentation Officer: only compliance metrics visible
- [ ] Visa Officer: only visa metrics visible
- [ ] Accounts Officer: only financial metrics visible
- [ ] Agent: only own candidates and commissions visible
- [ ] Applicant: redirected away from dashboard → 403 from API

### Data Accuracy
- [ ] Active applicant count = actual count in DB with isArchived=false
- [ ] Total invoiced = actual sum of Invoice.amount
- [ ] Pending documents count = actual count with PENDING_VERIFICATION

---

## 9. Exports Module

- [ ] Export Applicants CSV → file downloads, opens in Excel without encoding issues
- [ ] Export Invoices CSV → correct columns and data
- [ ] Export Receipts CSV → correct columns and data
- [ ] Export Ledger CSV → correct columns and data
- [ ] Export Commissions CSV → correct columns and data
- [ ] Export Audit Logs CSV → correct columns and data (VIEW_AUDIT_LOGS required)
- [ ] Agent tries to access export → 403
- [ ] CSV injection test: if applicant name starts with `=` → prefixed with `'`
- [ ] UTF-8 BOM present (Excel opens without Chinese/Arabic character issues)

---

## 10. Theme Module

- [ ] Page loads in light mode by default
- [ ] Toggle to dark mode → all pages switch instantly
- [ ] Refresh page in dark mode → dark mode persists (from localStorage)
- [ ] Input fields, selects, dropdowns styled correctly in dark mode
- [ ] Sidebar, topbar, cards, tables all look correct in dark mode
- [ ] Sidebar active state (selected nav item) visible in both modes

---

## 11. Archive Module

- [ ] Archive applicant → disappears from default list
- [ ] Archived applicant appears when "Show Archived" toggled
- [ ] Restore applicant → reappears in main list
- [ ] All financial records preserved after archive/restore
- [ ] AuditLog created: ARCHIVE_APPLICANT
- [ ] AuditLog created: RESTORE_APPLICANT (on restore)

---

## 12. Agent Scope Tests

- [ ] Agent login → applicant list shows ONLY own candidates (count matches agent's applicants)
- [ ] Agent creates applicant → agentId auto-set to own agent ID (cannot override)
- [ ] Agent tries to update another agent's applicant by URL → 403
- [ ] Agent tries to upload document for another agent's applicant → 403
- [ ] Agent views commissions → only own commissions
- [ ] Agent tries to access /accounts → 403 or redirected
- [ ] Agent tries to access /audit-logs → sidebar link hidden; direct URL → 403

---

## 13. Applicant Portal Scope Tests

- [ ] Applicant login → redirected to /applicant/portal
- [ ] Portal loads own profile, stage, documents, invoices, receipts, ledger
- [ ] Applicant tries to access /applicants → 403 or redirect
- [ ] Applicant tries to access /accounts → 403 or redirect
- [ ] Applicant tries to PATCH own applicant record → 403
- [ ] Document file paths in portal are secure download URLs (not raw storage paths)
- [ ] Applicant downloads own document → success
- [ ] Another applicant's document download URL → 403

---

## 14. Negative Tests

- [ ] API calls without Authorization header → 401 for all protected routes
- [ ] API calls with expired access token → 401
- [ ] API calls with tampered JWT (invalid signature) → 401
- [ ] POST /api/applicants with XSS in fullName → sanitized/stored safely (no script execution)
- [ ] POST /api/applicants/[id]/documents with path traversal in filename → sanitized (no `../`)
- [ ] Large payload in request body → handled gracefully (no crash)
- [ ] SQL injection in search query → Prisma parameterizes queries, no injection possible

---

## 15. Build and Deployment Tests

- [ ] `npm run build` completes without errors
- [ ] `npm run start` serves the built app correctly
- [ ] All API routes respond in production build
- [ ] `npm run lint` passes without errors
- [ ] Environment variables are all set (no undefined secrets)
- [ ] Database connection works in production environment
- [ ] HttpOnly cookie `Secure: true` in production (NODE_ENV=production)
- [ ] HTTPS enforced in production (cookie will not work over HTTP with Secure=true)

---

## 16. i18n & Bangla-First Localization

### Locale Default and Dynamic Switching
- [ ] Clear localStorage → App loads fully in Bangla (`bn`) by default
- [ ] Switch to English via Topbar toggle → Interface shifts to English instantly without page reload
- [ ] Inspect `<html>` node in Bangla mode → dynamically shows `<html lang="bn-BD">`
- [ ] Inspect `<html>` node in English mode → dynamically shows `<html lang="en">`
- [ ] Select English → Refresh page → Interface remains in English (persisted in `localStorage`)
- [ ] Select Bangla → Refresh page → Interface remains in Bangla (persisted in `localStorage`)

### System Coexistence
- [ ] Toggle theme (Light/Dark) → Language selection does not reset or alter
- [ ] Toggle language → Active theme does not reset or alter
- [ ] Log out → Log back in → Language preference persists across the auth session boundary
- [ ] Switch demo roles via switcher → Active language preference remains intact

### Visual & Layout QA (Bangla Mode)
- [ ] Card sizes and modal windows do not overflow or experience text clipping
- [ ] Dynamic table columns containing Bangla names wrap cleanly and maintain proportional widths
- [ ] Vertically tall Bangla conjunct characters (like `ক্ষ`, `স্ত`, `শৃঙ্খল`) are fully legible with no clipping in headers, buttons, or list items
- [ ] Buttons containing localized actions (e.g. `সংরক্ষণ করুন`, `বাতিল`) do not warp or overlap surrounding components
- [ ] Status badges fit properly inside tables and dashboards without breaking column alignment
- [ ] Dropdowns and `<select>` fields remain legible with correct padding

### Data Integrity & Numerals Formatting
- [ ] Passport numbers remain in standard Latin numerals (e.g. `EG123456`) in both language modes
- [ ] Phone numbers remain in standard Latin digits (e.g. `+88017...`) in both language modes
- [ ] National Identity (NID) numbers remain in standard Latin digits in both language modes
- [ ] Financial invoice/receipt/transaction IDs remain in Latin text/numbers to maintain system searchability
- [ ] Currency values are formatted properly according to locale context (e.g. `SAR 5,000` or `BDT 85,000` inside finance lists)

### Localized Subpages & Exports
- [ ] Access Denied page (`/denied`) is fully translated in both Bangla and English
- [ ] Applicant self-service portal (`/applicant/portal`) shows proper greetings and fully translated checklists/invoices
- [ ] CSV Export buttons display correct localized labels
- [ ] Exported CSVs maintain clean database strings (untouched enums and Latin numerals) so Excel doesn't break encoding or parsing

