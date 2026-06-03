# SaaS Tenant Isolation QA Checklist

This checklist is used for manual and automated verification of SaaS tenant isolation and scoping rules.

## QA Verification Protocol

### Phase 1: Corporate Owner Isolation

- [ ] **1. Login as Demo company owner** (`admin@agency.com` / `Password123!`)
  - [ ] Verify that session payload successfully resolves `activeCompanyId` to the ID of "Demo Overseas Agency".
- [ ] **2. Confirm dashboard shows only Demo data**
  - [ ] Inspect the dashboard stats. Confirm totals match only Demo Overseas Agency records.
  - [ ] Open developer tools. Verify `/api/reports/dashboard` response contains no records or stats from other companies.
- [ ] **3. Confirm applicant list shows only Demo applicants**
  - [ ] Open the applicant directory. Confirm only Demo applicants are visible.
- [ ] **4. Confirm finance shows only Demo finance**
  - [ ] Open Invoices, Receipts, and General Ledger tabs.
  - [ ] Confirm no financial transactions from other agencies appear.
- [ ] **5. Confirm documents show only Demo documents**
  - [ ] Open the documents repository. Confirm only Demo uploaded files exist.

---

### Phase 2: Second Tenant Isolation Checks

- [ ] **6. Login as Test Study Abroad owner** (`owner@teststudy.local` / `Password123!`)
  - [ ] Verify that session payload resolves `activeCompanyId` to the ID of "Test Study Abroad Agency".
- [ ] **7. Confirm dashboard shows only Test company data**
  - [ ] Verify dashboard totals match the seeded B company (e.g. 1 applicant, 1 job order, 1 invoice, 1 receipt).
- [ ] **8. Confirm Test company cannot open Demo applicant detail by URL**
  - [ ] Try navigating to or requesting `/api/applicants/<Demo-Applicant-ID>`.
  - [ ] Verify that a `404 Not Found` error response is returned instead of leaking applicant information.
- [ ] **9. Confirm Test company cannot download Demo documents by URL**
  - [ ] Try requesting `/api/documents/<Demo-Document-ID>/download` or `/api/applicants/<Demo-Applicant-ID>/documents/<Demo-Document-ID>/download`.
  - [ ] Verify a `404 Not Found` error is returned.
- [ ] **10. Confirm Test company cannot open Demo invoice/receipt by URL**
  - [ ] Try requesting detail/download endpoints for a Demo invoice ID.
  - [ ] Verify that the request is blocked with a 404 or 403 response.
- [ ] **11. Confirm Test company exports only Test data**
  - [ ] Run the CSV exports for applicants, ledger, invoices, receipts, and audit logs.
  - [ ] Open the downloaded CSV files and confirm they contain only "Test Study Abroad Agency" records.

---

### Phase 3: Portal & Role Boundaries

- [ ] **12. Agent sees only own company and own applicants**
  - [ ] Login as a sourced Agent (`agent@teststudy.local` / `Password123!`).
  - [ ] Confirm the agent dashboard shows only agent-scoped counts.
  - [ ] Verify the agent cannot view applicants of other agents within the same or different companies.
- [ ] **13. Applicant sees only own profile**
  - [ ] Login as candidate (`applicant@teststudy.local` / `Password123!`).
  - [ ] Request applicant profile API `/api/applicant/portal`.
  - [ ] Confirm only own candidate details are returned.
- [ ] **14. Platform Admin can still access /platform**
  - [ ] Login as platform administrator (`admin@platform.local`).
  - [ ] Verify access is granted to `/platform/company-applications`.
- [ ] **15. Normal company user cannot access /platform**
  - [ ] Try requesting platform routes as a normal company admin/user.
  - [ ] Verify a `403 Forbidden` response is returned.
