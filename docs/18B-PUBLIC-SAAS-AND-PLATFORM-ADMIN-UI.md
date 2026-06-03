# 18B — Public SaaS UI & Platform Admin Approval/Rejection Area

> **Prompt**: 4 — Public SaaS Homepage, Improved Company Application UI, and Platform Admin Approval/Rejection Area  
> **Status**: Implemented  
> **Scope**: Public pages, Platform Admin pages, approval/rejection APIs, schema guard field

---

## Overview

This document describes the public-facing SaaS UI and the Platform Admin review area. It covers:

- Public SaaS landing page at `/`
- Company application form at `/apply`
- Application success page at `/apply/success`
- Platform Admin dashboard at `/platform`
- Company application list at `/platform/company-applications`
- Company application detail and actions at `/platform/company-applications/[id]`
- All supporting API routes
- Schema field: `User.isPlatformAdmin`

---

## Public Routes

### `GET /` — Public SaaS Landing Page

**File**: `src/app/page.tsx`

**Behavior (auth-aware)**:
- If auth is still loading → spinner
- If user is authenticated (ERP staff/admin) → redirect to `/dashboard`
- If user role is `Applicant` → redirect to `/applicant/portal`
- If unauthenticated → render full SaaS landing page

**Landing page sections**:
1. **Public navbar** — Home, Features, How it Works, Who Uses It, Pricing | Login, Apply for Access
2. **Hero** — Headline, supporting text, primary CTA (Apply), secondary CTA (Login), trust note
3. **Features** — 8 feature cards (7 active + 1 Coming Soon: CRM)
4. **How It Works** — 4-step process from application to ERP access
5. **Role-based operations** — 7 role descriptions
6. **Pricing** — Standard Plan card with all feature inclusions
7. **Security/Trust** — 5 trust pillars
8. **Bottom CTA** — Final call-to-action
9. **Footer**

---

### `GET /apply` — Company Application Form

**File**: `src/app/apply/page.tsx`

**Layout**: Two-column (desktop) / single column (mobile)  
- **Left**: Approval process steps, benefits list, trust note  
- **Right**: Application form

**Form fields**:
| Field | Required | Notes |
|-------|----------|-------|
| `companyName` | ✅ | |
| `ownerFullName` | ✅ | |
| `ownerEmail` | ✅ | Email format validated |
| `ownerPhone` | ✅ | |
| `businessType` | ❌ | Select dropdown |
| `country` | ✅ | Defaults to Bangladesh |
| `city` | ❌ | |
| `address` | ❌ | |
| `website` | ❌ | |
| `notes` | ❌ | |

**UX features**:
- Inline field validation with error messages
- Submit loading state with disabled button
- Global error display for API errors
- Duplicate pending application error shown clearly
- Bilingual (English / Bangla) via `LanguageContext`
- On success → redirect to `/apply/success`

**API called**: `POST /api/platform/company-applications/public`

---

### `GET /apply/success` — Application Success Page

**File**: `src/app/apply/success/page.tsx`

**Content**:
- Animated success icon (pulsing ring + CheckCircle2)
- Title: "Application Submitted Successfully!"
- Sub-message about platform review
- Pending status note with amber badge
- Two CTA buttons: **Back to Home** (`/`) and **Login** (`/login`)
- Step progress tracker showing "Application Submitted ✓" and remaining steps as "Pending"
- Two info cards: Workspace creation note + Standard Plan note

---

## Platform Admin Routes

> [!IMPORTANT]
> All `/platform` pages and `/api/platform/*` routes (except `/api/platform/company-applications/public`) require `isPlatformAdmin = true` on the authenticated user.

### `GET /platform` — Platform Admin Dashboard

**File**: `src/app/platform/page.tsx`

**Stats displayed** (fetched in parallel):
| Card | Source |
|------|--------|
| Pending Applications | `GET /api/platform/company-applications?status=PENDING` |
| Approved Applications | `GET /api/platform/company-applications?status=APPROVED` |
| Rejected Applications | `GET /api/platform/company-applications?status=REJECTED` |
| Active Companies | Count of approved applications with `approvedCompanyId` set |

**Additional features**:
- Alert banner shown when `pending > 0` with direct link to review
- Quick-action cards to Applications Registry and Plan Status
- Error state if stats fetch fails

---

### `GET /platform/company-applications` — Application List

**File**: `src/app/platform/company-applications/page.tsx`

**Features**:
- Status filter tabs: `PENDING` (default) | `APPROVED` | `REJECTED` | `ALL`
- Client-side search across companyName, ownerFullName, ownerEmail, ownerPhone, businessType, country/city
- Refresh button
- Table columns: Company Info | Owner/Contact | Type & Location | Date Submitted | Status | Action
- Status badges: amber (PENDING), emerald (APPROVED), rose (REJECTED)
- "View" link → `/platform/company-applications/[id]`
- Handles empty state with descriptive message

