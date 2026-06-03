# SaaS User Membership & Active Company Context

This document explains the design, integration, and execution details for introducing the company membership schema, active workspace resolution, and layout-level route guards.

---

## 1. Why UserMembership is Needed

In a single-company ERP, a user is mapped directly to a global role. For a multi-company SaaS platform:
- A user must be able to access the platform through a defined company membership.
- Users may belong to multiple companies (for example, sub-agents or operators).
- User authorization, permissions, and roles should be tied directly to their active membership context rather than a single static role.
- Workspace access must be instantly revoked if a user's membership status is not `ACTIVE`, or if their parent company is `SUSPENDED` or `REJECTED`.

---

## 2. Dynamic Membership Schema

We introduced the `UserMembership` model and `MembershipStatus` enum:

```prisma
enum MembershipStatus {
  ACTIVE
  SUSPENDED
  INVITED
}

model UserMembership {
  id        String           @id @default(cuid())
  userId    String
  companyId String
  roleId    String
  status    MembershipStatus @default(ACTIVE)
  isOwner   Boolean          @default(false)
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
  role    Role    @relation(fields: [roleId], references: [id], onDelete: Restrict)

  @@unique([userId, companyId])
  @@index([companyId])
  @@index([userId])
  @@index([roleId])
  @@index([companyId, status])
}
```

*Note: For backward compatibility, `User.roleId` remains in the schema but is treated as a compatibility fallback only.*

---

## 3. JWT & Session Payload Structure

The JWT access token payload (`AccessTokenPayload`) has been expanded to encapsulate complete company context. This prevents subsequent API calls from querying the database to find company status on every request.

### Payload Fields:
- `userId` (String): The authenticated user ID.
- `email` (String): The authenticated user email.
- `fullName` (String): The authenticated user full name.
- `isPlatformAdmin` (Boolean): Flag indicating if the user has platform administration access.
- `activeCompanyId` (String | null): The active company ID.
- `activeCompanyName` (String | null): The active company name.
- `membershipId` (String | null): The unique membership ID.
- `roleId` (String): The resolved role ID for the active workspace.
- `roleName` (String): The resolved role name.
- `permissions` (String[]): An array of specific permission keys associated with the workspace role.
- `companyStatus` (String | null): The active company status.

---

## 4. Active Workspace Resolution Rules

During authentication checks (login, get session, token refresh), the platform resolves the active workspace using these rules:

1. **Platform Admins**:
   - If `isPlatformAdmin === true`, they can log in even if they have no memberships.
   - If they have no memberships, `activeCompanyId` is `null`. They are routed automatically to `/platform` and are blocked from standard ERP pages unless they switch to a company.
2. **Normal Users**:
   - Query all memberships where `status === "ACTIVE"` and the parent `Company.status === "ACTIVE"`.
   - If no active memberships are found, log in is rejected with:
     > *"No active company workspace is available for this account."*
   - If exactly one active membership exists, it is selected automatically.
   - If multiple active memberships exist, the first active membership is selected by default (a switcher will be implemented in subsequent phases).

---

## 5. Security & Route Guards

Client-side and layout-level guards are enforced inside the unified `AppShell`:

1. **Platform Admin Area (`/platform/*`)**:
   - Requires `isPlatformAdmin === true`.
   - Rejects unauthorized users with an "Access Denied" page.
2. **ERP Workspace Pages**:
   - Requires an active `activeCompanyId` in the session.
   - Requires `companyStatus === "ACTIVE"`.
   - If a company's status is changed to `SUSPENDED` or `REJECTED`, or a user's membership status is revoked, they are greeted with an inline suspended workspace card preventing any further navigation.
   - Platform admins who try to access ERP pages without an active company context are redirected automatically to `/platform`.

---

## 6. Approval-Created Owner Memberships

Inside the company application approval transaction:
- The system generates the `Company`, `CompanySubscription` (Standard plan), and `CompanySettings`.
- It creates or retrieves the owner `User` account.
- It inserts a `UserMembership` linking the owner user to the new company under the **Super Admin** role with `isOwner: true`.
- This process is fully enclosed in the Prisma transaction to ensure database safety.

---

## 7. Backfill Script for Demo Overseas Agency

The script `scripts/backfill-memberships.ts` was executed to idempotently migrate all pre-existing users:
1. It resolves the default company `Demo Overseas Agency`.
2. It maps all standard users (`ops@agency.com`, `hr@agency.com`, `accounts@agency.com`, agents, applicants) to a membership inside the default company using their current `roleId`.
3. It designates `admin@agency.com` as the owner (`isOwner: true`) of the company.
4. It skips pure platform administrator accounts.

---

## 8. Current Limitations

- **API Tenant-Scoping**: Business logic routes (`/api/applicants`, `/api/invoices`, etc.) are not yet fully tenant-scoped in this phase.
- **Nullable companyId**: Business database tables still have nullable `companyId` columns to ensure backward compatibility during transitions.
- **Company Switcher**: A workspace switcher UI is not yet built (the session defaults to the first active membership).
- **Password Reset / Invitation Emails**: Real email triggers are not active. Passwords are created using secure random generation, and an administrator must provide them to owners for dev/testing.
