# 14 — Demo Script for Client

This is a practical walkthrough for demonstrating OverseasERP to a client, investor, or business stakeholder. Follow the steps in order for a smooth, impressive demo.

**Setup before the demo:**
- Database seeded with demo data (`npm run db:seed`)
- Dev server running (`npm run dev`)
- Browser at http://localhost:3000

---

## Scene 1: Login as Super Admin

1. Open the browser at http://localhost:3000
2. You will be redirected to the login page
3. Enter credentials:
   - **Email:** admin@agency.com
   - **Password:** SuperAdmin@2026!
4. Click **Sign In**

**Talking point:** "The system uses secure JWT authentication with short-lived access tokens and a 7-day refresh token stored in an encrypted HttpOnly cookie. All login events are recorded in the audit log."

---

## Scene 2: The Dashboard

After login you land on the **Super Admin Dashboard**.

**Point out:**
- **Pipeline overview:** Total active applicants, archived, agents, job orders
- **Financial summary:** Total invoiced, total collected, total outstanding
- **Commission tracker:** Pending (accrued) vs paid commissions
- **Stage distribution:** Visual breakdown of candidates at each pipeline stage
- **Passport expiry alerts:** Top candidates with passports expiring within 6 months
- **Pending documents count:** How many documents need verification today
- **Recent audit log:** Live log of the last 10 system actions
- **Job orders table:** Current open orders with quota fill rate

**Talking point:** "Every role sees a different dashboard tailored to their job. An HR Officer sees interview queues. An Accounts Officer sees financial summaries. An Agent sees only their own candidates. The dashboard pulls live data directly from the PostgreSQL database."

---

## Scene 3: The Applicant List

1. Click **Applicants** in the sidebar
2. Show the list with applicant names, passport numbers, stage badges, and trade categories
3. Use the **Search** box — type a name or passport number to filter results
4. Use the **Stage filter** — select "VISA_SUBMITTED" to see candidates in the visa queue
5. Use the **Trade filter** — select "Electrician" or another trade
6. Toggle **Show Archived** to show soft-archived candidates

**Talking point:** "The system supports full-text search across name, passport number, and phone. All filtering happens server-side for performance. The agent boundary is enforced at the database level — when an Agent logs in, they can only see their own candidates."

---

## Scene 4: Create a New Applicant

1. Click **New Applicant**
2. Fill in the form:
   - Full Name: Demo Candidate
   - Passport No: AB9999999
   - Passport Expiry: pick a date 2 years out
   - Date of Birth: pick any date
   - Phone: +8801700000000
   - Trade: Electrician
3. Click **Create Applicant**

**Talking point:** "The system validates the passport number for uniqueness — no duplicate candidates can exist. A full audit log entry is created immediately upon registration."

---

## Scene 5: Open the Applicant Dossier

1. Click on the newly created applicant (or any seeded applicant with rich data)
2. Scroll through the dossier:
   - **Bio section:** Full profile, passport expiry, linked agent, job order
   - **Workflow history:** Timeline of all stage changes with who made each change and when
   - **Documents panel:** All uploaded documents with status badges (VERIFIED, PENDING, etc.)
   - **Finance panel:** Invoices with outstanding amounts, receipts, and ledger entries

**Talking point:** "This is the candidate's full digital dossier — everything from their passport to their payment history in one place. Any user who has access can see the complete history without calling another department."

---

## Scene 6: Move a Workflow Stage

1. On the applicant dossier, find the **Move Stage** button or workflow panel
2. Select a valid next stage (e.g. APPLIED → INTERVIEWED)
3. Add remarks if prompted
4. Click **Move**

Now demonstrate a **stage gate:**
1. Try to move an applicant to MEDICAL_FIT without a verified MEDICAL_REPORT
2. The system will return an error: "MEDICAL_REPORT must be uploaded and verified..."

**Talking point:** "Stage gates are enforced server-side — not just in the UI. A clever user cannot bypass them by calling the API directly. Admins can override gates but must provide written justification that is recorded in the audit log."

---

## Scene 7: Upload and Verify a Document

1. In the document panel, click **Upload Document**
2. Select type: **PASSPORT**
3. Upload any PDF or JPG file
4. Click **Upload**

Document appears with status: **PENDING VERIFICATION**

Now verify it:
1. Click **Verify** on the document
2. Document status changes to: **VERIFIED**
3. Check the audit log — UPLOAD_DOCUMENT and VERIFY_DOCUMENT entries appear

**Talking point:** "Documents are stored securely on the server — not in a public folder. Only authenticated users can download them through a protected API endpoint. The verification chain is complete: who uploaded it, when, who verified it, and when."

---

## Scene 8: Issue an Invoice

1. In the Finance section of the applicant dossier, click **Issue Invoice**
2. Enter:
   - Amount: 85,000
   - Due Date: pick a date
   - Description: Processing and documentation fee
3. Click **Create Invoice**

Invoice appears with status: **DUE** and outstanding = 85,000

**Talking point:** "Every invoice automatically creates a ledger entry. The running balance updates instantly."

---

## Scene 9: Record a Receipt

1. Click **Record Receipt** in the dossier
2. Select the invoice you just created
3. Enter:
   - Amount Paid: 50,000
   - Payment Method: Bank Transfer
   - Reference: TXN-2026-001
