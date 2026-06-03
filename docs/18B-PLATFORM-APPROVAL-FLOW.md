# 18B — Platform Approval Flow

This document details the platform administration approval and rejection workflow implemented for the multi-tenant SaaS.

---

## 1. Platform Admin Identification
* Added `isPlatformAdmin` boolean flag on the `User` model, defaulting to `false`.
* Added support in `prisma/seed.ts` to idempotently seed the Platform Admin user if `PLATFORM_ADMIN_EMAIL` and `PLATFORM_ADMIN_PASSWORD` are present in `.env`.
* Configured the default Platform Admin with:
  * **Email**: `platform@agency.com`
  * **Password**: `PlatformAdmin@2026!`

---

## 2. API Routes & Security Guard

### Helper: `requirePlatformAdmin`
Defined inside `src/lib/auth.ts`, this helper:
1. Validates the JWT bearer access token in the request header.
2. Resolves the user from the database.
3. Blocks unauthenticated users (`401 Unauthorized`) and non-platform admins (`403 Forbidden`).

### Protected Endpoints
* **`GET /api/platform/company-applications`**: Retrieves company applications ordered by newest first (supporting optional status filter).
* **`GET /api/platform/company-applications/[id]`**: Retrieves single application detail.
* **`POST /api/platform/company-applications/[id]/approve`**: Atomically approves a pending application.
* **`POST /api/platform/company-applications/[id]/reject`**: Rejects an application with a mandatory reason.

---

## 3. Approval Transaction Behavior

Executing `POST /api/platform/company-applications/[id]/approve` executes a single atomic Prisma transaction:

1. **Verify State**: Confirms the application status is `PENDING`.
2. **Find SaaS Plan**: Finds the Standard plan matching `code = "STANDARD"`.
3. **Generate Slug**: Generates a clean, unique company URL slug (e.g. `"Test Agency Ltd"` -> `"test-agency-ltd"`). If a duplicate slug exists, it automatically appends incremental suffixes (e.g. `"-1"`, `"-2"`) to avoid collision.
4. **Create Company**: Creates the `Company` record in status `ACTIVE`.
5. **Create Subscription**: Creates a `CompanySubscription` mapping the company to the `STANDARD` plan in status `ACTIVE`.
6. **Create Settings**: Creates `CompanySettings` initializing bn/locale, agent/applicant portals, and public jobs indicators.
7. **Create/Reuse User**: Checks if a user already exists with `ownerEmail`. If not, creates the user with a temporary secure password.
8. **Map Temp Role**: Temporarily maps the user to the company-level `Super Admin` role via `User.roleId` (this will be replaced by `UserMembership` in the next phase).
9. **Finalize Application**: Updates `CompanyApplication` status to `APPROVED`, writes the platform reviewer id, approval timestamp, and links `approvedCompanyId`.

---

## 4. User Interface Pages

* **`/platform`**: Simple portal dashboard showing count of pending applications.
* **`/platform/company-applications`**: Table listing company applications with filter indicators (PENDING, APPROVED, REJECTED, ALL).
* **`/platform/company-applications/[id]`**: Detailed view with confirmations for approvals and error handling for empty rejection reason fields.
