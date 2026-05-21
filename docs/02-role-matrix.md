# Role-Based Access Control Matrix

This document defines the 8 distinct system roles, maps their permissions across modules, and establishes strict data isolation boundaries. Compliance with these rules is mandatory for both Frontend UI rendering and Backend API authorization checks.

---

## 1. Dynamic RBAC & Role Structure

To prevent conflicts between static enums and dynamic client requirements, the system implements a **Table-Based Dynamic Role-Based Access Control (RBAC)** architecture. 

The database defines three main tables:
1. `Role`: Identifies the system role (e.g., `Super Admin`, `Accounts Officer`, `Applicant`). Seeding seeds the 8 default roles.
2. `Permission`: Identifies discrete functional actions (e.g., `CREATE_APPLICANT`, `TRANSITION_WORKFLOW`, `RECORD_RECEIPT`, `EXPORT_REPORTS`).
3. `RolePermission`: Maps many-to-many associations between `Role` and `Permission`.

### Seeding Default Roles
During database initialization, the system seeds these 8 default roles with pre-configured permissions:
1. **Super Admin**: The ultimate system supervisor. Full permission overrides across all modules, schemas, dynamic permission rules, and audit logs.
2. **Operations Admin**: The day-to-day agency manager. Reviews pipelines, manages Job Orders, exports reports, and audits general logs.
3. **HR or Recruitment Officer**: Responsible for candidate intake, screening, interviews, pre-selection, and matching candidates to active Job Orders.
4. **Documentation Officer**: Coordinates post-selection medical routing, updates medical center results, handles training certificates, and verifies passport checklists.
5. **Visa Officer**: Prepares visa submission files, embassy scheduling, and registers visa sticker stamps or rejections.
6. **Accounts Officer**: Formulates candidate billing profiles, issues invoices, registers receipts, calculates agent commissions, and processes payouts.
7. **Agent**: External recruitment partner. Sourced via external networks. Registers applicants and monitors progress of their specific cohort only.
8. **Applicant**: The candidate seeking overseas employment. Accesses a scoped self-service portal *only* after claiming account access.

> [!NOTE]
> **Applicant Profile Creation vs. Account Access**:
> The Applicant profile is initially registered by an Agent or HR Officer without any credentials (no linked `User` record). The candidate only gains portal access by initiating an **Access Claim** using their Passport Number and Phone/Email. Upon verifying an OTP (One-Time Password) or Invitation token, a `User` account is created, and the `Applicant.userId` is linked. Before this claim, `Applicant.userId` remains `NULL`.

---

## 2. Module Permission Matrix

| Module | Super Admin | Operations Admin | HR Officer | Documentation Officer | Visa Officer | Accounts Officer | Agent | Applicant |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Dashboard** | Full (C) | Full (C) | View (R) | View (R) | View (R) | View (R) | Scoped (S) | Scoped (S) |
| **Applicant Mgmt** | Full (C) | Write (W) | Write (W) | View (R) | View (R) | View (R) | Scoped (S) | Scoped (S) |
| **Workflow Tracking**| Full (C) | Write (W) | Write (W)* | Write (W)* | Write (W)* | None (-) | Scoped (S) | Scoped (S) |
| **Agent Mgmt** | Full (C) | Write (W) | View (R) | None (-) | None (-) | View (R) | None (-) | None (-) |
| **Accounts / Payments**| Full (C) | View (R) | None (-) | None (-) | None (-) | Write (W) | None (-) | Scoped (S) |
| **Commission Mgmt** | Full (C) | View (R) | None (-) | None (-) | None (-) | Write (W) | Scoped (S) | None (-) |
| **Document Mgmt** | Full (C) | Write (W) | Write (W) | Write (W) | Write (W) | None (-) | Scoped (S) | Scoped (S) |
| **Receipts / Invoices**| Full (C) | View (R) | None (-) | None (-) | None (-) | Write (W) | None (-) | Scoped (S) |
| **Reports** | Full (C) | Full (C) | None (-) | None (-) | None (-) | View (R) | None (-) | None (-) |
| **Notifications** | Full (C) | Write (W) | Write (W) | Write (W) | Write (W) | Write (W) | Scoped (S) | Scoped (S) |
| **Audit Logs** | Full (C) | View (R) | None (-) | None (-) | None (-) | None (-) | None (-) | None (-) |
| **RBAC Config** | Full (C) | None (-) | None (-) | None (-) | None (-) | None (-) | None (-) | None (-) |

