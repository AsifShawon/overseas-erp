# 18H — Notifications and PDF Documents

## Overview

Full notification and PDF document layer for the VisaTek ERP SaaS platform.
All notifications and PDFs are strictly company-scoped using `activeCompanyId`.

---

## Notification Channels

| Channel   | Description                                             | Default      |
|-----------|---------------------------------------------------------|--------------|
| IN_APP    | Stored in `Notification` table, shown in UI             | Always       |
| EMAIL     | Sent via SMTP (nodemailer) using existing email service  | Important events |
| WEB_PUSH  | Browser push via VAPID/web-push package                 | If subscribed |

---

## Notification Types

```
ACCOUNT_ACTIVATION, TEMP_LOGIN_OR_INVITE, PASSWORD_CHANGED
COMPANY_APPROVED, COMPANY_REJECTED, COMPANY_SUSPENDED
APPLICANT_CREATED, APPLICANT_STAGE_CHANGED
APPLICANT_DOCUMENT_MISSING, APPLICANT_DOCUMENT_UPLOADED
DOCUMENT_VERIFICATION_REQUIRED, DOCUMENT_REJECTED
INTERVIEW_DUE, MEDICAL_DUE, BMET_DUE, VISA_FOLLOWUP_DUE
TICKET_DUE, DEPLOYMENT_DUE
PAYMENT_DUE, PAYMENT_RECEIVED
INVOICE_CREATED, INVOICE_DUE_TOMORROW, INVOICE_OVERDUE
RECEIPT_CREATED
COMMISSION_DUE, COMMISSION_PAID
TASK_ASSIGNED, TASK_DUE_TOMORROW, TASK_OVERDUE
PLATFORM_NEW_COMPANY_APPLICATION, PLATFORM_COMPANY_APPROVED, PLATFORM_SMTP_FAILURE
```

---

## Notification Model Fields (Extended)

| Field          | Type      | Description                                |
|----------------|-----------|--------------------------------------------|
| id             | String    | Primary key (UUID)                         |
| userId         | String    | Target user                                |
| title          | String    | Short title                                |
| message        | String    | Full notification body                     |
| type           | String    | NotificationType code                      |
| priority       | String    | LOW / NORMAL / HIGH / CRITICAL             |
| channel        | String    | IN_APP / EMAIL / WEB_PUSH / MULTI          |
| isRead         | Boolean   | Read flag                                  |
| readAt         | DateTime? | When marked read                           |
| actionUrl      | String?   | Link user can follow                       |
| relatedModel   | String?   | Related entity (Invoice, Task, etc.)       |
| relatedId      | String?   | Related entity ID                          |
| dueAt          | DateTime? | For due reminders                          |
| companyId      | String?   | Tenant isolation (null = platform)         |
| createdAt      | DateTime  | Timestamp                                  |

---

## New Models Added

### NotificationDelivery
Tracks per-channel delivery status (PENDING/SENT/FAILED/SKIPPED).

### WebPushSubscription
Stores browser push subscriptions per user. `endpoint` is unique.
Auto-deactivated when server receives 410/404 from push service.

### NotificationPreference
Per-user toggle: emailEnabled, pushEnabled, inAppEnabled, categories JSON.

### Task
Company-scoped task/reminder model with assignedToId, assignedRoleId, dueAt, status, priority.

### ReminderLog
Deduplication log for cron-fired reminders.
Unique on `(companyId, reminderKey, reminderDate)` — prevents duplicate reminders per day.

---

## Notification Service API

```typescript
import { notifyUser, notifyCompanyAdmins, notifyPlatformAdmins,
         notifyRole, notifyAccountsTeam, notifyHrTeam,
         notifyDocumentationTeam, notifyVisaTeam,
         notifyApplicant, notifyAgent } from "@/lib/notifications/notification-service";
```

All functions are best-effort — exceptions are caught and logged, never rethrown.

---

## Role-Based Routing Matrix