---

### `GET /platform/company-applications/[id]` — Application Detail

**File**: `src/app/platform/company-applications/[id]/page.tsx`

**Displays**:
- Company identification details (name, type, owner, email, phone, country, city, address, website, notes)
- Current status badge
- `reviewedBy` / `reviewedAt` if reviewed
- Rejection reason if rejected
- Approved company tenant ID if approved

**Actions panel** (only shown for PENDING):
- **Approve & Activate** button → shows confirmation dialog first
- **Reject Application** button → shows textarea for required rejection reason

---

## API Endpoints

### Public (no auth required)

#### `POST /api/platform/company-applications/public`
- **File**: `src/app/api/platform/company-applications/public/route.ts`
- Creates a new `CompanyApplication` with status `PENDING`
- Validates required fields via Zod
- Rejects if a PENDING application already exists for same `companyName` OR `ownerEmail`
- Does **not** create Company, User, or Subscription

---

### Platform Admin Protected

All routes below require a valid JWT access token AND `user.isPlatformAdmin = true`.  
Returns `403` if unauthenticated or not a platform admin.

#### `GET /api/platform/company-applications`
- **File**: `src/app/api/platform/company-applications/route.ts`
- Optional `?status=PENDING|APPROVED|REJECTED|ALL` query param
- Returns applications ordered by `createdAt` descending

#### `GET /api/platform/company-applications/[id]`
- **File**: `src/app/api/platform/company-applications/[id]/route.ts`
- Returns single application or `404`

#### `POST /api/platform/company-applications/[id]/approve`
- **File**: `src/app/api/platform/company-applications/[id]/approve/route.ts`
- Only PENDING applications can be approved (`400` otherwise)
- Runs a Prisma `$transaction`:

#### `POST /api/platform/company-applications/[id]/reject`
- **File**: `src/app/api/platform/company-applications/[id]/reject/route.ts`
- Only PENDING applications can be rejected (`400` otherwise)
- Requires `rejectionReason` in body (`400` if missing/empty)
- Does **not** create Company, User, Subscription, or Settings
- The rejection reason is shown on the application detail page

---

## Approval Transaction (Detail)

When `POST /api/platform/company-applications/[id]/approve` is called:

```
prisma.$transaction(async (tx) => {
  1. Verify application is PENDING
  2. Find SaaSPlan where code = "STANDARD" (500 if missing)
  3. Find Role where name = "Super Admin" (500 if missing)
  4. generateUniqueSlug(tx, companyName) → e.g. "test-agency-ltd"
     - lowercase, trim, replace special chars with hyphens
     - check for slug collisions using tx.company.findUnique, append counter if needed
  5. Create Company (status = ACTIVE)
  6. Create CompanySubscription (planId = Standard plan, status = ACTIVE)
  7. Create CompanySettings (defaultLocale = "bn", all portals = true)
  8. Find or create owner User by ownerEmail:
     - if exists: reuse existing user. Verify if User's current role is "Super Admin" or "Operations Admin";
       if not, temporarily assign roleId = Super Admin roleId to grant company administration permissions.
     - if not: create with temp password "Welcome@{random6}!" and roleId = Super Admin
       // TODO: UserMembership model will replace this global roleId in next phase
  9. Update CompanyApplication:
     - status = APPROVED
     - reviewedById = platform admin user id
     - reviewedAt = now
     - approvedCompanyId = new company id
})
```

**Error handling**:
- Returns `400` if application is not PENDING
- Returns `500` with message (not stack trace) if Standard plan or Super Admin role missing
- Full rollback on any transaction failure

---

## Rejection Behavior

When `POST /api/platform/company-applications/[id]/reject` is called:

- Validates application is PENDING
- Requires non-empty `rejectionReason` in request body
- Updates `CompanyApplication`:
  - `status = REJECTED`
  - `rejectionReason = body.rejectionReason`
  - `reviewedById = platform admin user id`
  - `reviewedAt = now`
- Does **not** create any resources (Company, User, Subscription, Settings)
- The rejection reason is shown on the application detail page

---

## Slug Generation

**Function**: `generateUniqueSlug(tx: any, name: string)` in `approve/route.ts`

```
"Test Agency Ltd" → "test-agency-ltd"
"  Al-Juraid Co.!  " → "al-juraid-co"
If "test-agency-ltd" exists → "test-agency-ltd-1"
If "test-agency-ltd-1" exists → "test-agency-ltd-2"
```

