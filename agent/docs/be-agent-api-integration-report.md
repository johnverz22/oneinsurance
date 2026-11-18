# Backend API Handoff: Agent Portal — Full Integration & Field Verification Report

**Date:** November 13, 2026  
**Target:** Backend Engineering Team (Laravel API / `stage-api.oneinsurance.shop`)  
**Verified Against:** Live staging backend (`stage-api.oneinsurance.shop`), authenticated test agent `jshmpd23@gmail.com` (Agent ID: 2)  
**Scope:** Complete Agent Portal API verification — Authentication, Portfolio Statistics, Sales & Recent Transactions, Dashboard Activity, Referral Codes, Files Management, Lines of Business, Accounts/Payouts, Profile & Password Change.  

---

## Executive Summary

| Domain | Endpoint | Staging Status | Action Required |
|---|---|---|---|
| **Authentication** | `POST /agents/login`<br>`POST /auth/login/otp/*` | ✅ Working | None (login + OTP verified end-to-end) |
| **Portfolio Statistics** | `GET /agents/statistics` | ❌ **BLOCKED** | Mandatory date params (422 if omitted), returns all zeros, missing timeseries `daily_premiums` & fields `total_cases`/`total_premium` |
| **Sales Transactions** | `GET /agents/transactions` | ⚠️ **Partial** | Pagination & filters work, but 76/81 transactions stuck in `pending` (including 25 issued policies), `net_commission` & `commission_log` 100% null |
| **Recent Activity (Dashboard)** | `GET /agents/activities` | ❌ **Missing (404)** | Dedicated system-wide activity feed required (sales, commissions, documents, KYC, referrals). Currently using transactions as an interim fallback |
| **Transaction Detail** | `GET /transactions/{id}` | ✅ Working | Note: `/agents/transactions/{id}` is 404; BFF routes to `/transactions/{id}` |
| **Referral Code** | `GET /agents/referral/{agentId}` | ✅ **Working** | Verified working with path parameter (returns `"ckO6uNx2O6"`). Recommend also supporting `GET /agents/referral` without ID |
| **File Management** | `GET /agents/files/list`<br>`GET /agents/files/tag/{tag}` | ✅ **Working** | Verified working with Drive metadata, sizes & pagination |
| **Lines of Business** | `GET /agents/lobs` | ⚠️ **Partial** | Only Travel Insurance assigned (1 LOB); need DB assignment of Health, ECTPL, and Motor |
| **User Settings & Profile** | `GET /agents/me` | ⚠️ **Partial** | Core profile returned; missing `is_verified` boolean & `background` bio field |
| **Payout Accounts** | `GET /agents/accounts` | ✅ Working | Bank details and e-wallets returned with primary flag |
| **Password Change** | `POST /agents/auth/change-password` | ❌ **Missing (404)** | Dedicated endpoint for authenticated agent password changes required |

---

## 1. Authentication Verification (Working)

Authentication was verified against `stage-api.oneinsurance.shop`:
1. `POST /api/v1/agents/login` with email and password returns 200 with `access_token` and user object.
2. `POST /api/v1/auth/login/otp/send` dispatches a 6-digit OTP code.
3. `POST /api/v1/auth/login/otp/verify` returns the verified Bearer token.

**Active Test Agent:**
- Agent ID: `2`
- Email: `jshmpd23@gmail.com`
- Name: `Senior Agent`
- Referral Code: `ckO6uNx2O6`
- Role: `Agent`, status: `active`

---

## 2. Deep Dive: Zero & Empty Fields Audit

This section details all empty, null, and zero-value fields across endpoints so backend engineers can verify their database state, models, and calculation queries.

### 2.1 Portfolio Statistics — `GET /api/v1/agents/statistics`

#### Observed Response
When queried without date parameters:
```json
HTTP 422 Unprocessable Content
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "date_from": ["The date from field is required."],
    "date_to": ["The date to field is required."]
  }
}
```

