# Tenant-Scoped API Audit

This document records the audit of all Next.js API endpoints in the system and specifies their scoping classification, tenant risks, scoping requirements, and completion status.

---

## 1. Classifications

We classify each route as follows:
- **`PUBLIC_ROUTE`**: Accessible publicly without authentication.
- **`PLATFORM_ROUTE`**: Requires platform administration privileges (`requirePlatformAdmin`).
- **`COMPANY_SCOPED_ROUTE`**: Requires active company context (`requireCompanyContext`). Users can only read/write data for their active company.
- **`AGENT_SCOPED_ROUTE`**: Scopes company ERP data further to only the authenticated Agent's assigned applicants/cohorts.
- **`APPLICANT_SCOPED_ROUTE`**: Scopes candidate access strictly to their own applicant profile.
- **`AUTH_ONLY_ROUTE`**: Authentication routing (login/logout/refresh/me).

---

## 2. API Audit & Scoping Status

### Authentication Route Handlers (`src/app/api/auth/*`)

| File Path | Method | Classification | Description & Risk | Scoping Status |
| :--- | :--- | :--- | :--- | :--- |
| `auth/login/route.ts` | POST | `AUTH_ONLY_ROUTE` | Authentication. | **COMPLETED**: Resolves company memberships dynamically. |
| `auth/me/route.ts` | GET | `AUTH_ONLY_ROUTE` | Session details. | **COMPLETED**: Returns active company session metadata. |
| `auth/refresh/route.ts` | POST | `AUTH_ONLY_ROUTE` | Token rotation. | **COMPLETED**: Rotates session company details. |
| `auth/logout/route.ts` | POST | `AUTH_ONLY_ROUTE` | Logs out the user. | **COMPLETED**: Clears token. Safe as is. |
| `auth/change-password/route.ts` | POST | `AUTH_ONLY_ROUTE` | Changes password. | **COMPLETED**: Scopes to user ID only. Safe as is. |

---

### Platform Route Handlers (`src/app/api/platform/*`)

| File Path | Method | Classification | Description & Risk | Scoping Status |
| :--- | :--- | :--- | :--- | :--- |
| `platform/company-applications/route.ts` | GET | `PLATFORM_ROUTE` | List applications. | **COMPLETED**: Protected by `requirePlatformAdmin`. |
| `platform/company-applications/public/route.ts` | POST | `PUBLIC_ROUTE` | Public apply. | **COMPLETED**: Open public route. Creates application. |
| `platform/company-applications/[id]/route.ts` | GET | `PLATFORM_ROUTE` | Application details. | **COMPLETED**: Protected by `requirePlatformAdmin`. |
| `platform/company-applications/[id]/approve/route.ts` | POST | `PLATFORM_ROUTE` | Approve application. | **COMPLETED**: Protected by `requirePlatformAdmin`. Creates owner memberships. |
| `platform/company-applications/[id]/reject/route.ts` | POST | `PLATFORM_ROUTE` | Reject application. | **COMPLETED**: Protected by `requirePlatformAdmin`. |

---

### Applicant Route Handlers (`src/app/api/applicants/*` and `src/app/api/applicant/*`)

