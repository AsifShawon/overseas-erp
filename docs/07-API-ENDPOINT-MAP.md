# 07 — API Endpoint Map

This document maps every endpoint in `src/app/api/`. All endpoints are route handlers in Next.js App Router format.

**Authentication:** Unless noted, all endpoints require a valid `Authorization: Bearer <accessToken>` header.

---

## Auth Endpoints

### POST /api/auth/login
**File:** `src/app/api/auth/login/route.ts`  
**Auth required:** No  
**Purpose:** Authenticate user with email and password  

**Request body:**
```json
{ "email": "admin@agency.com", "password": "SuperAdmin@2026!" }
```

**Response:**
```json
{
  "accessToken": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "admin@agency.com",
    "fullName": "System Administrator",
    "roleName": "Super Admin",
    "agentCode": null,
    "applicantId": null,
    "permissions": ["VIEW_DASHBOARD", "VIEW_APPLICANTS", ...]
  }
}
```

**Side effects:** Sets `refreshToken` HttpOnly cookie, writes LOGIN_SUCCESS audit log  
**Prisma models:** User, Role, RolePermission, Permission, AuditLog  

---

### POST /api/auth/logout
**File:** `src/app/api/auth/logout/route.ts`  
**Auth required:** Optional (clears cookie regardless)  
**Purpose:** End user session, clear refresh token cookie  

**Response:** `{ "message": "Logged out successfully." }`  

**Side effects:** Clears `refreshToken` cookie  

---

### POST /api/auth/refresh
**File:** `src/app/api/auth/refresh/route.ts`  
**Auth required:** Refresh token in HttpOnly cookie  
**Purpose:** Issue a new access token using the refresh token  

**Response:**
```json
{
  "accessToken": "eyJ...",
  "user": { "id": "...", "email": "...", "roleName": "...", "permissions": [...] }
}
```

---

### GET /api/auth/me
**File:** `src/app/api/auth/me/route.ts`  
**Auth required:** Bearer token  
**Purpose:** Return the current authenticated user's profile  

**Response:** User object with role and permissions  

---

## Applicants Endpoints

### GET /api/applicants
**File:** `src/app/api/applicants/route.ts`  
**Auth required:** Yes  
**Roles/Permissions:** All staff roles with VIEW_APPLICANTS; Agent (own only); Applicant: blocked  

**Query parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search name, passport, phone |
| `stage` | string | Filter by WorkflowStage enum value |
| `trade` | string | Filter by trade category |
| `country` | string | Filter by job order country |
| `agentId` | string | Filter by agent ID (ignored for Agent role — auto-scoped) |
| `archived` | boolean | `true` to show archived; default `false` |
| `page` | number | Page number (default: 1) |
| `pageSize` | number | Records per page (default: 10) |

**Response:**
```json
{
  "data": [{ "id": "...", "fullName": "...", "currentStage": "APPLIED", "agent": {...}, "jobOrder": {...} }],
  "meta": { "page": 1, "pageSize": 10, "total": 42, "totalPages": 5 }
}
```

**Prisma models:** Applicant, Agent, JobOrder  

---

### POST /api/applicants
**File:** `src/app/api/applicants/route.ts`  
**Auth required:** Yes  
**Roles/Permissions:** CREATE_APPLICANT  

**Request body:**
```json
{
  "fullName": "Ahmed Rahman",
  "passportNumber": "BA1234567",
  "passportExpiry": "2028-12-31",
  "dateOfBirth": "1990-05-15",
  "phone": "+8801712345678",
  "email": "ahmed@email.com",
  "trade": "Electrician",
  "nationality": "Bangladesh",
  "nidNumber": "1234567890",
  "address": "Dhaka, Bangladesh",
  "emergencyContact": "+8801800000000",
  "agentId": "uuid-or-null",
  "jobOrderId": "uuid-or-null"
}
```

**Response:** Created Applicant object (201)  
**Side effects:** Creates AuditLog (CREATE_APPLICANT)  
**Prisma models:** Applicant, AuditLog  