When queried with date parameters covering all completed sales (`?date_from=2026-10-01&date_to=2026-11-13`):
```json
HTTP 200 OK
{
  "total_sales": 0,
  "number_of_sales": 0,
  "gross_commissions": 0,
  "net_commissions": 0,
  "average_payout": 0,
  "number_of_products": 0,
  "product_sales_ranking": []
}
```

#### Field-by-Field Zero Analysis
| Field | Value | Expected Behavior / Backend Root Cause |
|---|---|---|
| `total_sales` | `0` | **Zero:** Should sum the written premium of all completed/paid transactions in period (e.g. ₱3,747.00 for the 5 completed October sales). Currently 0 because the query looks for records in `commission_logs` rather than completed transactions. |
| `number_of_sales` | `0` | **Zero:** Count of completed policies/cases. Expected ≥ 5. |
| `gross_commissions` | `0` | **Zero:** Should sum agent gross commission. 0 because no commission records exist in `commission_logs`. |
| `net_commissions` | `0` | **Zero:** Should sum agent net commission. |
| `average_payout` | `0` | **Zero:** Average commission per sale. |
| `number_of_products` | `0` | **Zero:** Count of distinct products with sales in the period. |
| `product_sales_ranking` | `[]` | **Empty Array:** Expected array of `{ product_id, product_name, total_cases, total_sales }`. |
| `total_premium` | **Missing** | Contract expects `total_premium` as standard alias for written premium. |
| `total_cases` | **Missing** | Contract expects `total_cases` as standard alias for `number_of_sales`. |
| `daily_premiums` | **Missing** | Contract expects a timeseries dictionary keyed `YYYY-MM-DD -> number` for every day in the range (fill empty days with `0.00`). Without this, the dashboard premium trend chart is empty. |

---

### 2.2 Transactions List — `GET /api/v1/agents/transactions`

Audit of all **81 transactions** returned for Agent ID 2:

#### Field Nullity & Frequency Breakdown
| Field Name | Non-Null Count | Null Count | % Empty / Null | Root Cause / Note |
|---|---|---|---|---|
| `status` | 81 | 0 | 0% | **76 are `"pending"`, only 5 are `"completed"`** (see critical lifecycle issue below). |
| `transaction_status` | 5 | 76 | **93.8%** | Only 5 records have `"PAID"`; 76 are `null`. |
| `paid_amount` | 5 | 76 | **93.8%** | Only 5 records have a non-null payment amount. |
| `net_commission` | **0** | **81** | **100% NULL** | Never populated on any transaction row. |
| `commission_log` | **0** | **81** | **100% NULL** | Never attached to any transaction row. |
| `product` | **0** | **81** | **100% NULL** | Catalog relation not hydrated (null on all rows). |
| `customer_id` | **0** | **81** | **100% NULL** | Unassigned foreign key. |
| `transaction_status_code` | **0** | **81** | **100% NULL** | Unpopulated gateway code. |
| `product_name` | 26 | 55 | **67.9%** | Older test records and some proposals do not carry product name. |
| `line_of_business` | 26 | 55 | **67.9%** | Missing on same 55 rows as `product_name`. |
| `policy_number` | 25 | 56 | **69.1%** | Populated only on issued policies (25 records). |
| `certificate_number` | 25 | 56 | **69.1%** | Populated only on issued policies (25 records). |
| `policy_holder` | 25 | 56 | **69.1%** | Populated only on issued policies (25 records). |
| `policy_id` | 25 | 56 | **69.1%** | Populated only on issued policies (25 records). |
| `merchant_transaction_id` | 33 | 48 | **59.3%** | Present only when checkout initiated with gateway. |
| `payment_brand` | 33 | 48 | **59.3%** | Present only when checkout initiated with gateway. |
| `transaction_date` | 33 | 48 | **59.3%** | Present only when checkout initiated with gateway. |
| `proposal_number` | 81 | 0 | 0% | **Always populated** (e.g. `OONA-TRVL-WORLD-02-261112-000001`). |
| `amount` | 81 | 0 | 0% | **Always populated** (string, e.g. `"3287.77"`). |
| `currency` | 81 | 0 | 0% | **Always populated** (`"PHP"`). |
| `agent_code_used` | 81 | 0 | 0% | **Always populated** (`"ckO6uNx2O6"`). |

