---
name: dlt-hosted-checkout-api
description: Integrate with the DLT Payment Collection API v4.0 — a Philippine payment gateway where ALL payment types (card and e-wallet/APN like GCash) go through DLT's own Hosted Checkout page, not a merchant-built form. Uses OAuth2 client-credentials auth (merchant-bound), "Submit Payment" to create a transaction and get a redirect payment_url, and an authenticated "/sync" endpoint for post-redirect status recovery. Use this skill whenever the user asks to integrate DLT payments, build a redirect-based checkout flow against checkout.dxp.dtic.com.ph, add GCash/card/e-wallet collection via DLT without building their own card form, reconcile payment status via /sync, or write client code calling /oauth/token, /api/v1/collection/apn/brands, /api/v1/collection/apn/submit, or /api/v1/collection/apn/sync. Also use for debugging DLT API errors, explaining the DLT v4.0 collection/status lifecycle, or the Quick Link session flow (/api/v1/quick-link/session).
---

# DLT Payment Collection API — Hosted Checkout (v4.0)

Integration skill for DLT's Collection API v4.0. **DLT hosts the checkout page for every payment type** — card and e-wallet alike. The merchant creates a transaction, redirects the payor to a DLT-hosted URL, and calls `/sync` when the payor returns to get authoritative status. No card numbers, CVVs, or 3DS data ever pass through the merchant's code.

Read `references/api-reference.md` for full endpoint specs, field tables, and sample payloads.

**If the user's request or existing code has card fields, `is_card_payment: true` branches, or 3DS `device.*` fields in a Submit Payment payload, that's a v3.0-era pattern — flag it and migrate to Hosted Checkout rather than silently keeping it.**

---

## Quick orientation

**Base URL:** `https://checkout.dxp.dtic.com.ph/`  
**Auth:** OAuth 2.0 Client Credentials → `POST /oauth/token` → `Authorization: Bearer <access_token>` on every subsequent call.  
**Content type:** All requests/responses are `application/json`.  
**Trust model:** DLT maps each machine client to exactly one merchant account. `merchant_account_id` in a request body is a compatibility assertion only — DLT authorizes from the OAuth token, not the field value.

---

## The integration flow (all payment types)

Every payment follows exactly this shape — no branching by card vs. e-wallet:

1. `GET /api/v1/collection/apn/brands` — fetch available payment brands; show the payor a list to pick from.
2. `POST /api/v1/collection/apn/submit` — create the transaction. Pass the brand the payor chose (`payment_brand` + `payment_brand_code`), payor/billing details, amount, and redirect URLs. Receive `payment_url`.
3. Redirect the payor to `payment_url`. DLT handles card entry, OTP/3DS, wallet QR — all of it.
4. DLT redirects the payor's browser back to your `success_url` or `failure_url` (with `?status=success|failure&txn=<merchant_transaction_id>` appended, or however your app structures those URLs).
5. On the return page, call `POST /api/v1/collection/apn/sync` with the `merchant_transaction_id` to get authoritative `PAID` / `PENDING` / `REJECTED` status.

**There are no webhooks in this application.** The IFRC implementation uses sync-on-return only — no server-to-server webhook receiver is built or needed for this use case. If a future integration needs webhooks, see `references/api-reference.md` for the signature scheme.

---

## Proven implementation pattern (from IFRC payment wall)

The following patterns come from a production Next.js App Router implementation. Use them as defaults unless the user's context differs.

### Architecture

```
Browser (payor)
    │
    │  On mount (parallel)
    │  ├── GET /api/csrf              seeds CSRF double-submit cookie
    │  ├── GET /api/payment/brands    fetches DLT brand list
    │  └── GET /api/payment/transaction-id   mints merchant_transaction_id
    │
    │  User fills form, clicks Pay
    │  POST /api/payment/submit ──►  validates → calls DLT /submit
    │                                returns { payment_url, merchant_transaction_id }
    │
    │  window.location.href = payment_url
    │
    │  DLT Hosted Checkout (checkout.dxp.dtic.com.ph)
    │
    │  DLT redirects back to:
    │  GET /?status=success|failure&txn=<merchant_transaction_id>
    │
    │  Auto-verify on result screen mount
    │  POST /api/payment/sync ──►  calls DLT /sync → returns status
    │
    └── Result screen: PAID / PENDING / REJECTED
```

### State model

No application database for payment state. Three stores only:

| Store | What lives there |
|---|---|
| In-memory server cache | DLT OAuth access token (TTL = `expires_in − 60s`) |
| Upstash Redis | Rate-limit counters only — no PII, no payment data |
| DLT (`/sync`) | Authoritative source of truth for all payment status |