| File Path | Method | Classification | Description & Risk | Scoping Status |
| :--- | :--- | :--- | :--- | :--- |
| `applicants/route.ts` | GET | `COMPANY_SCOPED_ROUTE` / `AGENT_SCOPED_ROUTE` | List applicants. Risk of leakage. | **COMPLETED**: Enforces `companyId = activeCompanyId`. Scopes agents using `enforcedAgentId`. |
| `applicants/route.ts` | POST | `COMPANY_SCOPED_ROUTE` / `AGENT_SCOPED_ROUTE` | Create applicant. Risk of assigning incorrect company or agent. | **COMPLETED**: Ignores body `companyId` and sets to `activeCompanyId`. Verifies related `jobOrderId` and `agentId` belong to same company. |
| `applicants/[id]/route.ts` | GET | `COMPANY_SCOPED_ROUTE` / `AGENT_SCOPED_ROUTE` | Fetch detail. ID-only risk. | **COMPLETED**: Queries by `id` and `companyId`. If Agent, asserts `agentId = currentAgentId`. |
| `applicants/[id]/route.ts` | PUT | `COMPANY_SCOPED_ROUTE` / `AGENT_SCOPED_ROUTE` | Update detail. ID-only risk. | **COMPLETED**: Asserts ownership using `id` + `companyId` before updating. |
| `applicants/[id]/archive/route.ts` | POST | `COMPANY_SCOPED_ROUTE` | Archive applicant. ID-only risk. | **COMPLETED**: Asserts ownership before archiving. |
| `applicants/[id]/portal-access/route.ts` | POST | `COMPANY_SCOPED_ROUTE` | Grant portal access. ID-only risk. | **COMPLETED**: Asserts ownership before granting. |
| `applicants/[id]/documents/route.ts` | GET, POST | `COMPANY_SCOPED_ROUTE` / `AGENT_SCOPED_ROUTE` | List/upload docs. ID-only risk. | **COMPLETED**: Verifies applicant belongs to `activeCompanyId`. Merges `companyId` on upload. |
| `applicants/[id]/documents/[docId]/route.ts` | GET, DELETE | `COMPANY_SCOPED_ROUTE` / `AGENT_SCOPED_ROUTE` | Detail/delete doc. ID-only risk. | **COMPLETED**: Verifies document and applicant belong to `activeCompanyId`. |
| `applicants/[id]/documents/[docId]/download/route.ts` | GET | `COMPANY_SCOPED_ROUTE` / `AGENT_SCOPED_ROUTE` | Download doc. ID-only risk. | **COMPLETED**: Verifies document and applicant belong to `activeCompanyId`. |
| `applicants/[id]/invoices/route.ts` | GET | `COMPANY_SCOPED_ROUTE` | List invoices for applicant. ID-only risk. | **COMPLETED**: Verifies applicant belongs to `activeCompanyId`. |
| `applicants/[id]/receipts/route.ts` | GET | `COMPANY_SCOPED_ROUTE` | List receipts for applicant. ID-only risk. | **COMPLETED**: Verifies applicant belongs to `activeCompanyId`. |
| `applicants/[id]/workflows/route.ts` | GET, POST | `COMPANY_SCOPED_ROUTE` | Workflow transitions. ID-only risk. | **COMPLETED**: Verifies applicant and transition records belong to `activeCompanyId`. |
| `applicant/portal/route.ts` | GET | `APPLICANT_SCOPED_ROUTE` | Applicant personal profile. | **COMPLETED**: Resolves profile dynamically using `userId` and verifies `companyId = activeCompanyId`. |

---

### Agent Route Handlers (`src/app/api/agents/*`)

| File Path | Method | Classification | Description & Risk | Scoping Status |
| :--- | :--- | :--- | :--- | :--- |
| `agents/route.ts` | GET | `COMPANY_SCOPED_ROUTE` | List agents. Risk of leakage. | **COMPLETED**: Filters list by `companyId = activeCompanyId`. |
| `agents/route.ts` | POST | `COMPANY_SCOPED_ROUTE` | Create agent profile. Risk of leakage. | **COMPLETED**: Sets `companyId = activeCompanyId`. Registers membership. |
| `agents/[id]/route.ts` | GET | `COMPANY_SCOPED_ROUTE` | Agent details. ID-only risk. | **COMPLETED**: Queries by `id` and `companyId`. |
| `agents/[id]/route.ts` | PUT | `COMPANY_SCOPED_ROUTE` | Update agent. ID-only risk. | **COMPLETED**: Asserts ownership (`id` + `companyId`) before updating. |

---

