# Backend Filter & Search Limitations

Issues found in backend APIs consumed by the admin portal. Organised by endpoint, with the affected frontend pages and a description of each issue.

---

## `GET /api/v1/admin/agents`

**Frontend pages:** `/agents` (Agents tab)

| # | Issue | Severity |
|---|-------|----------|
| 1 | `date_from` / `date_to` may not be honored — see [Date range filter](#date-range-filter) | Medium |
| 2 | Export limited to current page — see [Export](#export-limited-to-current-page) | Low |

---

## `GET /api/v1/admin/applicants`

**Frontend pages:** `/agents` (Applicants tab)

| # | Issue | Severity |
|---|-------|----------|
| 3 | `sort_by` / `sort_order` params may not be supported — see [Sort](#applicants-sort) | Low |
| 4 | `date_from` / `date_to` may not be honored — see [Date range filter](#date-range-filter) | Medium |
| 5 | Export limited to current page — see [Export](#export-limited-to-current-page) | Low |

---

## `GET /api/v1/transactions/completed/agent/{id}`

**Frontend pages:** `/agents/{id}/cases`

| # | Issue | Severity |
|---|-------|----------|
| 6 | No `search` param support — see [Search](#no-search-support-on-agent-transactions) | High |
| 7 | `date_from` / `date_to` may not be honored — see [Date range filter](#date-range-filter) | Medium |
| 8 | Export limited to current page — see [Export](#export-limited-to-current-page) | Low |

---

## `GET /api/v1/transactions`

**Frontend pages:** `/transactions`

| # | Issue | Severity |
|---|-------|----------|
| 9 | No `search` param support — see [Search](#no-search-support-on-main-transactions) | High |
| 10 | `date_from` / `date_to` may not be honored — see [Date range filter](#date-range-filter) | Medium |
| 11 | `currency` field not returned — see [Currency](#currency-field-not-returned) | Medium |
| 12 | `product`, `product_name`, `policy_details` are null — see [Product info](#product-fields-are-null) | Medium |
| 13 | Export limited to current page — see [Export](#export-limited-to-current-page) | Low |

---

## Issue Details

### No search support on agent transactions

**Endpoint:** `GET /api/v1/transactions/completed/agent/{id}`

**Expected:** A `search` query param that filters by policy number, certificate number, policy holder name, plan, and product type — matching the fields the UI search box exposes.

**Current behaviour:** The endpoint does not accept a `search` param. All filtering falls back to client-side, applied only to the current page.

**Impact:** When an agent has transactions across multiple pages, the search box only finds matches on the currently visible page. The user sees "No cases match your filters" even when matching records exist on other pages.

**Workaround in UI:** The client sends `search` to the server (ready to work once supported) and also filters client-side as a per-page fallback.

---

### No search support on main transactions

**Endpoint:** `GET /api/v1/transactions`

**Expected:** A `search` query param that filters by policy number, certificate number, policy holder, plan, product type, insurer, agent code, and payment reference.

**Current behaviour:** Same as above — no `search` param supported. All text filtering is client-side on the current page only.

**Impact:** An admin searching for a specific policy number only matches records on the currently loaded page (default 10 rows). Matches on other pages are invisible.

**Workaround in UI:** Same as above — `search` is sent to the server and client-side filtering is used as a fallback.

---

### Date range filter

**Endpoints affected:**
- `GET /api/v1/admin/agents` — `date_from` / `date_to`
- `GET /api/v1/admin/applicants` — `date_from` / `date_to`
- `GET /api/v1/transactions/completed/agent/{id}` — `date_from` / `date_to`
- `GET /api/v1/transactions` — `date_from` / `date_to`

**Expected:** The backend filters results server-side so that pagination totals reflect the filtered set.

**Current behaviour:** Uncertain. The frontend includes a client-side fallback that filters by `created_at` / `transaction_date`, indicating the backend may not reliably honor these params.

**Impact when backend does NOT honor date params:**
- **Pagination mismatch:** The pagination bar shows the server's unfiltered `total` and `last_page`, but the table shows only the filtered subset of the current page (e.g. 15 returned, 3 displayed after client-side filter).
- **Incomplete export:** CSV export only includes filtered rows from the current page, not all matching records across all pages.
- **Sparse pages:** Pages may appear nearly empty after client-side filtering with no indication that other pages have matching records.

**Recommendation:** Confirm whether each endpoint supports `date_from` / `date_to`. If not, add server-side support so pagination totals and exports are accurate.

---

### Applicants sort

**Endpoint:** `GET /api/v1/admin/applicants`

**Expected:** `sort_by` and `sort_order` params (as supported by the agents endpoint) to control result ordering.

**Current behaviour:** Unknown. The frontend sends `sort_by=created_at&sort_order=desc` (matching the agents endpoint pattern), but it is unverified whether the applicants endpoint honors these params.

**Impact:** If unsupported, applicants appear in whatever default order the backend returns, which may not be newest-first. This makes recent applications harder to find.

**Recommendation:** Confirm the applicants endpoint supports `sort_by` / `sort_order`, or add support if missing.

---

### Currency field not returned

**Endpoint:** `GET /api/v1/transactions`

**Expected:** Each transaction object includes a `currency` field (e.g. `PHP`).

**Current behaviour:** The `currency` field is absent from transaction responses. It exists only on the original checkout payment request and is not persisted or returned.

**Impact:** The Currency column always shows `—`. Export CSVs have an empty `currency` column.

**Recommendation:** Persist and return `currency` on the transaction record.

---

### Product fields are null

**Endpoint:** `GET /api/v1/transactions`

**Expected:** Each transaction carries enough product information to display the line-of-business name (e.g. "Travel Insurance").

**Current behaviour:** `product`, `product_name`, and `policy_details` are consistently null. The only product identifier is `carrier_product_code` (e.g. `MIC-TRAVEL-MASTER`). The UI resolves the LOB name by cross-referencing this code against the admin product catalog (`GET /admin/products`).

**Impact:** Product type only resolves when the `carrier_product_code` exists on the transaction and the product catalog has a matching entry with a `line_of_business`. If either is missing, the Product column shows the raw code or `—`. This also requires an extra request to `/admin/products` on every page load.

**Recommendation:** Return `product_name` or a `line_of_business` label directly on the transaction record.

---

### Export limited to current page

**Endpoints affected:** All list endpoints above

**Expected:** Exporting should include all records matching the current filters, not just the visible page.

**Current behaviour:** All export functions operate on the rows currently loaded in memory — the current page after any client-side filtering (at most 10–15 rows).

**Impact:** If an admin has 100 matching records, the exported CSV contains at most 15 rows. This is partly a frontend limitation (no fetch-all call is made) and partly a backend gap (no export-specific endpoint exists).

**Recommendation:** Either add a backend endpoint that returns all matching records without pagination for export purposes, or add a frontend mechanism to fetch all pages before exporting.