### Environment variables

| Variable | Description |
|---|---|
| `DLT_CLIENT_ID` | DLT OAuth client ID |
| `DLT_CLIENT_SECRET` | DLT OAuth client secret |
| `DLT_MERCHANT_ACCOUNT_ID` | Merchant account ID passed on brands/submit calls |
| `DLT_SERVICE_CODE` | Service code, e.g. `APN-COLLECTION` |
| `DLT_API_BASE_URL` | DLT gateway base URL (default: `https://checkout.dxp.dtic.com.ph`) |
| `NEXT_PUBLIC_APP_URL` | App origin used to build `success_url` / `failure_url` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis endpoint (optional; falls back to in-memory rate limiting) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token |

### OAuth token management

One server-owned token shared across all requests:

```ts
POST /oauth/token
{ "grant_type": "client_credentials", "client_id": "...", "client_secret": "..." }
→ { "access_token": "...", "expires_in": 31536000 }
```

- Cache in memory with TTL = `expires_in − 60s` (minimum 60s).
- On concurrent calls, share a single in-flight refresh promise — never race multiple `/oauth/token` calls.
- On any `DltAuthError` from a DLT call: flush the cached token, retry **once** with a fresh token (`withDltAuthRetry` wrapper). Transparent to route handlers.
- **Never log the access token. Never pass it through route handlers** — all DLT calls go through helper functions (`fetchDltBrands`, `submitDltPayment`, `syncDltPayment`) that inject the token internally.

### `merchant_transaction_id` lifecycle

- Generate server-side with a cryptographically secure source (nanoid). Format: 6 uppercase letters + 14 digits, e.g. `KXRMQW20931847506123` (~75 bits of entropy).
- Mint it **before** showing the form (via `GET /api/payment/transaction-id`) so the payor sees their reference number in the checkout summary.
- Pass the pre-minted ID in the submit request body. **Never regenerate it inside `/submit`.**
- Validate the ID on return: `/^[A-Za-z0-9_-]{1,45}$/` before using it in a `/sync` call.

### Field mapping — app → DLT submit payload

| App field | DLT field | Notes |
|---|---|---|
| `plan_name` | `product_name` | max 80 chars |
| `provider` | `product_description` | max 120 chars; **treat as required** — DLT 500s without it even though the API docs list it as optional |
| `reference` | `product_reference_id` | |
| `amount` | `amount` | decimal string, e.g. `"12500.00"` |
| `payment_brand` | `payment_brand` | brand `value` from brands API |
| `payment_brand_code` | `payment_brand_code` | brand `code` from brands API, verbatim |
| — | `time_offset` | hardcode `"+08:00"` for PH |
| — | `channel` | hardcode `4` (Custom hosted checkout) |
| — | `currency` | hardcode `"PHP"` for PH-only merchants |
| — | `merchant_account_id` | from env |
| — | `service_code` | from env |
| — | `success_url` | `<APP_URL>/?status=success&txn=<merchant_transaction_id>` |
| — | `failure_url` | `<APP_URL>/?status=failure&txn=<merchant_transaction_id>` |

### Money handling

Amount is **always a decimal string** throughout the pipeline, e.g. `"12500.00"`:

- Client parses display input to integer cents via regex arithmetic — **never `parseFloat`**.
- Canonical amount = `(cents / 100).toFixed(2)`.
- Server validates with regex `/^\d{1,10}\.\d{2}$/` + range check: `0 < amount ≤ 500000.00` in integer cents.
- `parseFloat` and `Number()` are never used on the canonical amount value.

### `payment_brand_code` is opaque and time-sensitive

- Copy the `code` value from the brands API response verbatim into `payment_brand_code` on submit.
- Do not decode, persist, or long-cache it.
- Cache brands results in-memory for **5 minutes max**; on DLT error, use a **30-second negative cache** to avoid hammering a down gateway, and serve any stale success cache as a fallback.

### CSRF and rate limiting

Apply to all state-changing routes in a Next.js App Router context:

- **CSRF** — double-submit cookie scheme: seed a `csrf_token` cookie via `GET /api/csrf`; read it from `document.cookie` client-side; send as `x-csrf-token` header on the submit POST. Server checks Origin/Referer + cookie match (both required for `/submit`; Origin/Referer only for `/sync`).
- **Rate limiting** — per-IP via Upstash Redis; fall back to in-memory sliding window if Redis is unavailable. Return `429` when exceeded.

### Error handling