#### Critical Backend Finding: The "Stuck in Pending" Policy Issuance Bug
When inspecting transaction detail via `GET /api/v1/transactions/125`:
```json
{
  "id": 125,
  "proposal_number": "OONA-TRVL-WORLD-01-261111-000011",
  "policy_number": "3802608000723",
  "certificate_number": "080126000009782",
  "policy_holder": "Mga Dela Cruz",
  "merchant_transaction_id": "HCTOIA65730942420340",
  "amount": "2492.86",
  "status": "pending",
  "transaction_status": null,
  "paid_amount": null,
  "policy_details": {
    "status": "completed",
    "policy_no": "3802608000723",
    "issued_at": "2026-11-11T09:26:37.000000Z",
    "issue_date": "2026-11-11T17:26:37"
  }
}
```
**The root cause:** The policy was successfully issued (`policy_details.status: "completed"`, `issued_at` set), but the `transactions` table record was never transitioned from `status = "pending"` to `status = "completed"` / `transaction_status = "PAID"`. Furthermore, `commission_logs` was never generated upon issuance.
**There are 25 such issued policies in the database.** Updating their transaction status will immediately make real written premium and policy counts visible.

---

## 3. Dashboard Recent Activity: Architectural Requirement for a Dedicated Activity Endpoint

### 3.1 Overview: Sales Transactions vs. System-Wide Agent Activity Feed
A critical architectural distinction exists between **Sales Transactions** (the `/sales` page) and **Recent Activity** (the `/dashboard` activity list):

- **`/sales` (Sales Transactions):** Focuses strictly on monetary insurance transactions, proposal checkouts, premium amounts, payment gateway reference IDs, policy issuance numbers, and transaction statuses (`GET /api/v1/agents/transactions`).
- **`/dashboard` (Recent Activity):** Designed as an agent's **unified, system-wide activity stream**. It must reflect not only sales, but all notable lifecycle events occurring across the portal.

### 3.2 Why Recent Activity Requires a Dedicated Endpoint
Currently, the dashboard Recent Activity component queries `GET /api/v1/agents/transactions?per_page=15` as an **interim workaround**. However, restricting this view to transactions omits the vast majority of relevant agent activities:

1. **Commissions & Payout Events:**
   - E.g., *"Commission credited: ₱450.00 for Policy #3802608000723"*
   - E.g., *"Payout processed: ₱12,500.00 transferred to BDO account ending in 8910"*
2. **Document & Compliance / KYC Status Changes:**
   - E.g., *"Document approved: Valid ID verified by Admin"*
   - E.g., *"Document rejected: Please re-upload Agent License (illegible image)"*
3. **Client & Referral Milestones:**
   - E.g., *"New client registered via referral link"*
   - E.g., *"Travel quote generated by customer using your agent code (ckO6uNx2O6)"*
4. **Policy Lifecycle & Renewal Alerts:**
   - E.g., *"Policy #3802608000723 issued to Mga Dela Cruz"*
   - E.g., *"Policy expiring in 7 days: Remind client for renewal"*
5. **Account & Payout Settings Changes:**
   - E.g., *"Primary payout method set to GCash (09123456789)"*
   - E.g., *"Profile information updated"*

### 3.3 Proposed Specification: `GET /api/v1/agents/activities`
A dedicated polymorphic activity endpoint is required to power the dashboard activity feed and the sticky top-bar Quick search.

#### Endpoint Details
```http
GET /api/v1/agents/activities
Authorization: Bearer <agent token>
```

#### Query Parameters
| Parameter | Type | Required | Description |
|---|---|---|---|
| `page` | integer | Optional (default: `1`) | Page number for pagination |
| `per_page` | integer | Optional (default: `10`, max: `50`) | Number of activities to return |
| `type` | string | Optional | Filter by activity category: `all`, `sale`, `commission`, `document`, `kyc`, `referral`, `account` |
| `search` | string | Optional | Keyword search across title, reference, and description (powers top-bar Quick search) |

