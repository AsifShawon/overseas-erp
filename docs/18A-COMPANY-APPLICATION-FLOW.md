# 18A — Company Application Flow

This document details the public application flow implemented during Phase 3 of the SaaS transition.

---

## Overview

In the SaaS model, new companies (manpower recruitment agencies, etc.) must submit a registration application to be reviewed by a Platform Super Admin. At this stage, no database records for a `Company`, `User`, `CompanySubscription`, or `CompanySettings` are created. The transaction only produces a `CompanyApplication` in the database with a status of `PENDING`.

---

## 1. User Interface (UI) Routes

* **Registration URL**: `/apply`
  * Features a clean, SaaS-style interface.
  * Fully supports dynamic Bangla/English translations out-of-the-box.
  * Captures bio-data, country details, website links, and business category selection.
  * Implements frontend-side validations and submit loading animations.
* **Confirmation URL**: `/apply/success`
  * Informs the applicant that their application has been recorded and is pending review by the platform team.
  * Provides a navigation link back to the main portal login page.

---

## 2. API Endpoint Map

### POST `/api/platform/company-applications/public`

* **Auth Required**: No (Publicly Accessible)
* **Request Payload**:
  ```json
  {
    "companyName": "VisaTek Sourcing",
    "ownerFullName": "Mohammad Rahman",
    "ownerEmail": "owner@visatek.com",
    "ownerPhone": "+8801712345678",
    "businessType": "Recruitment Agency",
    "country": "Bangladesh",
    "city": "Dhaka",
    "address": "Sector 12, Uttara, Dhaka",
    "website": "https://visatek.com",
    "notes": "Interested in standard tenant setup"
  }
  ```
* **Response (Success - 201)**:
  ```json
  {
    "success": true,
    "id": "cl..."
  }
  ```

---

## 3. Server-Side Behavior & Validations

### 1. Data Integrity and Security
* All incoming text strings are verified and trimmed before database writes are executed.
* The API enforces validations using **Zod**:
  * `companyName`, `ownerFullName`, `ownerEmail` (validated syntax), and `ownerPhone` are strictly required. Empty inputs trigger a `400 Bad Request` validation error.
  * `country` defaults to `"Bangladesh"` if it is sent as an empty string.
* Unprivileged client body parameters such as `status`, `reviewedById`, `reviewedAt`, `approvedCompanyId`, or `rejectionReason` are completely ignored and overwritten. The backend explicitly creates applications with `status = PENDING`.

### 2. Duplicate Protection
Before inserting the new application, the server performs a check against active pending requests. If an application with the **same owner email** OR the **same company name** is currently pending in `status = PENDING`, the server rejects the request with a **409 Conflict** error response:
```json
{
  "error": "An application from this company or owner email is already pending review."
}
```
This protects platform database indices from spam and multiple submission attempts.