#### 409 — TRANSACTION_REFERENCE_CONFLICT

DLT already has this `merchant_transaction_id`. Caused by a double-click or a retry that reused the same ID.

**Never auto-resubmit.** Return `409` to the client. Client mints a **fresh** `merchant_transaction_id` for the next attempt.

#### 503 — SUBMISSION_UNKNOWN

DLT could not confirm whether the transaction was created. May or may not be recorded.

**Never auto-resubmit.** Keep the **same** `merchant_transaction_id` (to avoid a duplicate charge if the first went through). Show a "Check payment status" button that calls `/api/payment/sync`. The user verifies before retrying.

#### Other non-409/503 submit failures

After any other failure, mint a **fresh** `merchant_transaction_id` so the next retry starts clean. Prevents a stale ID from triggering 409 if the failed request partially reached DLT.

#### Brands unavailable on load

If brands fetch fails and no stale cache is available, hide the form entirely and show a "Service Temporarily Unavailable" screen. A "Try again" button reloads the page.

#### Transaction ID mint failed

If `GET /api/payment/transaction-id` fails, show an "Unable to Start Checkout" screen with a "Reload page" button. Never show the form without a valid reference number.

### `/sync` on return — not polling

`/sync` is called **once** on result-screen mount, not polled. The status lifecycle:

- Newly accepted transaction → `PENDING` while the payor completes payment.
- `PAID` and `REJECTED` are terminal — `/sync` never downgrades them.
- If status comes back `PENDING`, show a "Verify status" button so the user can re-check manually.

### Security invariants

| Invariant | Implementation |
|---|---|
| CSRF on state-changing POSTs | Origin/Referer check on every POST; `x-csrf-token` double-submit additionally required on `/submit` |
| Rate limiting | Per-IP counters via Upstash Redis on all endpoints |
| No secrets in logs | Sanitized logging helpers only; no raw `console.log` / `console.error` in route handlers |
| No card data | Payor never enters card number on this app; all card/wallet handling on DLT's domain |
| `merchant_transaction_id` immutability | Minted once per checkout session; never regenerated inside `/submit`; fresh mint only after a confirmed non-ambiguous failure |
| Amount integrity | Decimal string throughout; integer-cents arithmetic; no `parseFloat` |
| No auto-retry on 409/503 | Blind retries risk duplicate charges |

---

## App routes summary

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/csrf` | GET | none | Issue CSRF cookie |
| `/api/payment/transaction-id` | GET | Origin check | Mint `merchant_transaction_id` |
| `/api/payment/brands` | GET | Origin check | Fetch available payment brands from DLT |
| `/api/payment/submit` | POST | CSRF + Origin | Submit payment to DLT, get `payment_url` |
| `/api/payment/sync` | POST | Origin check | Verify payment status from DLT |

## DLT endpoints used

| DLT endpoint | Method | Purpose |
|---|---|---|
| `/oauth/token` | POST | Obtain Bearer token (client credentials) |
| `/api/v1/collection/apn/brands` | GET | List available payment brands |
| `/api/v1/collection/apn/submit` | POST | Create transaction, receive `payment_url` |
| `/api/v1/collection/apn/sync` | POST | Query authoritative payment status |

---

## Before writing code

1. Confirm the language/framework — patterns above are Next.js App Router but the DLT API calls are HTTP-client-agnostic.
2. Check whether the user has `DLT_CLIENT_ID`, `DLT_CLIENT_SECRET`, `DLT_MERCHANT_ACCOUNT_ID`, and `DLT_SERVICE_CODE` — DLT-issued, not guessable. Use obvious placeholders; never invent real-looking values.
3. Determine scope: direct Submit Payment integration, Quick Link, or both.
4. Consult `references/api-reference.md` for exact field names, types, and required-ness — especially billing address fields and the `amount` upper bound (`500,000.00`).

## Quick Link

A separate shortcut: `POST /api/v1/quick-link/session` → opaque token (30-min expiry) → send payor to the DLT-hosted URL built from that token. Same Hosted Checkout rules apply. Useful for shareable payment links without building the full submit flow. See `references/api-reference.md` for the full request/response spec.

## When generating code

Produce focused helpers for: token fetch+cache, get brands, submit payment (redirect), `/sync`, and optionally a webhook receiver with signature verification. Use typed request/response shapes where the target language supports them. Pull exact field lists from `references/api-reference.md`.

If the user's code mixes in v3.0 patterns (card fields, `is_card_payment: true`, 3DS `device.*`), call that out explicitly and migrate rather than merging both approaches.
