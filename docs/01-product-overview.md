# 01 — Product Overview

## What Is VisaTek ERP?

**VisaTek ERP** is a full-stack web application designed for overseas manpower recruitment agencies in Bangladesh. It replaces spreadsheets, paper trails, and disconnected tools with a single integrated platform that manages every stage of the recruitment-to-deployment lifecycle.

The system features a **Bangla-First** design pattern, ensuring that the entire interface is optimized for Bangladeshi recruitment agency operations by default, with a dynamic runtime switch to English.

The system is built as an enterprise-grade solution with real database connections, authentication, dynamic role-based access control, document management, financial accounting, and audit logging — all working live.

---

## Business Problem It Solves

Overseas manpower recruitment involves many departments, external agents, and government compliance requirements. Without a unified system, agencies suffer from:

- Candidates tracked in Excel with no stage history
- Documents stored on local drives with no verification trail
- Agent commissions calculated manually with no formal records
- Invoices and receipts managed in disconnected accounting tools
- No audit log of who changed what and when
- Staff accessing data they shouldn't see
- No self-service portal for agents or placed candidates

**VisaTek ERP** solves all of this in one system.

---

## Target Users

### Super Admin
The system owner or agency director. Has unrestricted access to every module. Can override workflow stage gates with justification remarks. Manages users, roles, and permissions via the RBAC Settings module.

**Example:** Agency director who wants to see the complete pipeline, financial summaries, and audit trail.

### Operations Admin
The day-to-day agency manager. Nearly identical permissions to Super Admin except they cannot manage RBAC settings or make financial payments directly. They oversee the entire pipeline and can generate reports and exports.

**Example:** Branch manager who reviews pending work across all departments.

### HR Officer
Handles applicant intake and early recruitment. Creates applicant records, conducts or records interviews, and selects candidates for job orders. Can only move workflow stages within early recruitment stages (Applied → Interviewed → Selected).

**Example:** Recruiter who registers new candidates, schedules interviews, and shortlists them for a job order.

### Documentation Officer
Manages compliance documents and pre-departure health requirements. Verifies uploaded documents (passport, medical report, police clearance). Can move workflow within medical and training stages (Medical Waiting → Medical Fit / Unfit → Training Completed).

**Example:** Compliance officer who confirms medical reports and approves candidates to proceed.

### Visa Officer
Manages embassy submissions and visa logistics. Can move workflow within visa and departure stages (Visa Submitted → Visa Stamped / Rejected → Ticketed → Deployed). Uploads visa stickers and air tickets.

**Example:** Consular affairs officer who tracks visa outcomes and books flight tickets.

### Accounts Officer
Manages all financial records. Creates invoices per applicant, records receipts, reviews the ledger, accesses commissions, and generates financial exports. Cannot move workflow stages or upload compliance documents.

**Example:** Finance staff who bills candidates and records their payments.

### Agent
External recruitment partner with a scoped view. Can only see and manage their own sourced candidates. Can upload documents for their candidates and view their own commission records. Cannot see other agents' data, financial records, or RBAC settings.

**Example:** Third-party recruiter in a regional city who sends candidates to the agency.

### Applicant
Placed candidate with a self-service portal. Can view their own profile, current stage, documents, invoices, and receipts. Cannot edit their own record or access any staff data.

**Example:** A candidate who wants to check their visa status or download their medical report receipt.

---

## Main Business Journey

```
1. Applicant Sourced
   An agent submits a candidate OR HR Officer registers a walk-in candidate.
   Candidate profile created with passport, phone, trade, and bio-data.

2. Applicant Vetted (HR Stage)
   HR Officer records interview results.
   Candidate moved: APPLIED → INTERVIEWED → SELECTED
   Linked to a Job Order (employer, country, quota).

3. Documents Uploaded (Documentation Stage)
   Documentation Officer or Agent uploads required documents:
   - Passport copy
   - Photo, CV, Police Clearance
   - Medical Report (after medical check)
   Each document lands in PENDING_VERIFICATION status.
   Documentation Officer verifies or rejects documents.

4. Workflow Advances Through Stage Gates
   Stage transitions enforce document prerequisites:
   - MEDICAL_FIT requires: verified MEDICAL_REPORT
   - VISA_SUBMITTED requires: verified PASSPORT
   - VISA_STAMPED requires: verified VISA_STICKER
   - TICKETED requires: verified AIR_TICKET
   - DEPLOYED requires: all four verified

5. Invoices and Receipts (Accounts Stage)
   Accounts Officer creates invoice(s) for the candidate.
   As candidate pays, receipts are recorded.
   Each invoice/receipt creates a ledger entry (debit/credit).
   Invoice outstanding balance updates automatically.

6. Commission Accrued and Paid
   When a candidate is DEPLOYED, commission is accrued for the linked agent.
   Accounts Officer releases payment and records payout reference.

7. Reporting and Audit
   Super Admin / Operations Admin view:
   - Stage distribution (pipeline health)
   - Financial totals (invoiced, collected, outstanding)
   - Commission totals (accrued vs paid)
   - Audit log of every action
   - Passport expiry alerts
   - CSV exports for all modules
```

---

## What Makes This ERP Presentable as an MVP

- **Bangla-First default UI** with dynamic, real-time English runtime toggle and localStorage persistence
- **All core modules are functional end-to-end** with real database data
- **JWT authentication** with access + refresh token architecture
- **Dynamic RBAC** pulled from the database at login — permissions are not hardcoded per user
- **Stage-gate enforcement** at the API level — no role can bypass document prerequisites without an admin override with remarks
- **Audit logs** are automatically written for every mutation (create applicant, transition stage, upload document, record receipt, accrue commission, archive)
- **Notifications** are automatically created on key events (stage change, document upload, new invoice)
- **Soft archive** preserves all financial records while hiding candidates from the active pipeline
- **CSV export** for every major data entity
- **Applicant portal** — candidates can log in and view their own dossier
- **Agent scoped view** — agents only see their own candidates and commissions
- **Role-specific dashboards** — each role sees tailored KPIs and action queues
- **Light/dark theme** with CSS variable design tokens — consistent across all pages