4. Click **Record**

Invoice status changes to: **PARTIAL** (outstanding = 35,000)
A ledger entry appears for the receipt.

**Talking point:** "The ledger automatically tracks partial payments. The running balance decreases with each payment. When the outstanding balance reaches zero, the invoice is automatically marked as PAID."

---

## Scene 10: Show the Accounts Ledger

1. Navigate to **Accounts** in the sidebar
2. Show the general ledger table:
   - INVOICE rows (debit) in one color
   - RECEIPT rows (credit) in another
   - Running balance column
3. Show the summary stats: Total Billed, Collected, Outstanding

**Talking point:** "This is the full double-entry ledger for all candidates. Accounts Officers can filter by applicant, invoice number, or receipt number. The ledger is append-only — no entries can be deleted or modified."

---

## Scene 11: Show Commissions

1. Navigate to **Commissions** in the sidebar
2. Show the commission register: agent, candidate, job order, amount, status
3. Show stats: Total Accrued, Total Paid, Total Pending
4. Click **Accrue Commission** → fill in agent, applicant, job order, amount → submit
5. Commission appears as ACCRUED
6. Click **Release Payout** → enter bank reference → submit
7. Commission status changes to PAID

**Talking point:** "The system enforces a unique commission per agent per candidate — no accidental double-payments. The payout reference is recorded for bank reconciliation."

---

## Scene 12: Show Audit Logs

1. Navigate to **Audit Logs** in the sidebar
2. Show the log entries from the actions just performed:
   - LOGIN_SUCCESS
   - CREATE_APPLICANT
   - UPDATE_APPLICANT
   - TRANSITION_STAGE (with before/after stage in delta)
   - UPLOAD_DOCUMENT
   - VERIFY_DOCUMENT
   - CREATE_INVOICE
   - RECORD_RECEIPT
   - ACCRUE_COMMISSION
   - PAYOUT_COMMISSION

**Talking point:** "Every action in the system is recorded with: who did it, what role they had, which record was affected, what changed (before/after), and their IP address. This is your compliance trail."

---

## Scene 13: Show Notifications

1. Navigate to **Notifications** in the sidebar
2. Show the notifications generated from the demo actions:
   - "Your application stage has been updated..."
   - "A new PASSPORT document has been uploaded..."
   - "You have a new invoice..."
3. Click **Mark All Read**

---

## Scene 14: Export CSV

1. Navigate to **Reports** in the sidebar
2. Click **Export Applicants CSV**
3. File downloads automatically
4. Open in Excel — show the data with columns, UTF-8 encoding

**Talking point:** "Every major data entity can be exported to CSV with one click. The files include a UTF-8 BOM so they open correctly in Microsoft Excel without encoding issues."

---

## Scene 15: Archive and Restore an Applicant

1. Go back to the applicant dossier
2. Click **Archive**
3. Confirm in the dialog
4. Applicant disappears from the main list
5. Toggle "Show Archived" on the Applicants page
6. Find the archived applicant (shown with archive badge)
7. Click **Restore**
8. Applicant returns to the active list — all their data is preserved

**Talking point:** "Soft archiving removes candidates from the active pipeline without deleting their records. All financial history, documents, and workflow history are preserved. This is important for legal and audit reasons."

---

## Scene 16: Login as Agent (Scoped View)

1. Click your profile name or logout → click Logout
2. Login with: agent@agent.com / AgentKabir@2026!
3. Notice: the sidebar shows only Dashboard, Applicants, Documents, Commissions, Notifications — no financial pages, no audit logs
4. Navigate to Applicants — only the agent's own candidates appear
5. Navigate to Commissions — only the agent's own commissions appear
6. Try to access `/accounts` directly in the URL bar — the system returns Forbidden

**Talking point:** "Agents have a completely scoped view. They see their candidates, their commissions, and nothing else. The scoping is enforced at the database query level — they physically cannot retrieve another agent's records."

---

## Scene 17: Login as Applicant (Self-Service Portal)

1. Logout → Login with: applicant@applicant.com / Applicant@2026!
2. System automatically redirects to /applicant/portal (not the staff dashboard)
3. Show the portal: name, current stage indicator, documents with statuses, invoices, payment receipts, ledger balance
4. Notice: no sidebar for staff navigation
5. Try to access `/applicants` — the system redirects to the portal

**Talking point:** "Applicants have their own self-service portal where they can see their recruitment progress in real time. They don't need to call the agency to ask about their visa status or document verification — they can see it here."

---

## Demo Summary

In this demo you saw:
- ✅ Secure JWT authentication with role-based redirects
- ✅ Role-tailored dashboards with live database data
- ✅ Applicant creation, listing, and full dossier view
- ✅ Workflow stage transitions with stage gate enforcement
- ✅ Document upload, verification, and secure download
- ✅ Invoice creation, receipt recording, and double-entry ledger
- ✅ Commission accrual and payout
- ✅ Complete audit trail with before/after deltas
- ✅ CSV data exports
- ✅ Soft archive and restore
- ✅ Agent-scoped view (data boundaries enforced at DB level)
- ✅ Applicant self-service portal

**This is a working MVP with real PostgreSQL data, real authentication, and real access control — not a prototype or mockup.**
