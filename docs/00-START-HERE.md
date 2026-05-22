# 00 — Start Here

Welcome to the **Overseas Manpower ERP** documentation.

This folder contains everything you need to understand, operate, develop, or demo the system.
Read this file first to find the right document for your role.

---

## What Is This System?

**OverseasERP** is a web-based Enterprise Resource Planning and CRM system for overseas manpower recruitment agencies.

It manages the complete lifecycle of a job placement:  
from sourcing a candidate → through medical, documents, and visa processing → to deployment and post-placement accounting.

Built with:
- **Next.js 16 (App Router)** — frontend UI + backend API route handlers
- **Prisma 7 + PostgreSQL 16** — database ORM
- **JWT (access + refresh token)** — authentication
- **Dynamic RBAC** — role and permission-based access control
- **Local file storage** — document vault (PDF, JPG, PNG)
- **Tailwind CSS v4** — utility-first styling with CSS variable design tokens

---

## MVP Status Summary (Phase 6E)

| Area | Status |
|------|--------|
| Auth / Login / Logout / Session Refresh | ✅ LIVE |
| Dynamic RBAC (DB-backed permissions) | ✅ LIVE |
| Applicant creation / listing / editing | ✅ LIVE |
| Applicant detail page (full dossier) | ✅ LIVE |
| Workflow stage transitions + stage gates | ✅ LIVE |
| Document upload / verify / download | ✅ LIVE |
| Invoice creation (per applicant) | ✅ LIVE |
| Receipt recording + ledger update | ✅ LIVE |
| General ledger (double-entry) | ✅ LIVE |
| Commission accrue + payout | ✅ LIVE |
| Role-specific dashboard (all 7 roles) | ✅ LIVE |
| Notifications (in-app) | ✅ LIVE |
| Audit logs | ✅ LIVE |
| CSV exports (applicants, invoices, receipts, ledger, commissions, audit logs) | ✅ LIVE |
| Soft archive / restore | ✅ LIVE |
| Applicant self-service portal | ✅ LIVE (backend + basic frontend) |
| Agent-scoped portal | ✅ LIVE (scoped to own candidates) |
| PDF generation | ❌ FUTURE |
| SMS / Email / WhatsApp integration | ❌ FUTURE |
| Production cloud storage (S3/R2) | ❌ FUTURE |
| Multi-branch support | ❌ FUTURE |
| Hard delete | ❌ FUTURE (by design — not recommended) |

---

## Who Should Read Which Document?

| Reader | Recommended Docs |
|--------|-----------------|
| **Client / Business Stakeholder** | 01, 03, 04, 14 |
| **Operations Admin / Super Admin (end user)** | 01, 03, 04, 06, 14 |
| **Staff user (HR, Docs, Visa, Accounts)** | 03, 04, 06 |
| **Agent** | 03, 04, 06 |
| **New Backend Developer** | 02, 07, 08, 09, 10, 11, 13 |
| **New Frontend Developer** | 02, 03, 12, 13 |
| **QA Tester** | 04, 05, 15 |
| **DevOps / Deployment Engineer** | 02, 13, 16 |

---

## Document Index

| File | Title | Description |
|------|-------|-------------|
| [01-PRODUCT-OVERVIEW.md](./01-PRODUCT-OVERVIEW.md) | Product Overview | What OverseasERP is, who uses it, and the business journey |
| [02-SYSTEM-ARCHITECTURE.md](./02-SYSTEM-ARCHITECTURE.md) | System Architecture | Frontend, backend, database, auth, storage, and data flow |
| [03-ROLE-BASED-NAVIGATION.md](./03-ROLE-BASED-NAVIGATION.md) | Role-Based Navigation | Per-role sidebar items, capabilities, and role-matrix table |
| [04-USER-FLOWS.md](./04-USER-FLOWS.md) | User Flows | End-to-end step-by-step flows for every role and scenario |
| [05-FEATURE-STATUS-LIVE-VS-PENDING.md](./05-FEATURE-STATUS-LIVE-VS-PENDING.md) | Feature Status | LIVE / PARTIAL / MOCK / FUTURE status for every feature |
| [06-MODULE-GUIDE.md](./06-MODULE-GUIDE.md) | Module Guide | Per-module purpose, UI pages, API endpoints, and models |
| [07-API-ENDPOINT-MAP.md](./07-API-ENDPOINT-MAP.md) | API Endpoint Map | Complete map of every API route in src/app/api |
| [08-DATABASE-MODEL-GUIDE.md](./08-DATABASE-MODEL-GUIDE.md) | Database Model Guide | Prisma schema, model relationships, enums, and ERD |
| [09-AUTH-RBAC-GUIDE.md](./09-AUTH-RBAC-GUIDE.md) | Auth & RBAC Guide | Login flow, JWT tokens, roles, permissions, and data boundaries |
| [10-FINANCE-LEDGER-GUIDE.md](./10-FINANCE-LEDGER-GUIDE.md) | Finance & Ledger Guide | Invoice, receipt, ledger, commission logic and flows |
| [11-WORKFLOW-DOCUMENTS-COMPLIANCE-GUIDE.md](./11-WORKFLOW-DOCUMENTS-COMPLIANCE-GUIDE.md) | Workflow & Documents | Stage transitions, document gates, verification, and compliance |
| [12-UI-THEME-DESIGN-SYSTEM.md](./12-UI-THEME-DESIGN-SYSTEM.md) | UI Theme & Design | Light/dark theme, CSS variables, utility classes, and UI rules |
| [13-LOCAL-DEVELOPMENT-SETUP.md](./13-LOCAL-DEVELOPMENT-SETUP.md) | Development Setup | Prerequisites, install, Docker, environment, seed, and run |
| [14-DEMO-SCRIPT-FOR-CLIENT.md](./14-DEMO-SCRIPT-FOR-CLIENT.md) | Demo Script | Step-by-step client demo walkthrough |
| [15-QA-CHECKLIST.md](./15-QA-CHECKLIST.md) | QA Checklist | Module-by-module QA test cases |
| [16-ROADMAP-NEXT-PHASES.md](./16-ROADMAP-NEXT-PHASES.md) | Roadmap | Planned next development phases and features |

---

## Existing Planning Documents (Phase 1–5 Reference)

These documents were written during earlier planning phases. They represent the original design intent and may differ slightly from current implementation.

| File | Description |
|------|-------------|
| [01-product-overview.md](./01-product-overview.md) | Original product overview (planning phase) |
| [02-role-matrix.md](./02-role-matrix.md) | Original role matrix (planning phase) |
| [03-module-list.md](./03-module-list.md) | Original module list (planning phase) |
| [04-ui-ux-flow.md](./04-ui-ux-flow.md) | Original UI/UX flow (planning phase) |
| [05-database-plan.md](./05-database-plan.md) | Original database plan (planning phase) |
| [06-api-contract.md](./06-api-contract.md) | Original API contract (planning phase) |
| [07-development-rules.md](./07-development-rules.md) | Development rules and coding standards |

> **Note:** The new numbered docs (00–16) reflect the **actual implemented state** of the system. Refer to them for current accurate information.
