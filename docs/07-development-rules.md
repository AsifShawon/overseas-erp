# Development Standards & Coding Rules

This document establishes the official development standards, code guidelines, directory structures, and security patterns for the Overseas Manpower ERP. All developers must follow these rules strictly to ensure maintainability, performance, and compliance.

---

## 1. Project Directory Structure

The project is structured as a Next.js App Router codebase with strict module isolation:

```
overseas-erp/
├── docs/                      # Planning and architecture files
├── prisma/
│   ├── schema.prisma          # Database models (PostgreSQL)
│   └── seed.ts                # Default seed data (Super Admin & Jobs)
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Auth routes (login)
│   │   ├── (dashboard)/       # Main system portals
│   │   │   ├── admin/         # Super Admin & Staff screens
│   │   │   ├── agent/         # Agent workspace screens
│   │   │   └── applicant/     # Candidate self-service screens
│   │   │   └── layout.tsx     # Context-based portal loaders
│   │   ├── api/               # Next.js API Route Handlers
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/            # Reusable UI components
│   │   ├── ui/                # Base design tokens (buttons, tables, inputs)
│   │   ├── forms/             # Shared validation forms
│   │   └── charts/            # Pipeline data visualizer widgets
│   ├── hooks/                 # Custom React utility hooks
│   ├── lib/                   # Core shared backend configurations
│   │   ├── db.ts              # PrismaClient global singleton
│   │   ├── auth.ts            # JWT validation utilities
│   │   └── audit.ts           # Centralized Audit Log recorder
│   └── types/                 # Shared TypeScript interface definitions
├── .env.example
├── package.json
├── tsconfig.json
└── tailwind.config.js         # Configured with agency brand palettes
```

---

## 2. Core Coding Conventions & Validation

1. **TypeScript Flags**: `strict` flag must be set to `true` in `tsconfig.json`. No usage of the `any` keyword is permitted. All function parameters, return states, and API contracts must be fully typed.
2. **Schema & Input Validation**: Use `zod` for parsing all incoming payloads inside both React forms (via React Hook Form) and Next.js Route Handlers.
   ```typescript
   // Example validation in API Route Handler
   const body = schema.safeParse(await req.json());
   if (!body.success) {
     return NextResponse.json({ success: false, error: body.error.format() }, { status: 400 });
   }
   ```
3. **UX Resilience**:
   * Every network request must show a dynamic loading state (skeletons or indicators).
   * Implement Next.js `error.tsx` boundary files at each folder level to gracefully catch and report render issues without crashing the master shell.

---

## 3. Next.js Routing & Server Action Rules

1. **Client vs. Server Components**:
   * **Server Components**: Use for layout loading, permission vetting, and direct database queries to render static layouts.
   * **Client Components**: Use for interactive forms, search filters, state toggles, and modals. Keep client components as small as possible in the tree.
2. **Server Actions vs. API Handlers**:
   * Use **Server Actions** for simple, form-based mutations (e.g. updating user settings, toggling notifications).
   * Use **API Route Handlers (`/api/...`)** for complex data interactions, large list fetches, document uploads, and third-party integrations to support granular monitoring and scaling.

---

## 4. Prisma & PostgreSQL Practices

1. **Client Singleton Pattern**: Always instantiate the `PrismaClient` using a global helper variable to prevent connection exhaust warnings during hot reloads:
   ```typescript
   import { PrismaClient } from '@prisma/client';
   const globalForPrisma = global as unknown as { prisma: PrismaClient };
   export const prisma = globalForPrisma.prisma || new PrismaClient();
   if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
   ```
2. **Avoiding N+1 Queries**: Proactively fetch related records using Prisma's `include` or `select` parameters. Never map over a fetched array and trigger secondary queries.
3. **Database Transactions**: Financial ledgers and commissions require **absolute consistency**. The Accounts Officer must record entries within an interactive transaction block (`prisma.$transaction`) to prevent orphan records if a step fails:
   ```typescript
   await prisma.$transaction(async (tx) => {
     // 1. Create Receipt row
     const receipt = await tx.receipt.create({ ... });
     // 2. Insert LedgerEntry row
     await tx.ledgerEntry.create({ ... });
     // 3. Update candidate outstanding balance cache
     await tx.applicant.update({ ... });
   });
   ```

---

## 5. Immutable Audit Log Hook Mechanic

Every state change, financial record, and security transition must be captured. To avoid forgetting log triggers, developers should leverage a centralized logging function inside operations:

```typescript
import { prisma } from '@/lib/db';
import { Role } from '@prisma/client';

interface LogContext {
  userId?: string;
  role?: Role;
  actionType: string;
  tableName: string;
  recordId?: string;
  delta?: Record<string, any>;
  ipAddress?: string;
}

export async function recordSystemAudit(context: LogContext) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: context.userId || null,
        role: context.role || null,
        actionType: context.actionType,
        tableName: context.tableName,
        recordId: context.recordId || null,
        delta: context.delta ? JSON.stringify(context.delta) : null,
        ipAddress: context.ipAddress || null,
      }
    });
  } catch (error) {
    console.error("Failed to commit audit entry:", error);
    // Alert Operations Admin or monitor system immediately
  }
}
```

*Rules*:
* Calling `recordSystemAudit` is mandatory in any method modifying `Applicant.currentStage`, `Invoice`, `Receipt`, and `User.role`.
* If a database error occurs while writing an audit log, the active transaction must fail to ensure zero actions happen without being logged.

---

## 6. Security & Authentication Standards

1. **Authentication Strategy**:
   * **Access Token**: Short-lived JWT (e.g., 15 minutes) passed in the HTTP request payload/header.
   * **Refresh Token**: Long-lived refresh token (`refreshToken`) stored exclusively inside an `HTTP-Only`, `Secure`, `SameSite=Strict` cookie.
   * **localStorage Prohibition**: Under no circumstances should the frontend store the refresh token in `localStorage`, `sessionStorage`, or generic JavaScript memory. This prevents XSS-based token theft.
2. **Passwords**: Store passwords hashed with `argon2id` (or `bcrypt` with a minimum cost parameter of 12 rounds).
3. **Mandatory Backend Permission Checks**:
   * All API endpoints and Server Actions MUST run strict permission checks.
   * Authorization must check the database RBAC tables to verify the user possesses the correct `Permission` for the requested operation, instead of checking static string matching against role names or relying on client-side routing visibility.
4. **PostgreSQL Row-Level Security (RLS)**:
   * PostgreSQL Row-Level Security (RLS) can be enabled later as an additional defense-in-depth security layer. All data access schemas must maintain clear tenant/resource owner keys (e.g. `userId`, `agentId`, `applicantId`) to facilitate easy RLS policy generation.
5. **CSRF Mitigation**: Apply state check middlewares on all POST/PATCH/DELETE endpoints.
6. **Data Isolation Scoping**: Always append a check block `where: { userId: session.user.id }` or check the agent relationship. Never fetch a record solely on user-supplied IDs without validating ownership.
7. **No File Hotlinking**: File uploads go into private cloud containers. Generate pre-signed download URLs that expire in 15 minutes instead of using public bucket routes.