* **Legend**:
  * **Full (C)**: Complete Read, Create, Update, Delete (CRUD) capability. Can adjust backend configurations.
  * **Write (W)**: Read, Create, Update permissions. Cannot delete records (deletions are blocked or restricted to soft-deletions).
  * **View (R)**: Read-only access to all records in the module.
  * **Scoped (S)**: Read or Write permissions strictly limited to own database records (see section 3).
  * **Write (W)***: Can only write transitions relevant to their specific workflow stage (e.g. Visa Officer cannot transition a candidate from Applied to Selected, only Visa stages).
  * **None (-)**: No UI rendering and immediate backend API rejection (HTTP 403 Forbidden).

---

## 3. Strict Data Isolation Boundaries (Data Scoping)

The system enforces strict row-level isolation rules at both the API query level and the client application level:

### A. The Applicant Isolation Boundary (Row-Level Scoping)
Applicants represent the candidates themselves. Security controls must prevent any candidate from viewing any other candidate's information or system parameters.
* **Database Isolation**: The SQL query must fetch files where `Applicant.userId == req.user.id`. Since an Applicant's profile is created first and claimed later, this relation is only enforced after the candidate links their `User` profile. Unclaimed applicants have no `userId` and cannot log in.
* **Frontend Scope**: The Applicant only sees a portal showing:
  - **My Progress Timeline**: Visual stages showing where their application is currently sitting (e.g. "Passport Verified", "Visa Stamping In-Progress").
  - **My Documents**: View uploaded passports, CVs, and photos. Upload additional documents requested via notifications.
  - **My Ledger & Receipts**: View invoice summaries (amount due) and official receipts generated by the Accounts Officer for payments made.
  - **My Notifications**: Immediate messages regarding consulate appointments or passport collection.
* **Strict Block**: Applicants have no search bars, cannot see employer job orders, cannot see agent commissions, and cannot see other candidates' list directories.

### B. The Agent Isolation Boundary (Cohort-Level Scoping)
Agents source labor candidates and earn commissions. They must be prevented from seeing candidates sourced by other agents or details of other agents' contracts.
* **Database Isolation**: The SQL query must fetch candidates where `agentId == req.user.agentId`.
* **Frontend Scope**: The Agent dashboard provides:
  - **My Candidates**: List of applicants submitted *only* by this agent. Shows their status (e.g. Selected, Medical Fit, Flight Booked).
  - **New Application Intake**: Form to register a new candidate under their agency name.
  - **My Commissions**: Detailed table of earned commissions per placed candidate, indicating unpaid vs paid amounts.
* **Strict Block**: Agents cannot see general agency reports, company accounting ledgers, or candidate details belonging to other agents.

### C. Agency Staff Functional Isolation (Vertical Scoping)
To prevent internal fraud or data contamination, agency staff can only perform operations within their functional vertical:
* **HR Officer**: Can only execute actions related to applicant screening, matching to `JobOrder`, and interviews. They *cannot* modify visa statuses or enter accounting ledger rows.
* **Documentation Officer**: Can only edit files, upload medical certificates, check police clearance checklists, and manage domestic training center records.
* **Visa Officer**: Can only update fields under embassy submissions (consulate routing, dates, sticker numbers, and flight assignments).
* **Accounts Officer**: The *only* role permitted to create invoices, register payments, and execute agent commission distributions. They have no write permission on compliance checklists (e.g. cannot change "Medical Unfit" to "Medical Fit").

---

## 4. Middleware and Authorization Rules

Any backend API endpoint must pass through a multi-stage security guard. Backend permission checks are strictly **mandatory** and must never be bypassed:
1. **Authentication Guard**: Validates the JWT access token, verifying the active user session.
2. **Access Control Guard (Dynamic RBAC)**:
   * Queries the user's role and maps their active permissions (`User -> Role -> RolePermission -> Permission`).
   * Evaluates if the required permission is granted (e.g., POST `/api/accounts/receipts` requires the `RECORD_RECEIPT` permission).
3. **Data Scope Guard (Row/Cohort Ownership)**:
   * Evaluates if the requested row is owner-scoped. If the user is an `Agent`, the backend must enforce a strict SQL filter: `agentId == session.agentId`.
   * If the user is an `Applicant`, the query must strictly restrict results where `userId == session.userId`.
   * Unauthorized cross-tenant queries must result in a `403 Forbidden` response and an immediate Audit Log security entry.

### Defense-in-Depth: PostgreSQL Row Level Security (RLS)
While initial development enforces data scoping at the API logic layer, the architecture supports **PostgreSQL Row Level Security (RLS)** as a defense-in-depth security layer that can be enabled later.
* Table policies can be written so that database queries executed with a session tenant context (e.g. `SET LOCAL app.current_user_id = '...'`) automatically prevent returning rows belonging to other candidates or agents, protecting against SQL injection or logic bypass vulnerabilities.