### Job Order Route Handlers (`src/app/api/job-orders/*`)

| File Path | Method | Classification | Description & Risk | Scoping Status |
| :--- | :--- | :--- | :--- | :--- |
| `job-orders/route.ts` | GET | `COMPANY_SCOPED_ROUTE` | List jobs. Risk of leakage. | **COMPLETED**: Filters list by `companyId = activeCompanyId`. |
| `job-orders/route.ts` | POST | `COMPANY_SCOPED_ROUTE` | Create job. Risk of leakage. | **COMPLETED**: Sets `companyId = activeCompanyId`. |
| `job-orders/[id]/route.ts` | GET | `COMPANY_SCOPED_ROUTE` | Job details. ID-only risk. | **COMPLETED**: Queries by `id` and `companyId`. |
| `job-orders/[id]/route.ts` | PUT, DELETE | `COMPANY_SCOPED_ROUTE` | Update/delete. ID-only risk. | **COMPLETED**: Asserts ownership before updating/deleting. |

---

### Document Route Handlers (`src/app/api/documents/*`)

| File Path | Method | Classification | Description & Risk | Scoping Status |
| :--- | :--- | :--- | :--- | :--- |
| `documents/route.ts` | GET | `COMPANY_SCOPED_ROUTE` | List all documents. Risk of leakage. | **COMPLETED**: Filters by `companyId = activeCompanyId`. |
| `documents/[id]/route.ts` | GET, DELETE | `COMPANY_SCOPED_ROUTE` | Document details/delete. ID-only risk. | **COMPLETED**: Verifies document belongs to `activeCompanyId`. |
| `documents/[id]/download/route.ts` | GET | `COMPANY_SCOPED_ROUTE` / `AGENT_SCOPED_ROUTE` / `APPLICANT_SCOPED_ROUTE` | Document download. ID-only risk. | **COMPLETED**: Verifies document and applicant belong to `activeCompanyId`. |
| `documents/local/route.ts` | GET | `COMPANY_SCOPED_ROUTE` | Fetch local file. | **COMPLETED**: Verifies document belongs to `activeCompanyId` using filepath metadata. |
| `documents/upload/route.ts` | POST | `COMPANY_SCOPED_ROUTE` | Document upload. | **COMPLETED**: Verifies target applicant belongs to `activeCompanyId`. Merges `companyId`. |

---

### Finance Route Handlers (`src/app/api/finance/*` and `src/app/api/accounts/*`)

| File Path | Method | Classification | Description & Risk | Scoping Status |
| :--- | :--- | :--- | :--- | :--- |
| `accounts/ledger/route.ts` | GET | `COMPANY_SCOPED_ROUTE` | General ledger listing. Risk of leakage. | **COMPLETED**: Filters by `companyId = activeCompanyId`. |
| `finance/invoices/route.ts` | GET | `COMPANY_SCOPED_ROUTE` | List invoices. Risk of leakage. | **COMPLETED**: Filters by `companyId = activeCompanyId`. |
| `finance/invoices/route.ts` | POST | `COMPANY_SCOPED_ROUTE` | Create invoice. Risk of leakage. | **COMPLETED**: Sets `companyId = activeCompanyId`. Verifies applicant belongs to `activeCompanyId`. |
| `finance/receipts/route.ts` | GET | `COMPANY_SCOPED_ROUTE` | List receipts. Risk of leakage. | **COMPLETED**: Filters by `companyId = activeCompanyId`. |
| `finance/receipts/route.ts` | POST | `COMPANY_SCOPED_ROUTE` | Create receipt. Risk of leakage. | **COMPLETED**: Sets `companyId = activeCompanyId`. Verifies applicant and invoice belong to `activeCompanyId`. |
| `finance/commissions/route.ts` | GET | `COMPANY_SCOPED_ROUTE` / `AGENT_SCOPED_ROUTE` | List commissions. Risk of leakage. | **COMPLETED**: Filters by `companyId = activeCompanyId`. If Agent, filters by `agentId`. |
| `finance/commissions/accrue/route.ts` | POST | `COMPANY_SCOPED_ROUTE` | Accrue commissions. Risk of leakage. | **COMPLETED**: Sets `companyId = activeCompanyId`. Verifies agent, applicant, and jobOrder belong to `activeCompanyId`. |
| `finance/commissions/[id]/payout/route.ts` | POST | `COMPANY_SCOPED_ROUTE` | Payout commission. ID-only risk. | **COMPLETED**: Verifies commission belongs to `activeCompanyId` before payout. |