#### Response Schema
```json
{
  "success": true,
  "message": "Activities retrieved successfully",
  "data": {
    "current_page": 1,
    "last_page": 4,
    "per_page": 10,
    "total": 35,
    "data": [
      {
        "id": "act_912384",
        "type": "sale",
        "title": "World Business Travel Insurance",
        "description": "Proposal OONA-TRVL-WORLD-02 · Mga Dela Cruz",
        "amount": "3287.77",
        "currency": "PHP",
        "status": "completed",
        "icon_hint": "sale",
        "resource_url": "/sales/transactions/125",
        "created_at": "2026-11-12T03:28:28.000000Z"
      },
      {
        "id": "act_912383",
        "type": "document",
        "title": "Agent License Approved",
        "description": "Reviewed and verified by Administrator",
        "amount": null,
        "currency": null,
        "status": "completed",
        "icon_hint": "file",
        "resource_url": "/settings#documents",
        "created_at": "2026-11-13T02:19:10.000000Z"
      },
      {
        "id": "act_912382",
        "type": "commission",
        "title": "Commission Credited",
        "description": "Net commission from Oona Travel sale",
        "amount": "450.00",
        "currency": "PHP",
        "status": "completed",
        "icon_hint": "wallet",
        "resource_url": "/commissions",
        "created_at": "2026-11-11T09:30:00.000000Z"
      },
      {
        "id": "act_912381",
        "type": "document",
        "title": "Valid ID Rejected",
        "description": "Reason: Image is blurry, please provide a clear copy",
        "amount": null,
        "currency": null,
        "status": "failed",
        "icon_hint": "file",
        "resource_url": "/settings#documents",
        "created_at": "2026-11-13T02:25:35.000000Z"
      }
    ]
  }
}
```

### 3.4 Current Interim Fallback: Reusing `/sales` (`GET /agents/transactions`)
Until `GET /api/v1/agents/activities` is built, the frontend continues to query `GET /api/v1/agents/transactions` to prevent an empty dashboard. To handle the numerous null/empty fields returned by the transactions endpoint, the frontend implements the following robust fallbacks in `src/app/(portal)/dashboard/dashboard-client.tsx`:

1. **Title / Product Name:** Evaluates `plan_name` (e.g. `"World Business"`), falling back to title-cased `product_name` or `line_of_business`, and finally `"Insurance Policy"`.
2. **Identifier / Payment Reference (`paymentRef`):** Evaluates `merchant_transaction_id` &rarr; `policy_number` &rarr; `certificate_number` &rarr; `proposal_number` &rarr; `TX-${id}`. Because `proposal_number` is 100% populated, users always see a meaningful identifier rather than `TX-126`.
3. **Status Badging:** Checks `status === 'completed' || transaction_status === 'PAID'` to badge paid transactions as Completed rather than Pending.
4. **Dates:** Formatted as `MMM d, yyyy` (e.g. `"Nov 11, 2026"`).

---

## 4. Endpoints Verification Details

### 4.1 Referral Links — `GET /api/v1/agents/referral/{agentId}`
- **Previous report status:** Stated 404 BLOCKED (was tested as query param `?id=2`).
- **Verified status:** ✅ **WORKING** when requested with path parameter:
  ```
  GET /api/v1/agents/referral/2
  Authorization: Bearer <token>
  ```
  **Response:**
  ```json
  {
    "success": true,
    "message": "Agent referral code fetched successfully",
    "data": "ckO6uNx2O6"
  }
  ```
- **Backend recommendation:** Also accept `GET /api/v1/agents/referral` without an ID segment, extracting the agent ID directly from the authenticated token.

### 4.2 Agent Files — `GET /api/v1/agents/files/list`
- **Previous report status:** Stated 404 BLOCKED (was tested at `/agents/files`).
- **Verified status:** ✅ **WORKING** at:
  ```
  GET /api/v1/agents/files/list
  GET /api/v1/agents/files/tag/{tag}
  ```
  Returns `files` array with `size` (bytes), `tag`, `file_name`, `original_name`, and `pagination`.