Algorithm:
1. `toLowerCase().trim()`
2. Remove non-alphanumeric/space/hyphen characters
3. Replace spaces and underscores with `-`
4. Collapse multiple consecutive hyphens
5. Trim leading/trailing hyphens
6. Fallback to `"company"` if result is empty
7. Loop until unique inside transaction using `tx.company.findUnique`, appending incrementing counter

---

## Schema Field: `User.isPlatformAdmin`

```prisma
model User {
  ...
  isPlatformAdmin Boolean @default(false)
  ...
}
```

> [!NOTE]
> `User.roleId` is intentionally **not removed** in this phase. Platform Admin users are still assigned a role (typically "Super Admin") to satisfy the `roleId NOT NULL` constraint. The `isPlatformAdmin` flag acts as a separate overlay permission layer.

---

## Temporary `roleId` Compatibility Note

> [!WARNING]
> When a new owner User is created during the approval transaction, they are temporarily assigned the `Super Admin` role at the global level via `User.roleId`. This is a temporary measure to satisfy the database constraint.
>
> In the **next SaaS phase**, `UserMembership` will be introduced to provide per-company role assignments, and the global `User.roleId` dependency for company-level access control will be deprecated.
>
> A `TODO` comment marks this location in `src/app/api/platform/company-applications/[id]/approve/route.ts`.

---

## Platform Admin Seeding Safety Rules

The database seeding script (`prisma/seed.ts`) supports provisioning a platform administrator:
- Reads `PLATFORM_ADMIN_EMAIL` and `PLATFORM_ADMIN_PASSWORD` from environment variables.
- If missing, the seed prints an informational note and continues without crashing.
- Dev values (`platform@agency.com` / `PlatformAdmin@2026!`) are defined in gitignored `.env` files for local dev helpers only.

> [!CAUTION]
> **Production Credentials Protection**: Hardcoded credentials must never be included in production configuration files, Dockerfiles, or production documentation. Production environments must define `PLATFORM_ADMIN_EMAIL` and `PLATFORM_ADMIN_PASSWORD` with long, randomly generated secure credentials.

---

## Manual QA Checklist

### 1. Inbound Application Validation
- [ ] Fill the `/apply` page. Submit an application. Verify it redirects to `/apply/success`.
- [ ] Attempt to submit a duplicate application with the same company name or owner email. Verify a `409 Conflict` is returned.

### 2. Platform Admin Dashboard & Authentication
- [ ] Log in as a non-admin ERP user (e.g. `hr@agency.com`). Navigate to `/platform` or make requests to protected `/api/platform/*` endpoints. Verify they redirect to `/denied` (frontend) or return `403 Forbidden` (API).
- [ ] Log in as a Platform Admin (`platform@agency.com`). Verify navigation sidebar contains the **Platform Admin** link.
- [ ] Access the platform admin dashboard. Check if counters load and status list is filtered correctly.

### 3. Application Approval Cycle
- [ ] Open a PENDING registration dossier. Verify detail layout loads.
- [ ] Click "Approve & Activate Company". Verify the confirmation modal shows.
- [ ] Approve the application. Check if:
  - [ ] A new `Company` is created with status `ACTIVE`.
  - [ ] A `CompanySubscription` is created pointing to `STANDARD` plan with status `ACTIVE`.
  - [ ] `CompanySettings` are provisioned.
  - [ ] Owner `User` is created or upgraded to `Super Admin`.
  - [ ] `CompanyApplication` status updates to `APPROVED` with auditor audit attribution.
- [ ] Check if the application detail view now displays the status as "APPROVED" and hides action controls.

### 4. Application Rejection Cycle
- [ ] Create a new application. Log in as Platform Admin.
- [ ] Open the new PENDING application. Click "Reject Application".
- [ ] Submit rejection without a reason. Verify validation prevents it.
- [ ] Enter a rejection reason and confirm. Check if status updates to `REJECTED` and no company/owner entities are created.
- [ ] Verify the rejection reason shows on the detail page.

---

## Navigation Updates

### Public Navigation
The landing page (`/`), apply page (`/apply`), and success page (`/apply/success`) each include their own lightweight public navbar with:
- VisaTek brand logo
- Login and Apply CTAs

### Authenticated Navigation (Sidebar)
The sidebar already conditionally shows the **Platform Admin** link:
```tsx
{user.isPlatformAdmin && (
  <Link href="/platform">Platform Admin</Link>
)}
```
Normal ERP users (non-platform-admin) do **not** see this link.

---

## What's Next (Phase 5+)

- **UserMembership** model for per-company role assignments
- Full tenant scoping: add `companyId` to Applicant, Agent, JobOrder, Invoice, Receipt, Commission
- Remove global `User.roleId` dependency for company ERP access
- Email notifications on approval/rejection
- Billing/payment gateway integration
- Company management dashboard for platform admins
- Safe data migration script to isolate pre-existing ERP database records under a primary default tenant.
