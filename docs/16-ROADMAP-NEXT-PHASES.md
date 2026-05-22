# 16 — Roadmap: Next Phases

This document outlines planned development phases beyond the current MVP (Phase 6E). Features are listed in priority order within each phase. **Nothing in this document is built — these are future plans only.**

---

## Phase 6D-B: Alert/Confirm/Prompt Replacement

**Priority:** High  
**Estimated effort:** Small  
**Status:** ❌ Not built  

### What this means

The current codebase may still use native browser `alert()`, `confirm()`, and `prompt()` calls in some UI pages. These:
- Look out of place in a professional ERP UI
- Cannot be styled to match the dark/light theme
- Block the browser main thread

### What to build

Replace all instances with:
- **`<Toast>` component** — non-blocking success/error/warning messages (driven by `ToastContext`)
- **`<Modal>` component** — styled confirmation dialogs (driven by `DialogContext`)
- **`<PromptDialog>` component** — styled input prompt dialogs for remarks/notes entry (e.g. stage gate override)

### Files affected
- `src/context/DialogContext.tsx` — already started, needs completion
- `src/context/ToastContext.tsx` — already started, needs completion
- All `page.tsx` files that contain `window.alert()`, `window.confirm()`, or `window.prompt()`

---

## Phase 7A: Applicant Portal Full Integration

**Priority:** High  
**Status:** 🔶 Partial (backend complete, frontend basic)  

### What remains to build

- [ ] Stage progress visualization with step-by-step visual indicator on the portal
- [ ] Document upload button directly from the portal (backend API supports it, UI button may be missing)
- [ ] Notification bell with unread count in the portal header
- [ ] Clear messaging when no applicant profile is linked to the user account
- [ ] Responsive mobile layout for the portal (candidates often access from phones)
- [ ] Language localization support (Bengali / Arabic for target demographics)

---

## Phase 7B: Agent Portal Polish

**Priority:** Medium  
**Status:** 🔶 Partial (uses staff sidebar with scoped data)  

### What remains to build

- [ ] Dedicated Agent landing page (currently uses same pages as staff with data scoped)
- [ ] Agent profile page (view own profile: agentCode, tier, company name)
- [ ] Commission statement view with filter by month
- [ ] Candidate submission form with better UX for agents
- [ ] Notifications tailored for agent events (stage updates for own candidates)

---

## Phase 7C: PDF Generation

**Priority:** High (for client readiness)  
**Status:** ❌ Not built  

### What to build

- [ ] **Invoice PDF** — professional invoice document with agency logo, applicant details, amount, due date
- [ ] **Receipt Voucher PDF** — payment confirmation document for candidates
- [ ] **Applicant Dossier PDF** — complete candidate profile for embassy or employer submissions
- [ ] **Commission Statement PDF** — for agent payment records

### Recommended tools
- `@react-pdf/renderer` — React-based PDF generation, runs server-side in Next.js API routes
- Or: Puppeteer headless browser for HTML-to-PDF conversion

### Implementation note
PDF generation should run in Next.js API route handlers, not in the browser. The frontend requests the PDF via an authenticated API endpoint, and the server returns a PDF binary response.

---

## Phase 7D: SMS / Email / WhatsApp Integrations

**Priority:** Medium  
**Status:** ❌ Not built (env vars are placeholders only)  

### What to build

- [ ] **Email notifications** — Transactional emails via SMTP (or SendGrid/SES) for:
  - Stage transition updates to applicant email
  - Invoice creation notifications
  - Document verification status
  - Password reset flow
- [ ] **SMS notifications** — via Twilio or local BD SMS gateway for:
  - OTP / login verification (optional 2FA)
  - Stage update SMS to applicant phone
  - Visa status alerts
- [ ] **WhatsApp notifications** — via WhatsApp Business API or Twilio for:
  - Stage updates
  - Document reminders
  - Deployment alerts

### Environment variables (already in `.env.example`)
```
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
```

---

## Phase 7E: Production Storage (S3 / R2 / Spaces)

**Priority:** High (for production deployment)  
**Status:** ❌ Not built (currently uses local filesystem)  

### The problem

Currently, documents are stored in `storage/applicants/` on the server's local filesystem. This:
- Does not scale across multiple server instances
- Is lost if the server is redeployed without preserving the volume
- Requires disk space management

### What to build

- [ ] Replace `src/lib/storage.ts` local file operations with cloud storage SDK calls
- [ ] Recommended options:
  - **AWS S3** — most widely supported, env vars already in `.env.example`
  - **Cloudflare R2** — S3-compatible, no egress fees, good for international access
  - **DigitalOcean Spaces** — simple S3-compatible storage
- [ ] Implement pre-signed URLs for secure temporary download links (replaces the custom download endpoint)
- [ ] Set up bucket policies to block public access
- [ ] Update the download API to use pre-signed URLs instead of file streaming

### Environment variables (already in `.env.example`)
```
AWS_S3_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
```

---

## Phase 7F: Deployment Hardening