### 4.3 Lines of Business — `GET /api/v1/agents/lobs`
- **Verified status:** 200 OK.
- Returns 1 active LOB (Travel).
- **Backend action:** Assign the remaining lines of business (`health-insurance`, `ectpl`, `motor-insurance`) to the agent via database or admin portal so the agent's product catalogue is populated.

### 4.4 User Profile & Settings — `GET /api/v1/agents/me`
- **Verified status:** 200 OK.
- Includes `settings.code` (`"ckO6uNx2O6"`), `bank_details`, `ewallets`, `profile_photo`, `documents`, `line_of_businesses`.
- **Empty / Missing Profile Fields on `/settings`:**
  - `background`: **Absent / Empty** from API response. The `/settings` page Fact Grid has a "Your background" field which falls back to `user?.designation || 'Not selected'` because `background` is never returned.
  - `is_verified`: **Absent** boolean on `AgentUser`. The `/settings` header badge uses a frontend heuristic (`email_verified_at !== null` + document review status) instead of an explicit backend verification flag.
- **Backend action:**
  - Add `background` text field to `AgentUser` profile schema so agents can set and view their professional background / bio.
  - Add `is_verified` boolean to `AgentUser` (`true` when agent is fully approved).

### 4.5 User Settings: Password Change Availability Verification — `POST /api/v1/agents/auth/change-password`
- **Current status:** ❌ **BLOCKED — Endpoint Not Available (404 on all routes)**.
- **Verification on `/settings` UI:**
  - The "Update password" card (`<section aria-labelledby="password-title">`) is fully built and rendered on `/settings`.
  - It exposes three password fields:
    1. **Current password** (`#agent-current-password`) — starts empty `""`.
    2. **New password** (`#agent-new-password`) — starts empty `""`.
    3. **Confirm new password** (`#agent-confirm-password`) — starts empty `""`.
  - Client-side validation: Requires minimum 12 characters, enforces `password === password_confirmation`, and ensures `password !== current_password`.
  - Submission mechanism: Dispatches `POST /api/agent/auth/change-password` (BFF) which proxies directly to `stage-api.oneinsurance.shop`.
- **Live Probing Results on Staging:**
  Every candidate password route on the Laravel backend was tested with an active agent Bearer token (`Authorization: Bearer 81|...`):

  | Method | Upstream Route | HTTP Status | Response Body / Error |
  |---|---|---|---|
  | `POST` | `/api/v1/agents/auth/change-password` | **404 Not Found** | `{"success":false,"message":"Endpoint not found."}` |
  | `POST` | `/api/v1/agents/change-password` | **404 Not Found** | `{"success":false,"message":"Endpoint not found."}` |
  | `POST` | `/api/v1/agents/password` | **404 Not Found** | `{"success":false,"message":"Endpoint not found."}` |
  | `PUT` | `/api/v1/agents/password` | **404 Not Found** | `{"success":false,"message":"Endpoint not found."}` |
  | `POST` | `/api/v1/agents/me/change-password` | **404 Not Found** | `{"success":false,"message":"Endpoint not found."}` |
  | `POST` | `/api/v1/agents/me/password` | **404 Not Found** | `{"success":false,"message":"Endpoint not found."}` |
  | `PUT` | `/api/v1/agents/me/password` | **404 Not Found** | `{"success":false,"message":"Endpoint not found."}` |
  | `POST` | `/api/v1/agents/update-password` | **404 Not Found** | `{"success":false,"message":"Endpoint not found."}` |
  | `POST` | `/api/v1/user/password` | **404 Not Found** | `{"success":false,"message":"Endpoint not found."}` |
  | `POST` | `/api/v1/user/change-password` | **404 Not Found** | `{"success":false,"message":"Endpoint not found."}` |
  | `POST` | `/api/v1/auth/password` | **404 Not Found** | `{"success":false,"message":"Endpoint not found."}` |
  | `PUT` | `/api/v1/auth/password` | **404 Not Found** | `{"success":false,"message":"Endpoint not found."}` |
  | `PUT` | `/api/v1/agents/me` | 200 OK | **Ignores password fields by design** |
  | `POST` | `/api/v1/auth/change-password` | 422 Unprocessable | `{"errors":{"email":["required"],"token":["required"]}}` (Public forgot-password reset flow; cannot be used with Bearer session) |