| Event                          | Audience                                      |
|-------------------------------|-----------------------------------------------|
| Company application submitted  | Platform admins                               |
| Company approved               | Platform admins + company owner               |
| Staff invited                  | Invited user                                  |
| Password changed               | Affected user (email + in-app)                |
| Applicant created              | HR team + Admins + Agent (if linked)          |
| Applicant stage changed        | Relevant team by new stage + Agent/Applicant  |
| Document uploaded              | Documentation team                            |
| Document rejected              | Uploader/Applicant/Agent                      |
| Invoice created                | Accounts team + Applicant (if portal user)    |
| Receipt/payment received       | Accounts team + Applicant/Agent               |
| Commission due (30d+)          | Accounts team + Agent                         |
| Invoice due tomorrow           | Accounts team + Applicant                     |
| Invoice overdue                | Accounts team + Admins                        |
| Task due tomorrow              | Assigned user or role members                 |
| Task overdue                   | Assigned user/role + Admins                   |
| SMTP failure                   | Platform admins                               |

---

## Due Reminder Cron Behavior

**Endpoint:** `POST /api/cron/send-due-reminders`  
**Auth:** `Authorization: Bearer $CRON_SECRET`

**Scans:**
1. Invoices due tomorrow (outstanding > 0)
2. Overdue invoices (outstanding > 0, dueDate past)
3. Tasks due tomorrow (PENDING/IN_PROGRESS)
4. Overdue tasks
5. Commissions accrued 30+ days (unpaid)

**Deduplication:** Uses `ReminderLog` unique constraint `(companyId, reminderKey, reminderDate)`.
Running the cron twice in a day is safe — second run creates no duplicate notifications.

**Dev testing:**
```bash
curl -X POST http://localhost:3000/api/cron/send-due-reminders \
  -H "Authorization: Bearer your_cron_secret_here"
```

---

## Web Push Setup

1. Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

2. Add to `.env`:
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:support@yourapp.com
```

3. Service worker is at `public/sw.js` — automatically served by Next.js.

4. UI: `/settings/notifications` — Enable/Disable/Test browser notifications button.

**Permission policy:** Never request permission automatically on page load.
Only request when user clicks "Enable Browser Notifications."

---

## PDF Endpoints

| Endpoint                           | Type     | Permission         |
|------------------------------------|----------|--------------------|
| GET /api/finance/invoices/[id]/pdf | Invoice  | Accounts + VIEW_ACCOUNTS |
| GET /api/finance/receipts/[id]/pdf | Receipt  | Accounts + VIEW_ACCOUNTS |
| GET /api/reports/finance/pdf       | Report   | Accounts + VIEW_REPORTS |
| GET /api/reports/applicants/pdf    | Report   | HR/Docs + VIEW_APPLICANTS |
| GET /api/reports/commissions/pdf   | Report   | Accounts/Agent scoped |

All PDFs verify `companyId === activeCompanyId` before rendering.
Agents can only download their own commission report.

---

## SMTP / Email Integration

- Uses existing `sendImportantEmailNotification()` from `src/lib/email/email-service.ts`
- Only fires for types listed in `EMAIL_NOTIFICATION_TYPES`
- Respects `NotificationPreference.emailEnabled` per user
- Failures are logged in `EmailLog` but do not break the business action
- Critical types (password changed, activation, suspension) bypass preference checks

---

## Channel Policy

```
IN_APP:   Always created (unless isRead preference blocks — not implemented yet)
EMAIL:    If SMTP configured AND event type in EMAIL_NOTIFICATION_TYPES AND user preference allows
WEB_PUSH: If VAPID configured AND user has active subscription AND user preference allows
```

---

## Tenant Isolation Rules

- All notification creation passes `companyId = activeCompanyId` from verified session
- `notifyPlatformAdmins()` sets `companyId = null`
- No API accepts `companyId` from request body
- PDF endpoints verify `invoice.companyId === activeCompanyId` before rendering
- Platform notifications at `/api/platform/notifications` are only accessible to `isPlatformAdmin` users

---

## Platform Notifications

- Stored with `companyId = null` or `type` starting with `PLATFORM_`
- Accessible only at `/platform/notifications` (requires `isPlatformAdmin`)
- Not visible in company notification center

---

## New Pages

| Route                       | Description                              |
|-----------------------------|------------------------------------------|
| /notifications              | Enhanced notification center with filters|
| /settings/notifications     | Channel toggles, push setup, categories  |
| /platform/notifications     | Platform admin notification feed         |
| /tasks                      | Task management with create/update/filter|

---

## Known Limitations

- No SMS yet
- No WhatsApp yet
- No background queue/worker (cron is HTTP-triggered, not persistent)
- Email PDF attachments are future (currently sends link)
- Notification preference granularity can improve (per-type, not just per-category)
- No push retry logic for transient failures
- Mobile app push not implemented
- Commission PAID notifications not yet wired to commission-paid business action