---

### GET /api/applicants/[id]
**File:** `src/app/api/applicants/[id]/route.ts`  
**Auth required:** Yes  
**Roles/Permissions:** VIEW_APPLICANTS; Agent: own only; Applicant: own profile only  

**Response:** Full applicant dossier including:
```json
{
  "id": "...", "fullName": "...", "currentStage": "...",
  "agent": {...}, "jobOrder": {...},
  "workflows": [...],
  "documents": [...],
  "invoices": [...],
  "receipts": [...],
  "ledgerEntries": [...]
}
```

**Prisma models:** Applicant, Agent, JobOrder, WorkflowHistory, Document, Invoice, Receipt, LedgerEntry  

---

### PATCH /api/applicants/[id]
**File:** `src/app/api/applicants/[id]/route.ts`  
**Auth required:** Yes  
**Roles/Permissions:** UPDATE_APPLICANT; Applicant role: blocked; Agent: own only  

**Request body:** Any subset of applicant fields (all optional in PATCH)  
**Response:** Updated Applicant object  
**Side effects:** Creates AuditLog (UPDATE_APPLICANT) with before/after delta  
**Prisma models:** Applicant, AuditLog  

---

### POST /api/applicants/[id]/workflows
**File:** `src/app/api/applicants/[id]/workflows/route.ts`  
**Auth required:** Yes  
**Roles/Permissions:** TRANSITION_WORKFLOW; Agent/Applicant: blocked  

**Request body:**
```json
{ "nextStage": "MEDICAL_FIT", "remarks": "Medical check confirmed OK" }
```

**Response:** Full updated applicant dossier  
**Side effects:** Updates Applicant.currentStage, creates WorkflowHistory, creates Notification (applicant + agent), creates AuditLog  
**Errors:** 400 if missing prerequisites; 403 if role not allowed for stage  
**Prisma models:** Applicant, WorkflowHistory, Notification, AuditLog, Agent, Document  

---

### POST /api/applicants/[id]/documents
**File:** `src/app/api/applicants/[id]/documents/route.ts`  
**Auth required:** Yes  
**Roles/Permissions:** UPLOAD_DOCUMENT; Agent: own only; Applicant: own only  

**Request:** multipart/form-data  
| Field | Type | Description |
|-------|------|-------------|
| `file` | File | PDF, JPG, or PNG, max 5MB |
| `documentType` | string | PASSPORT / MEDICAL_REPORT / etc. |
| `expiryDate` | string | Optional ISO date |
| `remarks` | string | Optional upload notes |

**Response:** Full updated applicant dossier  
**Side effects:** Saves file to `storage/applicants/{id}/documents/`, creates Document record, creates AuditLog, creates Notifications (for Admin/Docs staff)  
**Prisma models:** Document, AuditLog, Notification  

---

### GET /api/applicants/[id]/documents/[docId]
**File:** `src/app/api/applicants/[id]/documents/[docId]/route.ts`  
**Auth required:** Yes  
**Purpose:** Get single document metadata or update its status  

---

### PATCH /api/applicants/[id]/documents/[docId]
**File:** `src/app/api/applicants/[id]/documents/[docId]/route.ts`  
**Auth required:** Yes  
**Roles/Permissions:** VERIFY_DOCUMENT  
**Purpose:** Verify or reject a document  

**Request body:**
```json
{ "status": "VERIFIED", "remarks": "Document confirmed authentic" }
```

**Side effects:** Updates Document.status, sets Document.verifiedById, creates AuditLog  

---

### GET /api/applicants/[id]/documents/[docId]/download
**File:** `src/app/api/applicants/[id]/documents/[docId]/download/route.ts`  
**Auth required:** Yes (Bearer token)  
**Purpose:** Securely stream the document file from private storage  

**Response:** Binary file stream with appropriate Content-Type  
**Boundary enforcement:** Agent/Applicant can only download from their own applicant's documents  

---

