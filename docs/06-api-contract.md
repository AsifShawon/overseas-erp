# API Contract & Endpoint Specifications

This document defines the REST API surface for the Overseas Manpower ERP. All server actions, routes, payloads, and response interfaces must conform strictly to these contracts.

---

## 1. Global Conventions

* **Base URL**: `/api` (or relative routes mapped via Next.js API/Route Handlers).
* **Consistent Auth Strategy**:
  * **Access Token**: Short-lived JWT access token (15-minute expiry) returned in the JSON response body.
  * **Refresh Token**: Long-lived JWT refresh token (7-day expiry) sent via a secure, `HttpOnly`, `SameSite=Strict`, `Secure` cookie.
  * ⚠️ **Strict Constraint**: The client **must NOT** store the refresh token in `localStorage` or `sessionStorage` under any circumstances to prevent XSS exfiltration.
* **Headers**:
  * `Authorization`: `Bearer <JWT_ACCESS_TOKEN>` (required for all protected routes).
  * `Content-Type`: `application/json` (standard payload transmission).
* **Paginated Requests Query Format**:
  `GET /api/applicants?page=1&limit=10&search=PassportNo&stage=SELECTED`
* **Error Response Interface**:
  All API error responses must adhere to the standard payload below, accompanied by appropriate HTTP status codes (e.g., 400, 401, 403, 404, 422, 500):
  ```typescript
  interface ApiError {
    success: false;
    error: {
      code: string;       // Unique internal system code (e.g., "PASSPORT_ALREADY_EXISTS")
      message: string;    // Human-readable debug context
      details?: Record<string, string[]>; // Validation issues per property
    };
  }
  ```

---

## 2. Core Endpoint Specifications

### A. Authentication & Claim Module

#### `POST /api/auth/login`
* **Access**: Public
* **Request Payload**:
  ```typescript
  interface LoginRequest {
    email: string;
    password: string;
    twoFactorCode?: string; // Required if 2FA is active
  }
  ```
* **Success Response (200 OK)**:
  * *Headers*:
    `Set-Cookie: refreshToken=<REFRESH_TOKEN>; HttpOnly; Secure; SameSite=Strict; Path=/api/auth/refresh; Max-Age=604800`
  * *Body*:
    ```typescript
    interface LoginResponse {
      success: true;
      accessToken: string;
      expiresIn: number; // 900 seconds (15 mins)
      user: {
        id: string;
        email: string;
        fullName: string;
        roleName: string; // Dynamic role string from DB
        agentCode?: string;     // Included if user links to Agent profile
        applicantId?: string;   // Included if user links to Applicant profile
      };
    }
    ```

#### `POST /api/auth/refresh`
* **Access**: Public (Validates the HTTP-Only cookie `refreshToken`)
* **Success Response (200 OK)**:
  ```typescript
  interface RefreshTokenResponse {
    success: true;
    accessToken: string;
    expiresIn: number;
  }
  ```

#### `POST /api/auth/invitations`
* **Access**: Staff only (`INVITE_USERS` permission). Generates an invite token/link for agents or staff.
* **Request Payload**:
  ```typescript
  interface InviteUserRequest {
    email: string;
    fullName: string;
    roleId: string;
    agentCode?: string; // Optional code if binding to agent tier
  }
  ```
* **Success Response (201 Created)**:
  ```typescript
  interface InviteUserResponse {
    success: true;
    inviteToken: string;
    expiresAt: string;
  }
  ```

#### `POST /api/auth/claims`
* **Access**: Public. Initiates the access claim for an unclaimed pre-registered Applicant.
* **Request Payload**:
  ```typescript
  interface InitiateClaimRequest {
    passportNumber: string;
    phone: string;
    email: string; // Candidate inputs contact where they'll receive OTP
  }
  ```
* **Success Response (200 OK)**:
  ```typescript
  interface InitiateClaimResponse {
    success: true;
    claimSessionId: string;
    message: "OTP sent successfully to registered phone number.";
  }
  ```

