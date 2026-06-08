# Branching API and UI Quality Assurance Checklist

This document contains the verification checklist for testing multi-branch functionality, API scoping boundaries, user assignments, and admin control overlays.

## QA Checklists

### 1. Company Owner Branch Visibility
- [ ] Log in as Company Owner.
- [ ] Navigate to `/settings/branches`.
- [ ] Verify that all active branches are listed.
- [ ] Confirm counts of staff and applicants for each branch are loaded correctly.

### 2. Create Branch Form
- [ ] Log in as Company Owner.
- [ ] Click "Add Branch" or go to `/settings/branches/new`.
- [ ] Fill in Name, Code, City, Phone, and Email.
- [ ] Submit the form.
- [ ] Verify the new branch is shown in the list with status `ACTIVE`.
- [ ] Verify code uniqueness check works (submitting duplicate branch code fails).

### 3. Assign HR User to Branch
- [ ] Log in as Company Owner.
- [ ] Go to `/settings/branches/[id]`.
- [ ] Under the "Staff" tab, select an existing user and assign them to the branch.
- [ ] Verify user is successfully assigned.
- [ ] Remove or suspend a user from a branch and verify they can no longer access it.

### 4. Branch Scoping Visibility Limits
- [ ] Log in as HR Officer A (only assigned to Branch A).
- [ ] Verify that only applicants from Branch A are visible in the Applicants list.
- [ ] Verify that the Branch Selector in the Topbar shows "Branch A" and does not let the user switch to Branch B or "All Branches".

### 5. URL Bypass Restrictions (Direct Object References)
- [ ] Log in as HR Officer A.
- [ ] Try to access the detail URL of an applicant from Branch B directly: `/applicants/[branch-b-applicant-id]`.
- [ ] Verify the system shows `Forbidden` or redirects, blocking access.
- [ ] Perform similar test for invoice details or task details.

### 6. Writing to Inaccessible Branches
- [ ] Log in as HR Officer A.
- [ ] Try to submit a POST request to `/api/applicants` with `branchId` set to Branch B.
- [ ] Verify that the request fails with status `403 Forbidden` and is rejected.

### 7. Multi-Branch Switcher Behavior
- [ ] Log in as a user assigned to both Dhaka Branch and Chittagong Branch.
- [ ] Verify the Topbar shows a dropdown branch switcher.
- [ ] Select Dhaka Branch and confirm the dashboard reload restricts data to Dhaka.
- [ ] Select Chittagong Branch and confirm the dashboard changes to Chittagong stats.

### 8. Dashboard Scoped Metrics
- [ ] Select Branch A. Verify that counters show `1` active applicant, `1` open job order, and relevant accounts totals.
- [ ] Select Branch B. Verify that counters update to show stats corresponding to Branch B only.
- [ ] Select "All Branches" (as Admin). Verify that counters aggregate data from both branches.

### 9. CSV and PDF Reports Scoping
- [ ] Log in as HR Officer A. Export applicants to CSV.
- [ ] Verify that the CSV only contains candidates from Branch A.
- [ ] Confirm "Branch Name" and "Branch Code" columns are present in the CSV file.
- [ ] Repeat test for invoices, commissions, ledger entries, and receipts.

### 10. Notifications and Tasks Scoping
- [ ] As HR Officer A, verify tasks page only displays tasks assigned to you or your branch/role.
- [ ] As Admin, verify you can filter tasks by branch.
- [ ] Confirm that notifications generated for branch-related events contain the correct `branchId` and are only visible to authorized users.

### 11. Platform Admin Neutrality
- [ ] Log in as Platform Admin.
- [ ] Confirm you can access company and branch management features without active membership restrictions.

### 12. Cross-Company Tenant Isolation
- [ ] Verify that users from Company A cannot query or modify branches from Company B under any circumstances (enforced via `activeCompanyId` in session context).
