# OverseasERP — Documentation

This is the complete documentation for the **Overseas Manpower ERP/CRM** system.

---

## 📌 Start Here

**New to the project?** Read [00-START-HERE.md](./00-START-HERE.md) first.

It explains:
- What OverseasERP is
- Which document to read for your role
- Current MVP status

---

## 📚 Documentation Index

| # | File | For |
|---|------|-----|
| 00 | [Start Here](./00-START-HERE.md) | Everyone |
| 01 | [Product Overview](./01-PRODUCT-OVERVIEW.md) | Client, Business Stakeholder |
| 02 | [System Architecture](./02-SYSTEM-ARCHITECTURE.md) | Developer |
| 03 | [Role-Based Navigation](./03-ROLE-BASED-NAVIGATION.md) | All users |
| 04 | [User Flows](./04-USER-FLOWS.md) | All users, QA |
| 05 | [Feature Status: Live vs Pending](./05-FEATURE-STATUS-LIVE-VS-PENDING.md) | Developer, QA |
| 06 | [Module Guide](./06-MODULE-GUIDE.md) | All users |
| 07 | [API Endpoint Map](./07-API-ENDPOINT-MAP.md) | Backend Developer |
| 08 | [Database Model Guide](./08-DATABASE-MODEL-GUIDE.md) | Backend Developer |
| 09 | [Auth & RBAC Guide](./09-AUTH-RBAC-GUIDE.md) | Developer |
| 10 | [Finance & Ledger Guide](./10-FINANCE-LEDGER-GUIDE.md) | Developer, Accounts |
| 11 | [Workflow & Documents Guide](./11-WORKFLOW-DOCUMENTS-COMPLIANCE-GUIDE.md) | Developer, Operations |
| 12 | [UI Theme & Design System](./12-UI-THEME-DESIGN-SYSTEM.md) | Frontend Developer |
| 13 | [Local Development Setup](./13-LOCAL-DEVELOPMENT-SETUP.md) | Developer |
| 14 | [Demo Script for Client](./14-DEMO-SCRIPT-FOR-CLIENT.md) | Sales, Stakeholder |
| 15 | [QA Checklist](./15-QA-CHECKLIST.md) | QA Tester |
| 16 | [Roadmap: Next Phases](./16-ROADMAP-NEXT-PHASES.md) | Developer, Project Manager |

---

## 📂 Legacy Planning Documents

These documents were created during the initial planning phases (before development). They represent the **original design intent** and may differ from the current implementation. The numbered docs above (00–16) reflect the actual built state.

| File | Description |
|------|-------------|
| [01-product-overview.md](./01-product-overview.md) | Original product overview |
| [02-role-matrix.md](./02-role-matrix.md) | Original role matrix |
| [03-module-list.md](./03-module-list.md) | Original module list |
| [04-ui-ux-flow.md](./04-ui-ux-flow.md) | Original UI/UX flow design |
| [05-database-plan.md](./05-database-plan.md) | Original database schema plan |
| [06-api-contract.md](./06-api-contract.md) | Original API contract |
| [07-development-rules.md](./07-development-rules.md) | Coding standards and rules |

---

## 🚀 Quick Start (Developer)

```bash
docker compose up -d          # Start PostgreSQL
npm install                   # Install dependencies
npm run db:generate           # Generate Prisma client
npm run db:migrate            # Apply database migrations
npm run db:seed               # Seed demo data
npm run dev                   # Start dev server at http://localhost:3000
```

Login: `admin@agency.com` / `SuperAdmin@2026!`

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19 + Tailwind CSS 4 |
| Database | PostgreSQL 16 |
| ORM | Prisma 7 |
| Auth | JWT (jose) + argon2 |
| Icons | Lucide React |