#### `POST /api/auth/claims/verify`
* **Access**: Public. Verifies OTP and binds candidate's newly created `User` account to the pre-existing unclaimed `Applicant` profile.
* **Request Payload**:
  ```typescript
  interface VerifyClaimRequest {
    claimSessionId: string;
    otpCode: string;
    passwordHash: string; // Password chosen by Applicant for future logins
  }
  ```
* **Success Response (200 OK)**:
  ```typescript
  interface VerifyClaimResponse {
    success: true;
    message: "Portal account successfully claimed and bound.";
    userId: string;
    applicantId: string;
  }
  ```

---

### B. Applicant & Workflow Modules

#### `POST /api/applicants`
* **Access**: HR Officer, Operations Admin, or Agent. (If Agent, the candidate is implicitly bound to `agentId = session.agentId`).
* **Request Payload**:
  ```typescript
  interface CreateApplicantRequest {
    passportNumber: string;
    passportExpiry: string;
    nationality?: string;
    trade: string;
    
    // Bio-data fields
    fullName: string;
    phone: string;
    email?: string;
    dateOfBirth: string; // ISO Date
    nidNumber?: string;
    address?: string;
    emergencyContact?: string;
  }
  ```
* **Success Response (201 Created)**:
  ```typescript
  interface CreateApplicantResponse {
    success: true;
    applicantId: string;
    passportNumber: string;
    currentStage: "APPLIED";
    message: "Applicant profile created successfully.";
  }
  ```