**Priority:** High (before any production use)  
**Status:** ❌ Not done  

### What to do

- [ ] Move database to managed PostgreSQL (AWS RDS, Neon, Railway, or Supabase)
- [ ] Deploy Next.js app to Vercel, Railway, Render, or a VPS with PM2/Docker
- [ ] Configure HTTPS (SSL certificate via Let's Encrypt or cloud provider)
- [ ] Set `NODE_ENV=production` so HttpOnly cookies use `Secure: true`
- [ ] Set long, random JWT secrets in production environment variables
- [ ] Configure `DATABASE_URL` for production database with SSL mode
- [ ] Implement rate limiting on auth endpoints (prevent brute force)
- [ ] Set up automated database backups
- [ ] Configure CORS properly if the API is accessed from a separate frontend domain

---

## Phase 7G: Multi-Branch Support

**Priority:** Low (future expansion)  
**Status:** ❌ Not designed yet  

### What this means

Large agencies operate from multiple city offices (Dhaka, Chittagong, Sylhet). Currently the system is single-branch.

### What to build

- [ ] `Branch` model in schema (name, location, region)
- [ ] `User.branchId` — each user belongs to a branch
- [ ] `Applicant.branchId` — each applicant belongs to a branch
- [ ] Branch filter on all listing pages
- [ ] Branch-scoped data boundaries (similar to Agent scoping)
- [ ] Branch admin role (Super Admin of a single branch)
- [ ] Inter-branch candidate transfer workflow

---

## Phase 7H: Automated Reminders / Cron Jobs

**Priority:** Medium  
**Status:** ❌ Not built  

### What to build

- [ ] **Passport expiry reminders** — auto-notify staff 3 months before any passport expires
- [ ] **Document expiry reminders** — auto-notify when a medical report is expiring
- [ ] **Invoice overdue alerts** — auto-notify Accounts Officer for unpaid invoices past due date
- [ ] **Visa deadline reminders** — alert Visa Officer of upcoming embassy submission deadlines

### Implementation approach

Use an external cron service or a background job runner:
- **Vercel Cron Jobs** — built-in for Vercel deployments
- **node-cron** — for self-hosted deployments
- **BullMQ + Redis** — for complex job queuing needs

---

## Phase 7I: Testing Suite

**Priority:** High (for maintainability)  
**Status:** ❌ Not started  

### What to build

- [ ] **Unit tests** for business logic:
  - `workflow-rules.ts` — test all transition paths and role restrictions
  - `csv.ts` — test CSV escaping and injection protection
  - `storage.ts` — test file validation and sanitization
  - `auth.ts` — test token signing and verification
- [ ] **Integration tests** for API endpoints:
  - Auth flow (login → refresh → logout)
  - Applicant CRUD with RBAC
  - Workflow transitions including gate enforcement
  - Financial operations (invoice → receipt → ledger)
- [ ] **E2E tests** with Playwright or Cypress:
  - Full login and dashboard flow per role
  - Document upload and verification flow
  - Finance flow from invoice to payment

### Recommended tools
- **Vitest** — fast unit/integration test runner, works with Next.js
- **Playwright** — E2E browser automation

---

## Phase 7J: Security Hardening

**Priority:** High (for production)  
**Status:** ❌ Partially addressed  

### What to do

- [ ] **Rate limiting** — limit login attempts to prevent brute force (e.g. 5 attempts per minute per IP)
- [ ] **Two-factor authentication** — the `User.twoFactorSecret` field is in the schema but not wired up
- [ ] **Input sanitization review** — ensure all user inputs are sanitized before storage
- [ ] **Content Security Policy (CSP)** — add CSP headers in `next.config.ts`
- [ ] **Security headers** — X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security
- [ ] **Audit log integrity** — consider hashing audit log entries to detect tampering
- [ ] **Refresh token rotation** — issue a new refresh token on each use (prevents replay attacks)
- [ ] **Session invalidation** — store refresh token hash in DB for revocation on logout
- [ ] **OWASP top 10 review** — conduct a security review against OWASP guidelines before production launch

---

## Summary Roadmap Timeline

| Phase | Priority | Effort | Status |
|-------|----------|--------|--------|
| 6D-B: Alert/Confirm/Toast/Modal | High | Small | ❌ Not built |
| 7A: Applicant Portal Full | High | Medium | 🔶 Partial |
| 7B: Agent Portal Polish | Medium | Medium | 🔶 Partial |
| 7C: PDF Generation | High | Medium | ❌ Not built |
| 7D: SMS/Email/WhatsApp | Medium | Large | ❌ Not built |
| 7E: Production Storage (S3/R2) | High | Medium | ❌ Not built |
| 7F: Deployment Hardening | High | Medium | ❌ Not done |
| 7G: Multi-Branch Support | Low | Large | ❌ Not designed |
| 7H: Automated Reminders/Cron | Medium | Medium | ❌ Not built |
| 7I: Testing Suite | High | Large | ❌ Not started |
| 7J: Security Hardening | High | Medium | ❌ Partial |