---

### Notifications & Audit Log Route Handlers (`src/app/api/notifications/*` and `src/app/api/audit-logs/*`)

| File Path | Method | Classification | Description & Risk | Scoping Status |
| :--- | :--- | :--- | :--- | :--- |
| `notifications/route.ts` | GET | `COMPANY_SCOPED_ROUTE` | User notifications. | **COMPLETED**: Filters notifications where `companyId = activeCompanyId` (or matches user). |
| `notifications/[id]/route.ts` | PATCH | `COMPANY_SCOPED_ROUTE` | Mark read. ID-only risk. | **COMPLETED**: Verifies notification belongs to `activeCompanyId` and current user. |
| `notifications/mark-all-read/route.ts` | POST | `COMPANY_SCOPED_ROUTE` | Mark all read. | **COMPLETED**: Marks read for current user and `companyId = activeCompanyId`. |
| `audit-logs/route.ts` | GET | `COMPANY_SCOPED_ROUTE` | List company audit logs. Risk of leakage. | **COMPLETED**: Filters by `companyId = activeCompanyId`. |

---

### Dashboard, Reports & Exports Route Handlers (`src/app/api/reports/*` and `src/app/api/exports/*`)

| File Path | Method | Classification | Description & Risk | Scoping Status |
| :--- | :--- | :--- | :--- | :--- |
| `reports/dashboard/route.ts` | GET | `COMPANY_SCOPED_ROUTE` / `AGENT_SCOPED_ROUTE` | Dashboard aggregates. Risk of reading global counts. | **COMPLETED**: Scopes all counts, sums, aggregates, groupBys to `companyId = activeCompanyId`. If Agent, scopes to `agentId`. |
| `exports/applicants/route.ts` | GET | `COMPANY_SCOPED_ROUTE` / `AGENT_SCOPED_ROUTE` | CSV applicant export. | **COMPLETED**: Scopes export query to `companyId = activeCompanyId`. If Agent, scopes to `agentId`. |
| `exports/audit-logs/route.ts` | GET | `COMPANY_SCOPED_ROUTE` | CSV audit logs export. | **COMPLETED**: Scopes export query to `companyId = activeCompanyId`. |
| `exports/commissions/route.ts` | GET | `COMPANY_SCOPED_ROUTE` / `AGENT_SCOPED_ROUTE` | CSV commissions export. | **COMPLETED**: Scopes export query to `companyId = activeCompanyId`. If Agent, scopes to `agentId`. |
| `exports/invoices/route.ts` | GET | `COMPANY_SCOPED_ROUTE` | CSV invoices export. | **COMPLETED**: Scopes export query to `companyId = activeCompanyId`. |
| `exports/job-orders/route.ts` | GET | `COMPANY_SCOPED_ROUTE` | CSV jobs export. | **COMPLETED**: Scopes export query to `companyId = activeCompanyId`. |
| `exports/ledger/route.ts` | GET | `COMPANY_SCOPED_ROUTE` | CSV general ledger export. | **COMPLETED**: Scopes export query to `companyId = activeCompanyId`. |
| `exports/receipts/route.ts` | GET | `COMPANY_SCOPED_ROUTE` | CSV receipts export. | **COMPLETED**: Scopes export query to `companyId = activeCompanyId`. |
