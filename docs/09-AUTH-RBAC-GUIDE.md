# 09 — Auth & RBAC Guide

This document explains the complete authentication and role-based access control system.

---

## Login Flow

```
1. User visits /login page
2. Enters email and password
3. Frontend calls POST /api/auth/login
4. Backend:
   a. Validates email + password fields
   b. Fetches User record from PostgreSQL (includes Role)
   c. Checks user.isActive (deactivated users are blocked)
   d. Verifies password hash with argon2.verify()
   e. Creates access token (15 min JWT)
   f. Creates refresh token (7 day JWT)
   g. Fetches all permissions for user's role from RolePermission table
   h. Stores refresh token in HttpOnly Secure SameSite=Strict cookie
   i. Writes LOGIN_SUCCESS audit log
   j. Returns { accessToken, user: { ..., permissions: [...] } }
5. Frontend (MockAuthContext):
   a. Stores accessToken in React state (memory, not localStorage)
   b. Stores user + permissions in context
   c. Sets up a 10-minute interval to silently refresh the access token
   d. Redirects:
      - Role "Applicant" → /applicant/portal
      - All other roles → /dashboard
```

---

## Access Token

**Algorithm:** HS256 (HMAC-SHA256)  
**Library:** `jose` (edge-compatible, zero native crypto dependency)  
**Expiry:** 15 minutes (configurable via `JWT_ACCESS_EXPIRES_IN` env var)  
**Stored:** React state only (in-memory) — never in localStorage or cookies  
**Sent:** `Authorization: Bearer <accessToken>` header on every API call  

**Payload:**
```json
{
  "userId": "uuid",
  "email": "admin@agency.com",
  "roleName": "Super Admin",
  "iat": 1234567890,
  "exp": 1234568790
}
```

**Why in-memory?** Storing the access token in localStorage exposes it to XSS attacks. Memory-only storage means it's lost on page refresh — but the refresh token cookie handles re-authentication automatically.

---

## Refresh Token

**Algorithm:** HS256  
**Expiry:** 7 days (configurable via `JWT_REFRESH_EXPIRES_IN` env var)  
**Stored:** HttpOnly, Secure, SameSite=Strict cookie  

**Cookie attributes:**
```
Name: refreshToken
HttpOnly: true         (cannot be accessed by JavaScript — XSS protection)
Secure: true           (HTTPS only in production)
SameSite: Strict       (no cross-site cookie sending — CSRF protection)
Path: /                (available to all API routes)
```

**Payload:**
```json
{ "userId": "uuid", "iat": ..., "exp": ... }
```

**Silent refresh mechanism:**  
On page load, `MockAuthContext` calls `POST /api/auth/refresh`. The browser automatically sends the refresh cookie. If valid, a new access token is returned. If invalid or expired, the user is redirected to `/login`.

The refresh is also called every 10 minutes via `setInterval` to keep the access token alive during active sessions.

---

## Role Model

Roles are stored in the `Role` table and assigned to users via `User.roleId`.

**Seeded roles:**
| Role Name | Key Capabilities |
|-----------|----------------|
| Super Admin | Full system access + RBAC management |
| Operations Admin | Full pipeline + exports, no RBAC |
| HR Officer | Applicant intake + early stages |
| Documentation Officer | Document verify + compliance stages |
| Visa Officer | Visa + departure stages |
| Accounts Officer | Full financial management |
| Agent | Own candidates + commissions |
| Applicant | Own portal only |

---

## Permission Model

Permissions are stored in the `Permission` table. Each permission has a unique `name` (the permission code) and a `module` grouping label.

**All permission codes:**
```
VIEW_DASHBOARD
VIEW_APPLICANTS
CREATE_APPLICANT
UPDATE_APPLICANT
ARCHIVE_APPLICANT
TRANSITION_WORKFLOW
UPLOAD_DOCUMENT
VERIFY_DOCUMENT
MANAGE_AGENTS
RECORD_PAYMENT
VIEW_ACCOUNTS
VIEW_COMMISSIONS
VIEW_REPORTS
VIEW_AUDIT_LOGS
MANAGE_RBAC
VIEW_NOTIFICATIONS
```

---

## RolePermission Model

The `RolePermission` join table links each Role to its allowed permissions. This is the authoritative source for what each role can do.

**Example data:**
```
Role: HR Officer
Permissions: VIEW_DASHBOARD, VIEW_APPLICANTS, CREATE_APPLICANT, UPDATE_APPLICANT, TRANSITION_WORKFLOW, UPLOAD_DOCUMENT, VIEW_NOTIFICATIONS
```