### POST /api/applicants/[id]/invoices
**File:** `src/app/api/applicants/[id]/invoices/route.ts`  
**Auth required:** Yes  
**Roles/Permissions:** RECORD_PAYMENT  

**Request body:**
```json
{
  "amount": 85000.00,
  "dueDate": "2026-06-30",
  "description": "Processing and documentation fee"
}
```

**Response:** Created Invoice  
**Side effects:** Creates Invoice (auto-number INV-YYYY-XXXXX), creates LedgerEntry (INVOICE/debit), creates AuditLog (CREATE_INVOICE), creates Notification for applicant user  
**Prisma models:** Invoice, LedgerEntry, AuditLog, Notification  

---

### POST /api/applicants/[id]/receipts
**File:** `src/app/api/applicants/[id]/receipts/route.ts`  
**Auth required:** Yes  
**Roles/Permissions:** RECORD_PAYMENT  

**Request body:**
```json
{
  "invoiceId": "uuid-of-invoice",
  "amountPaid": 50000.00,
  "paymentMethod": "BANK_TRANSFER",
  "referenceNo": "TXN-20260510-001"
}
```

**Response:** Created Receipt  
**Side effects:** Creates Receipt (auto-number REC-YYYY-XXXXX), updates Invoice.outstanding (subtracts amountPaid), creates LedgerEntry (RECEIPT/credit) with running balance, creates AuditLog (RECORD_RECEIPT), creates Notification for applicant user  
**Prisma models:** Receipt, Invoice, LedgerEntry, AuditLog, Notification  

---

### PATCH /api/applicants/[id]/archive
**File:** `src/app/api/applicants/[id]/archive/route.ts`  
**Auth required:** Yes  
**Roles/Permissions:** ARCHIVE_APPLICANT  

**Request body:**
```json
{ "archive": true }
```
or
```json
{ "archive": false }
```

**Side effects:** Sets Applicant.isArchived + archivedAt, creates AuditLog (ARCHIVE_APPLICANT or RESTORE_APPLICANT)  

---

## Applicant Portal Endpoints

### GET /api/applicant/portal
**File:** `src/app/api/applicant/portal/route.ts`  
**Auth required:** Yes  
**Roles:** Applicant ONLY (403 for any other role)  

**Response:** Sanitized applicant dossier — document paths replaced with secure download URLs, all financial data included  
**Prisma models:** Applicant, Document, Invoice, Receipt, LedgerEntry, Agent, JobOrder  

---

## Finance Endpoints

### GET /api/finance/invoices
**File:** `src/app/api/finance/invoices/route.ts`  
**Auth required:** Yes  
**Roles/Permissions:** Super Admin, Ops Admin, Accounts Officer, or VIEW_ACCOUNTS; Agent/Applicant: blocked  

**Query parameters:** `search`, `page`, `pageSize`  

**Response:**
```json
{
  "data": [{ "invoiceNo": "INV-2026-8988", "amount": 85000, "outstanding": 35000, "status": "PARTIAL", ... }],
  "pagination": { "total": 120, "page": 1, "pageSize": 50 }
}
```

---

### GET /api/finance/receipts
**File:** `src/app/api/finance/receipts/route.ts`  
**Auth required:** Yes  
**Roles/Permissions:** Same as invoices  

**Response:** Paginated receipts with joined invoice and applicant data, resolved staff name for `receivedBy`  

---

### GET /api/finance/commissions
**File:** `src/app/api/finance/commissions/route.ts`  
**Auth required:** Yes  
**Roles:** Staff with VIEW_COMMISSIONS, or Agent (own only); Applicant: blocked  

**Query parameters:** `search`, `status` (ACCRUED/PAID/CANCELLED/ALL), `agentId`, `page`, `pageSize`  

**Response:**
```json
{
  "data": [...commissions...],
  "stats": { "totalAccrued": 500000, "totalPaid": 200000, "totalPending": 500000, "totalCancelled": 0, "totalCommissions": 15 },
  "pagination": { "total": 15, "page": 1, "pageSize": 50 }
}
```

---