#### `PATCH /api/applicants/:id`
* **Access**: HR Officer, Operations Admin, or Agent (only if applicant's `agentId` matches session agent ID).
* **Request Payload**:
  ```typescript
  interface UpdateApplicantRequest {
    fullName?: string;
    phone?: string;
    email?: string;
    dateOfBirth?: string;
    nidNumber?: string;
    address?: string;
    emergencyContact?: string;
    trade?: string;
    passportExpiry?: string;
  }
  ```
* **Success Response (200 OK)**:
  ```typescript
  interface UpdateApplicantResponse {
    success: true;
    applicantId: string;
    message: "Applicant profile updated successfully.";
  }
  ```

#### `GET /api/applicants`
* **Access**: Restricted.
  * *Super Admin / Operations Admin / Officers*: Reads all candidates.
  * *Agent*: **Strictly returns candidates submitted by the authenticated agent ID**.
  * *Applicant*: **403 Forbidden** (Applicants must use `/api/applicants/my-progress`).
* **Success Response (200 OK)**:
  ```typescript
  interface ApplicantListResponse {
    success: true;
    data: {
      id: string;
      fullName: string;
      passportNumber: string;
      trade: string;
      currentStage: string;
      agentName: string | null;
      updatedAt: string;
      isArchived: boolean;
    }[];
    pagination: {
      total: number;
      page: number;
      limit: number;
    };
  }
  ```

#### `GET /api/applicants/:id`
* **Access**: Restricted.
  * *Agent*: Allowed *only* if the applicant's `agentId` matches the session agent ID.
  * *Applicant*: Allowed *only* if the applicant's `userId` matches the session user ID.
* **Success Response (200 OK)**:
  ```typescript
  interface ApplicantDetailResponse {
    success: true;
    data: {
      id: string;
      fullName: string;
      email: string | null;
      phone: string;
      passportNumber: string;
      passportExpiry: string;
      trade: string;
      currentStage: string;
      jobOrderNo: string | null;
      agentCode: string | null;
      ledgerBalance: number;
      isArchived: boolean;
      documents: {
        id: string;
        documentType: string;
        fileName: string;
        fileUrl: string;
        status: string;
      }[];
    };
  }
  ```

#### `PATCH /api/applicants/:id/workflow`
* **Access**: Staff Roles only (`SUPER_ADMIN`, `OPERATIONS_ADMIN`, `HR_OFFICER`, `DOCUMENTATION_OFFICER`, `VISA_OFFICER`).
* **Request Payload**:
  ```typescript
  interface WorkflowTransitionRequest {
    newStage: "INTERVIEWED" | "SELECTED" | "MEDICAL_WAITING" | "MEDICAL_FIT" | "MEDICAL_UNFIT" | "TRAINING_COMPLETED" | "VISA_SUBMITTED" | "VISA_STAMPED" | "VISA_REJECTED" | "TICKETED" | "DEPLOYED";
    changeNotes?: string;
    stagePayload?: {
      medicalCenter?: string;       // For MEDICAL_WAITING
      visaStickerNumber?: string;  // For VISA_STAMPED
      pnrNumber?: string;          // For TICKETED
      flightNumber?: string;       // For TICKETED
      departureDate?: string;      // For TICKETED
    };
  }
  ```
* **Success Response (200 OK)**:
  ```typescript
  interface WorkflowTransitionResponse {
    success: true;
    message: string;
    newStage: string;
    historyId: string;
  }
  ```

#### `POST /api/applicants/:id/documents`
* **Access**: Applicant (only self), Agent (only own cohort), or Staff Roles. Uploads file attachment.
* **Request Payload (Multipart/Form-Data)**:
  - `documentType`: "PASSPORT" | "PHOTO" | "CV" | "MEDICAL_REPORT" | "POLICE_CLEARANCE" | "VISA_STICKER" | "AIR_TICKET" | "OTHER"
  - `file`: File binary attachment
* **Success Response (201 Created)**:
  ```typescript
  interface DocumentUploadResponse {
    success: true;
    documentId: string;
    documentType: string;
    fileName: string;
    status: "PENDING_VERIFICATION";
  }
  ```

#### `PATCH /api/applicants/:id/documents/:docId/verify`
* **Access**: `DOCUMENTATION_OFFICER` or `SUPER_ADMIN` only.
* **Request Payload**:
  ```typescript
  interface VerifyDocumentRequest {
    status: "VERIFIED" | "REJECTED" | "EXPIRED";
    rejectionReason?: string; // Optional context
  }
  ```
* **Success Response (200 OK)**:
  ```typescript
  interface VerifyDocumentResponse {
    success: true;
    documentId: string;
    status: "VERIFIED" | "REJECTED" | "EXPIRED";
    verifiedBy: string; // Staff ID
  }
  ```

---

### C. Accounts & Finance Modules

#### `POST /api/accounts/invoices`
* **Access**: `ACCOUNTS_OFFICER` or `SUPER_ADMIN` only.
* **Request Payload**:
  ```typescript
  interface CreateInvoiceRequest {
    applicantId: string;
    dueDate: string;
    amount: number;
    description: string;
  }
  ```
* **Success Response (201 Created)**:
  ```typescript
  interface CreateInvoiceResponse {
    success: true;
    invoiceId: string;
    invoiceNo: string;
    runningBalance: number;
  }
  ```

#### `POST /api/accounts/receipts`
* **Access**: `ACCOUNTS_OFFICER` or `SUPER_ADMIN` only.
* **Request Payload**:
  ```typescript
  interface RecordPaymentRequest {
    applicantId: string;
    invoiceId?: string; // Optional linkage to clear specific invoice
    amountPaid: number;
    paymentMethod: "CASH" | "BANK_TRANSFER" | "CHEQUE" | "MOBILE_BANKING";
    referenceNo?: string;
  }
  ```
* **Success Response (201 Created)**:
  ```typescript
  interface RecordPaymentResponse {
    success: true;
    receiptId: string;
    receiptNo: string;
    remainingBalance: number;
  }
  ```

#### `GET /api/applicants/:id/ledger`
* **Access**: Accounts, Ops, Super Admin, and the targeted Applicant *only*.
* **Success Response (200 OK)**:
  ```typescript
  interface LedgerStatementResponse {
    success: true;
    balance: number;
    entries: {
      id: string;
      transactionType: "INVOICE" | "RECEIPT" | "CREDIT_NOTE" | "DEBIT_NOTE";
      referenceNo: string;
      debit: number;
      credit: number;
      runningBalance: number;
      timestamp: string;
    }[];
  }
  ```

---

### D. Audit Log Module

#### `GET /api/audit-logs`
* **Access**: `SUPER_ADMIN` and `OPERATIONS_ADMIN` only.
* **Success Response (200 OK)**:
  ```typescript
  interface AuditLogResponse {
    success: true;
    logs: {
      id: string;
      email: string | null;
      role: string | null;
      actionType: string;
      tableName: string;
      recordId: string | null;
      delta: any | null;
      ipAddress: string | null;
      timestamp: string;
    }[];
  }
  ```

---

### E. Agent Management Module

#### `POST /api/agents`
* **Access**: `OPERATIONS_ADMIN` or `SUPER_ADMIN` only.
* **Request Payload**:
  ```typescript
  interface CreateAgentRequest {
    email: string;
    fullName: string;
    companyName: string;
    licenseNo?: string;
    tier?: "A" | "B" | "C";
  }
  ```
* **Success Response (201 Created)**:
  ```typescript
  interface CreateAgentResponse {
    success: true;
    agentId: string;
    agentCode: string; // Auto-generated shortcode
    message: "Agent profile created successfully.";
  }
  ```

#### `PATCH /api/agents/:id`
* **Access**: `OPERATIONS_ADMIN` or `SUPER_ADMIN` only.
* **Request Payload**:
  ```typescript
  interface UpdateAgentRequest {
    companyName?: string;
    licenseNo?: string;
    tier?: "A" | "B" | "C";
    isActive?: boolean;
  }
  ```
* **Success Response (200 OK)**:
  ```typescript
  interface UpdateAgentResponse {
    success: true;
    agentId: string;
    message: "Agent profile updated successfully.";
  }
  ```

---

### F. Notifications Module

#### `GET /api/notifications`
* **Access**: Any Authenticated User. Reads notifications for `session.userId`.
* **Success Response (200 OK)**:
  ```typescript
  interface NotificationListResponse {
    success: true;
    notifications: {
      id: string;
      title: string;
      message: string;
      isRead: boolean;
      createdAt: string;
    }[];
  }
  ```

#### `PATCH /api/notifications/:id/read`
* **Access**: Any Authenticated User. Marks notification owned by `session.userId` as read.
* **Success Response (200 OK)**:
  ```typescript
  interface MarkReadResponse {
    success: true;
    notificationId: string;
    isRead: true;
  }
  ```

---

### G. Reports Module

#### `GET /api/reports/pipeline-stats`
* **Access**: Operations Admin, Super Admin only.
* **Success Response (200 OK)**:
  ```typescript
  interface PipelineReportResponse {
    success: true;
    activeQuotaFilled: number;
    bottlenecks: {
      stage: string;
      candidateCount: number;
      averageDaysInStage: number;
    }[];
  }
  ```

#### `GET /api/reports/financials`
* **Access**: Accounts, Ops, Super Admin only.
* **Success Response (200 OK)**:
  ```typescript
  interface FinancialReportResponse {
    success: true;
    totalInvoiced: number;
    totalCollected: number;
    outstandingReceivables: number;
    commissionsAccrued: number;
    commissionsPaid: number;
    netMargin: number;
  }
  ```

---

## 3. Strict Backend Security Guard Validations

Backend handlers must run three validation checks before invoking database controllers:
1. **Schema Check**: Use validation libraries (e.g. `Zod`) to verify data structures (e.g., checking if `amountPaid` is a positive decimal and `paymentMethod` is an enum value).
2. **Access Control Check (Dynamic RBAC)**: Query user roles, verify associated dynamic permissions, and validate permissions exist (e.g. requiring the `RECORD_RECEIPT` permission).
3. **Data Scope Check**:
   ```javascript
   // Pseudo-code implementation for scoped validation
   if (req.user.roleName === 'AGENT') {
     const candidate = await prisma.applicant.findUnique({ where: { id: req.params.applicantId } });
     if (!candidate || candidate.agentId !== req.user.agentId) {
       return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Ownership validation failed." } });
     }
   } else if (req.user.roleName === 'APPLICANT') {
     const candidate = await prisma.applicant.findUnique({ where: { id: req.params.applicantId } });
     if (!candidate || candidate.userId !== req.user.id) {
       return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Personal data boundary violation." } });
     }
   }
   ```