- **User Impact:** When an agent fills out the form at `/settings` and clicks **"Update password"**, the request fails with a generic error toast or *"Endpoint not found"*, making it impossible for agents to change their credentials from the portal.
- **Specification Required for Backend Implementation:**
  ```http
  POST /api/v1/agents/auth/change-password
  Authorization: Bearer <agent token>
  Content-Type: application/json

  {
    "current_password": "CurrentPassword123!",
    "password": "NewSecurePassword456!",
    "password_confirmation": "NewSecurePassword456!"
  }
  ```
  - **Validation rules:**
    - `current_password`: Required. Must verify against `Hash::check($request->current_password, $user->password)`.
    - `password`: Required, string, minimum 12 characters, different from `current_password`.
    - `password_confirmation`: Required, string, must match `password`.
  - **Expected success response (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Password updated successfully"
    }
    ```
  - **Expected validation error (`422 Unprocessable Content`):**
    ```json
    {
      "success": false,
      "message": "Validation error",
      "errors": {
        "current_password": ["The provided password does not match your current password."]
      }
    }
    ```
  - **Frontend status:** The BFF handler at `src/app/api/agent/auth/change-password/route.ts` and the UI form at `src/app/(portal)/settings/settings-client.tsx` are already deployed and awaiting this endpoint. Zero frontend changes will be required once deployed.

---

## 5. Backend Engineering Action Checklist

### Priority 1: Critical (Unblocks Dashboard KPIs & Commission Tracking)
- [ ] **Fix Statistics Calculation (`GET /api/v1/agents/statistics`):**
  - Make `date_from` and `date_to` optional. When omitted, calculate all-time cumulative portfolio statistics.
  - Base `total_sales` / `total_premium` and `number_of_sales` / `total_cases` on completed transactions (`status = 'completed'` or `transaction_status = 'PAID'`), not solely on `commission_logs`.
  - Include timeseries dictionary `daily_premiums` keyed `YYYY-MM-DD -> number` for every day in the requested date range (fill non-sale days with `0.00`).
  - Include `total_premium` and `total_cases` fields.
- [ ] **Transition Issued Policies to Completed Status:**
  - Run a database update/backfill on the 25 transaction records that already have `policy_number` / `certificate_number` / `policy_details.status = 'completed'`:
    - Set `status = "completed"`
    - Set `transaction_status = "PAID"`
    - Set `paid_amount = amount`
    - Generate corresponding records in `commission_logs` so net/gross commission values populate.

### Priority 2: High (Data Quality & Catalogue)
- [ ] **Implement Dedicated Activity Feed Endpoint (`GET /api/v1/agents/activities`):** Provide a polymorphic activity feed supporting `sale`, `commission`, `document`, `kyc`, `referral`, and `account` events with search and pagination to replace the temporary transactions fallback on the dashboard.
- [ ] **Populate Product & LOB on older transactions:** Ensure `product_name` and `line_of_business` are populated on historical transactions (currently null on 55 rows).
- [ ] **Assign remaining LOBs:** Assign `health-insurance`, `ectpl`, and `motor-insurance` to test agents in `agent_lobs`.
- [ ] **Implement `POST /api/v1/agents/auth/change-password`:** Accept `current_password`, `password`, `password_confirmation` with Bearer auth.

### Priority 3: Enhancements
- [ ] Support `GET /api/v1/agents/referral` (no ID parameter, extracting agent from Bearer token).
- [ ] Expose `is_verified` boolean and `background` string on `GET /api/v1/agents/me`.