### POST /api/finance/commissions/accrue
**File:** `src/app/api/finance/commissions/accrue/route.ts`  
**Auth required:** Yes  
**Roles/Permissions:** RECORD_PAYMENT  

**Request body:**
```json
{ "agentId": "uuid", "applicantId": "uuid", "jobOrderId": "uuid", "amount": 35000 }
```

**Response:** Created Commission (status: ACCRUED)  
**Side effects:** Creates Commission record, creates AuditLog (ACCRUE_COMMISSION)  

---

### PATCH /api/finance/commissions/[id]/payout
**File:** `src/app/api/finance/commissions/[id]/payout/route.ts`  
**Auth required:** Yes  
**Roles/Permissions:** RECORD_PAYMENT  

**Request body:**
```json
{ "payoutRef": "BANK-TXN-2026-0042", "payoutDate": "2026-05-20" }
```

**Response:** Updated Commission (status: PAID)  
**Side effects:** Creates AuditLog (PAYOUT_COMMISSION)  

---

## Accounts Endpoints

### GET /api/accounts/ledger
**File:** `src/app/api/accounts/ledger/route.ts`  
**Auth required:** Yes  
**Roles/Permissions:** Super Admin, Ops Admin, Accounts Officer, or VIEW_ACCOUNTS; Agent/Applicant: blocked  

**Query parameters:** `search`, `transactionType` (INVOICE/RECEIPT/ALL), `page`, `pageSize`  

**Response:**
```json
{
  "data": [{ "transactionType": "INVOICE", "debit": 85000, "credit": 0, "runningBalance": 85000, ... }],
  "stats": { "totalBilled": 500000, "totalCollected": 300000, "totalOutstanding": 200000, "totalCommissionsAccrued": 150000 },
  "pagination": { ... }
}
```

---

## Reports / Dashboard Endpoints

### GET /api/reports/dashboard
**File:** `src/app/api/reports/dashboard/route.ts`  
**Auth required:** Yes  
**Roles:** All staff and Agent; Applicant: blocked  

**Response:** Role-specific dashboard payload (see Module Guide for details per role)  

---

## Notifications Endpoints

### GET /api/notifications
**File:** `src/app/api/notifications/route.ts`  
**Auth required:** Yes  
**Purpose:** Fetch own notifications (scoped to logged-in user)  

**Query parameters:** `page`, `pageSize`, `unreadOnly` (optional)  
**Response:** Paginated notifications array  

---

### PATCH /api/notifications/[id]
**File:** `src/app/api/notifications/[id]/route.ts`  
**Auth required:** Yes  
**Purpose:** Mark a single notification as read  

**Request body:** `{ "isRead": true }`  

---

### POST /api/notifications/mark-all-read
**File:** `src/app/api/notifications/mark-all-read/route.ts`  
**Auth required:** Yes  
**Purpose:** Mark all own notifications as read  

---

## Audit Log Endpoints

### GET /api/audit-logs
**File:** `src/app/api/audit-logs/route.ts`  
**Auth required:** Yes  
**Roles/Permissions:** VIEW_AUDIT_LOGS  

**Query parameters:** `search`, `actionType`, `page`, `pageSize`  
**Response:** Paginated audit log entries with user name joins  

---

## Export Endpoints (CSV)

All export endpoints return a CSV file download response with UTF-8 BOM.

| Endpoint | Permission | Description |
|----------|-----------|-------------|
| `GET /api/exports/applicants` | VIEW_REPORTS | All applicants |
| `GET /api/exports/invoices` | VIEW_REPORTS | All invoices |
| `GET /api/exports/receipts` | VIEW_REPORTS | All receipts |
| `GET /api/exports/ledger` | VIEW_REPORTS | All ledger entries |
| `GET /api/exports/commissions` | VIEW_REPORTS | All commissions |
| `GET /api/exports/audit-logs` | VIEW_AUDIT_LOGS | All audit logs |

**Response headers:**
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="overseas-erp-applicants-2026-05-22.csv"
```