**This is fully dynamic:** Permissions can be added or removed from any role in the database, and the change takes effect at the next login (permissions are loaded fresh at login time).

---

## How the Frontend Uses Permissions

**At login:** The login API returns `permissions: PermissionCode[]` in the response. These are stored in `MockAuthContext` on the `currentUser.permissions` array.

**Permission check:**
```tsx
// In any component
const { hasAccess } = useMockAuth();

// Show element only if user has permission
if (!hasAccess("CREATE_APPLICANT")) return null;

// In Sidebar.tsx — hide nav items
if (link.permission && !hasAccess(link.permission)) return null;
```

**hasAccess implementation:**
```ts
const hasAccess = (permission: PermissionCode): boolean => {
  if (!currentUser) return false;
  return currentUser.permissions.includes(permission);
};
```

**Important:** Frontend gating is for UX only. A user with devtools could technically call an API with the access token — the backend always verifies permissions independently.

---

## How the Backend Enforces Permissions

Every API route handler follows this pattern:

```ts
// 1. Authenticate
const decoded = await authenticateRequest(request);
if (!decoded) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

const { userId, roleName } = decoded;

// 2. Load permissions from database
const permissions = await getUserPermissions(userId);

// 3. Check required permission
const isSuperOrOps = roleName === "Super Admin" || roleName === "Operations Admin";
if (!isSuperOrOps && !permissions.includes("REQUIRED_PERMISSION")) {
  return NextResponse.json({ error: "Forbidden." }, { status: 403 });
}
```

`getUserPermissions(userId)` in `src/lib/rbac.ts`:
1. Fetches the user's `roleId`
2. Queries `RolePermission` for all permissions linked to that roleId
3. Returns an array of `PermissionCode` strings

---

## Difference Between Role Checks and Permission Checks

**Role check** — tests the role name string directly:
```ts
if (roleName === "Super Admin" || roleName === "Operations Admin") { ... }
```
Used for: fast shortcircuit for admin-level overrides, boundary enforcement for Agent/Applicant roles.

**Permission check** — tests the permissions array from the database:
```ts
if (!permissions.includes("TRANSITION_WORKFLOW")) { return 403; }
```
Used for: all regular access control — respects any future permission reassignment.

**Why both?** Role names are embedded in the JWT and always available without a DB call. Permissions require a DB query. So role checks handle the fast cases (admin override, Applicant block), while permission checks handle the nuanced access control.

---

## Role-Specific Data Boundaries

### Agent Data Boundary
When an Agent makes any request to `/api/applicants`, the backend:
1. Identifies the role from the JWT: `roleName === "Agent"`
2. Fetches the Agent record: `prisma.agent.findUnique({ where: { userId } })`
3. Enforces: `where.agentId = agent.id` in all queries
4. If the Agent has no profile: returns empty dataset gracefully

This means an Agent **physically cannot** retrieve another agent's applicants — the database query itself restricts the result set.

Same boundary applies to:
- `GET /api/finance/commissions` — `agentIdScope = agent.id`
- `POST /api/applicants` — `enforcedAgentId = agent.id` (auto-assigned)
- `PATCH /api/applicants/[id]` — checks `applicant.agentId === agent.id`
- `POST /api/applicants/[id]/documents` — checks `applicant.agentId === agent.id`

### Applicant Data Boundary
When an Applicant makes requests:
- `GET /api/applicants` → **403** — blocked entirely
- `GET /api/applicants/[id]` → checks `applicant.userId === userId` AND `userProfile.applicantProfile.id === id`
- `GET /api/applicant/portal` → fetches `prisma.applicant.findUnique({ where: { userId } })` — only their own record
- `POST /api/applicants/[id]/documents` → checks `applicant.userId === userId`
- Financial APIs (invoices, receipts, ledger) → **403** — blocked

### Staff Boundaries
All staff roles (HR Officer, Documentation Officer, Visa Officer, Accounts Officer) see ALL applicants without agent or applicant scoping. Their restrictions are at the action level — what they can do — not at the data visibility level.

---

## Token Secrets

**Minimum secret length:** 64 characters (recommended)  
**How to generate:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Environment variables:**
```
JWT_ACCESS_SECRET=...   # Signs access tokens
JWT_REFRESH_SECRET=...  # Signs refresh tokens
```

**IMPORTANT:** Use different secrets for access and refresh tokens. If either secret is compromised, rotate it immediately — all existing tokens signed with the old secret will become invalid (effectively logging everyone out).
