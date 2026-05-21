# Core Module List & Specifications

This document details the 12 core modules of the Overseas Manpower ERP. Each section outlines the module's key features, internal workflows, and strict acceptance criteria to guide frontend layout and backend testing.

---

## 1. Dashboard Module

### Features
* **Role-Specific Analytics Widgets**:
  - *Super Admin & Operations Admin*: High-level pipeline stats (total candidates, medical-pending, visa-pending, deployed counts), revenue collections vs outstanding receivables, and top-performing agents.
  - *HR Officer*: Scheduled interviews calendar, pending pre-selection approvals, active Job Order vacancy statuses.
  - *Documentation Officer*: Passports awaiting verification, candidates with pending medical checkup logs, expiring documents.
  - *Visa Officer*: Consulate slot calendars, counts of visas stamped today, visas pending stampings.
  - *Accounts Officer*: Cash-in-hand balance, bank transaction logs, invoices due this week, pending commission releases.
  - *Agent*: Number of active applicants submitted, recent commission credit notices, pending doc uploads.
  - *Applicant*: Stage tracker (stepper bar), notification carousel, download links for receipts.

### Acceptance Criteria
* **AC 1.1**: The landing view must load within 1.5s and render custom cards based *exclusively* on the authenticated user's JWT role.
* **AC 1.2**: No role must see analytic cards belonging to another role (e.g., Applicants must never see total revenue cards).

---

## 2. Applicant Management Module

### Features
* **Profile Generation**: Personal details (name, national ID, phone, DOB), emergency contacts, educational background, work experience, trade/skills.
* **Passport Registry**: Passport number, issue date, expiry date, place of issue, digital scans.
* **Job Order Allocation**: Ability for HR Officer to bind an applicant to a specific vacancy under an active Job Order.

### Acceptance Criteria
* **AC 2.1**: Passport numbers must be uniquely validated in the database to prevent duplicate candidate creation.
* **AC 2.2**: Agents can only write and read candidate profiles they have created. They cannot access candidates registered by other agents or direct walk-ins.
* **AC 2.3**: Fields representing official workflow status (e.g., Medical Fit) must be read-only in this module.

---

## 3. Applicant Workflow Tracking Module

### Features
* **Technical Enums vs. UI Labels**: Keep strict database-side workflow enums for operational logic, but map them to friendly UI display labels for dashboard steppers and portals:
  - `APPLIED` ➔ "Application Submitted"
  - `INTERVIEWED` ➔ "Interview Completed"
  - `SELECTED` ➔ "Candidate Selected"
  - `MEDICAL_WAITING` ➔ "Pending Medical Appointment"
  - `MEDICAL_FIT` ➔ "Medical Clearance Passed"
  - `MEDICAL_UNFIT` ➔ "Medical Unfit (Halted)"
  - `TRAINING_COMPLETED` ➔ "Pre-Departure Training Completed"
  - `VISA_SUBMITTED` ➔ "Visa Submission Sent"
  - `VISA_STAMPED` ➔ "Visa Sticker Stamped"
  - `VISA_REJECTED` ➔ "Visa Declined (Halted)"
  - `TICKETED` ➔ "Flight Ticket Issued"
  - `DEPLOYED` ➔ "Candidate Deployed"

### Acceptance Criteria
* **AC 3.1**: Transitions must fail if required preceding steps are incomplete (e.g. cannot transition to `TICKETED` if candidate is `VISA_REJECTED` or has not undergone `MEDICAL_FIT`).
* **AC 3.2**: Status changes must auto-trigger database hooks to log state transitions in the Audit Log and create user Notifications.
* **AC 3.3**: The UI stepper must dynamically translate the backend enum value into its associated friendly UI display label.

---

## 4. Agent Management Module

### Features
* **Agent Onboarding**: Register external recruiting agents with business name, license numbers, contact details, and bank account settings.
* **Agent Classification**: Assign agents to tiers (e.g., Tier A, Tier B) which determines their baseline commissions.
* **Performance Dashboard**: Real-time summary of an agent's placement speed, interview selection rates, and cumulative commissions earned.

### Acceptance Criteria
* **AC 4.1**: Agents must be registered with active/inactive flags. If deactivated, the agent and all linked accounts are immediately barred from logging in or submitting applicants.
* **AC 4.2**: Operations Admin and Super Admin alone can edit Agent commission rates and tiers.

---

## 5. Accounts and Payments Module

### Features
* **Candidate Ledgers**: Double-entry ledger assigned to each candidate, tracking exact receivables (what the candidate owes the agency for services/flight) and payables/collections.
* **Payment Entry**: Accounts Officer inputs payments received via cash, cheque, or electronic bank transfer.
* **Refund Ledger**: Mechanism to process refunds if a candidate's visa is rejected or they withdraw post-payment.
* **Permanent Auditable Immutability**: No hard deletions of candidates are permitted. If an applicant drops out, they are flagged with `isArchived: true` (Soft Archived). All linked invoices, receipts, and ledger items remain untouched, preserving the company's financial records.

### Acceptance Criteria
* **AC 5.1**: Candidate financial transactions must use database Transactions. The candidate's `LedgerBalance` must update automatically when a payment entry is saved.
* **AC 5.2**: Accounts records are immutable. Mistakes must be resolved with matching adjustment entries (Credit/Debit Notes) with comments. Deletions are forbidden.
* **AC 5.3**: Database constraints must prevent any cascade deletions of candidates from triggering the deletion of linked financial rows (`Invoice`, `Receipt`, `LedgerEntry`, `Commission`).

---

## 6. Commission Management Module

### Features
* **Commission Matrix**: Rule engine calculating commission amounts per placed candidate based on the Job Order contract terms and Agent's tier.
* **Accrual Logic**: Auto-accrues agent commission when candidate status transitions to `VISA_STAMPED`.
* **Payout Ledger**: Accounts Officer records payouts to agents, referencing bank transfer references or cheque numbers.

### Acceptance Criteria
* **AC 6.1**: Commissions can only accrue if candidate is formally mapped to both an Agent and a Job Order.
* **AC 6.2**: Paid commission entries must deduct from the agent's outstanding payable balance inside the Agent financial profile in real-time.

---

## 7. Document Management Module

### Features
* **Secure Vault**: Digital storage for Passports, Medical Fit reports, Police Clearances, Visa stickers, and Airline tickets.
* **Status Checklist**: File verification states (`PENDING`, `VERIFIED`, `EXPIRED`, `REJECTED`).
* **Document Expiry Engine**: Daemon/cron tracker warning officers of passports expiring in < 6 months.

### Acceptance Criteria
* **AC 7.1**: Files must be stored securely (using AWS S3, local storage, or equivalent cloud storage) and retrieved using temporary pre-signed URLs to prevent hotlinking.
* **AC 7.2**: Applicants can only view their own uploaded files and upload files that are flagged with a `PENDING_UPLOAD` status.

---

## 8. Receipts and Invoices Module

### Features
* **Auto-Invoice Engine**: Generates PDF invoices automatically when a candidate is `SELECTED` and bound to a Job Order contract structure.
* **Serial Receipt Generator**: Creates sequential receipt numbers (e.g., `REC-2026-00001`) with QR codes containing transaction signatures.
* **Tax and Levies Configurator**: Handles government tax rates and agency service fee structures.

### Acceptance Criteria
* **AC 8.1**: All Invoice and Receipt numbers must follow a continuous chronological sequence without gaps.
* **AC 8.2**: Receipts must be printable in optimized standard desktop format and PDF formats.

---

## 9. Reports Module

### Features
* **Pipeline Bottleneck Report**: Identifies average days spent by candidates in each state (e.g. "Average 14 days in Medical waiting").
* **Financial Ledger Reports**: P&L sheet of cash inflows, paid commissions, pending receivables, and net agency margin.
* **Consolidated Emigration Sheet**: Formatted CSV/Excel dump ready for government immigration department submissions.

### Acceptance Criteria
* **AC 9.1**: Export to CSV, PDF, and XLSX formats must preserve data types and currency formatting.
* **AC 9.2**: Queries for reports must utilize specialized read-only views or optimized database indexes to avoid locking active transaction tables.

---

## 10. Notifications Module

### Features
* **Multi-Channel Dispatcher**: In-app push banners, email notices, and SMS integration (Twilio/local gateway) for immediate updates.
* **Automated Stage Alerts**: Notification sent to candidate and agent when status shifts (e.g., "Your Visa has been Stamped! Details inside.").
* **System Reminders**: Alerts documentation staff on passports expiring in < 6 months.

### Acceptance Criteria
* **AC 10.1**: Notifications must contain a read/unread status. Clicking an in-app alert marks it read and routes to the relevant detail page.
* **AC 10.2**: SMS gateways must support international numbers matching candidates' destination countries and agents' local numbers.

---

## 11. Audit Logs Module

### Features
* **Immutable Logs Table**: Logs `UserID`, `Role`, `ActionType` (`CREATE`, `UPDATE`, `TRANSITION`, `EXPORT`), `IPAddress`, `Timestamp`, and `DeltaDiff` (JSON format of changes).
* **Security Alarms**: Triggers warning emails to Super Admin on consecutive failed login attempts or unauthorized attempts to access scoped files.

### Acceptance Criteria
* **AC 11.1**: The Audit Log table is append-only. There are no SQL `UPDATE` or `DELETE` endpoints exposed, and database triggers block any alterations to this table.
* **AC 11.2**: Audit records must display changes clearly (e.g., `status: "MEDICAL_WAITING" ➔ "MEDICAL_FIT"`).

---

## 12. Role-Based Access Control (RBAC) Module

### Features
* **Dynamic Table-Based RBAC**: Rather than relying on hardcoded static enum checks in the codebase, permissions are read dynamically from three central tables (`Role`, `Permission`, `RolePermission`).
* **Dynamic Role Assignor**: Super Admin portal to manage staff roles, activate/deactivate user logins, and reset 2FA devices.
* **Permission Override Panel**: Fine-tune specific route access or assign temporary permissions for officers going on annual leave.

### Acceptance Criteria
* **AC 12.1**: Role alterations take effect immediately. Sessions must be force-invalidated upon role change, prompting a fresh login.
* **AC 12.2**: Access to the RBAC module is strictly restricted to Super Admin only.
* **AC 12.3**: Database seed files must guarantee the setup of the 8 default system roles (Super Admin, Operations Admin, HR Officer, Documentation Officer, Visa Officer, Accounts Officer, Agent, and Applicant) with their respective granular permission bindings.
