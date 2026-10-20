# DLT Payment Collection API — curl Reference

**Environment:** Staging (`https://stage-checkout.dxp.dtic.com.ph`)  
**API version:** v4.0 (Hosted Checkout — no card data in submit payload)  
**Last updated:** 2026-10-13

> ⚠️ **`payment_brand_code` is time-sensitive.** The brand codes in Step 3 expire in ~48 hours.  
> Always run Step 2 first to get fresh codes before testing submit.

---

## Step 1 — Get OAuth access token

```bash
curl -s -X POST https://stage-checkout.dxp.dtic.com.ph/oauth/token \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "grant_type": "client_credentials",
    "client_id": "20",
    "client_secret": "7LJZiaqUwCvqYogyCK0enRkhOjx9f2JWXDHTSmab"
  }'
```

**Response:**
```json
{
  "token_type": "Bearer",
  "expires_in": 31536000,
  "access_token": "<ACCESS_TOKEN>"
}
```

Cache the `access_token`. TTL = `expires_in − 60s`. The BFF (`src/app/api/payment/route.ts`) manages this automatically with an in-memory cache — you only need to call this manually when testing via curl.

---

## Step 2 — Get payment brands

Returns the list of available brands and their **opaque, time-sensitive** `code` values. Copy `code` verbatim into `payment_brand_code` on submit — do not decode or persist it.

```bash
curl -s -X GET \
  "https://stage-checkout.dxp.dtic.com.ph/api/v1/collection/apn/brands?merchant_account_id=TEST-01927456&service_code=APN-COLLECTION" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Sample response (abridged):**
```json
{
  "success": true,
  "data": [
    { "value": "Visa",   "code": "<opaque JWT>", "image": "...", "is_card": true  },
    { "value": "GCash",  "code": "<opaque JWT>", "image": "...", "is_card": false },
    { "value": "Maya",   "code": "<opaque JWT>", "image": "...", "is_card": false },
    { "value": "MasterCard", "code": "<opaque JWT>", "image": "...", "is_card": true }
  ]
}
```

### Pre-fetched brand codes (valid ~48h from 2026-10-13 00:09 PHT)

| Brand | is_card | `payment_brand_code` |
|---|---|---|
| Visa | ✅ | `eyJ0eXBlIjoiSldUIiwiYWxnIjoiSFMyNTYifQ.eyJpc3MiOiJUTFBFIiwic3ViIjoiVExQRSBCYXNlIFJvdXRlciBBdXRoZW50aWNhdGlvbiIsImF1ZCI6IlRMUEUgQmFzZSBSb3V0ZXIiLCJleHAiOjE3OTE5OTQxODcsImlhdCI6MTc5MTgyMTM4NywianRpIjoiZDUzYzA1ZDEtZjVjNC00NmM4LTk1ZmEtZmEyMjdiMWVlYTJhIiwiZGF0YSI6ImRmMWM5OWJlLWY3ODktNDhmYy04ZTRmLTZhY2JiYTMzMGQ0YSJ9.6ejKZTdacJ2dKghvJzOjCdNDAst_a8LSO_bdWbsnp5A` |
| MasterCard | ✅ | `eyJ0eXBlIjoiSldUIiwiYWxnIjoiSFMyNTYifQ.eyJpc3MiOiJUTFBFIiwic3ViIjoiVExQRSBCYXNlIFJvdXRlciBBdXRoZW50aWNhdGlvbiIsImF1ZCI6IlRMUEUgQmFzZSBSb3V0ZXIiLCJleHAiOjE3OTE5OTQxODcsImlhdCI6MTc5MTgyMTM4NywianRpIjoiZDU1NTRiYmItNzBjYS00MGJmLTkyN2UtZjMyZmIyMTQ5NGUzIiwiZGF0YSI6ImVmNjljZDJkLWU2YTQtNDFkZS05MGY5LTkyZjVjMzg1ZjNlNSJ9.k474bhgtUr08LqTkSTR-rDlN5ERBnHtCcXpag_de0eM` |
| GCash | ❌ | `eyJ0eXBlIjoiSldUIiwiYWxnIjoiSFMyNTYifQ.eyJpc3MiOiJUTFBFIiwic3ViIjoiVExQRSBCYXNlIFJvdXRlciBBdXRoZW50aWNhdGlvbiIsImF1ZCI6IlRMUEUgQmFzZSBSb3V0ZXIiLCJleHAiOjE3OTE5OTQxODcsImlhdCI6MTc5MTgyMTM4NywianRpIjoiNGI2OTg3MTItMDZmNi00ODEzLTg4MTYtMDRlNzMwZWQ1YWEzIiwiZGF0YSI6ImZkOWMyMWFkLWIwZmQtNDM3Mi04OTc0LTA1Yzk1ZDY3NDNjZCJ9.MbZz5d-F8z1gtcC7Prlpqcntv63FYf6-NTz832V5qZA` |
| Maya | ❌ | `eyJ0eXBlIjoiSldUIiwiYWxnIjoiSFMyNTYifQ.eyJpc3MiOiJUTFBFIiwic3ViIjoiVExQRSBCYXNlIFJvdXRlciBBdXRoZW50aWNhdGlvbiIsImF1ZCI6IlRMUEUgQmFzZSBSb3V0ZXIiLCJleHAiOjE3OTE5OTQxODcsImlhdCI6MTc5MTgyMTM4NywianRpIjoiY2Q4NTNkMGEtNjQ4Ni00NjUwLWIxOGQtZjQ4NTlmMTczNmFkIiwiZGF0YSI6ImM1NzEzZDA2LWU4NDMtNGE1Yy1iZTE1LWIwMDQ1NGIyZWI5NSJ9.knIq7FvrJEpEPL0-XlMcgAQujS9M0YM6LkkYTv3HmAE` |
| GrabPay | ❌ | `eyJ0eXBlIjoiSldUIiwiYWxnIjoiSFMyNTYifQ.eyJpc3MiOiJUTFBFIiwic3ViIjoiVExQRSBCYXNlIFJvdXRlciBBdXRoZW50aWNhdGlvbiIsImF1ZCI6IlRMUEUgQmFzZSBSb3V0ZXIiLCJleHAiOjE3OTE5OTQxODcsImlhdCI6MTc5MTgyMTM4NywianRpIjoiOTNiMmQxMjQtNzUxYi00YjcyLTljYjYtNTQwNzE3ZDNlYmRkIiwiZGF0YSI6IjYwYzM2MTc4LWU3OWItNDE4Zi1hOThlLTQwYmJjZDk3MDc3MiJ9.puAimDW6vwJScFDxldQtb4vmtMvkYeDgjnk93Zbwfc8` |
| QR Ph | ❌ | `eyJ0eXBlIjoiSldUIiwiYWxnIjoiSFMyNTYifQ.eyJpc3MiOiJUTFBFIiwic3ViIjoiVExQRSBCYXNlIFJvdXRlciBBdXRoZW50aWNhdGlvbiIsImF1ZCI6IlRMUEUgQmFzZSBSb3V0ZXIiLCJleHAiOjE3OTE5OTQxODcsImlhdCI6MTc5MTgyMTM4NywianRpIjoiNWQ5NmEyYjMtMjk2Yi00OTVjLTgyYjEtZDgzZmI3OTU3ZDEzIiwiZGF0YSI6Ijc3NjA4OTEyLTk1NWYtNGQyNi05MDlhLTI4MWRhMjAzYTNiYSJ9.PNMbcX63NT1TuFYqpS8DoNXphqfpz7SiDkcE-WSmxPw` |

---

## Step 3 — Submit payment (Hosted Checkout)

All fields are flat at the top level — there is no nested `payor` or `card` object. Card entry and wallet authorization happen on DLT's hosted page after redirect to `payment_url`; no card data is sent here.

```bash
curl -s -X POST https://stage-checkout.dxp.dtic.com.ph/api/v1/collection/apn/submit \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyMCIsImp0aSI6ImNlMGNkMWM5ZTgwOTRmNjQ1MGMwMjRiMjhmN2VkYTUyNzgxYmY1ZTBjNDU5MGM3ZjM2NWU2YzA5MGI4ZDAxNTVhMTcwMzNhYWZkYzBlNDA1IiwiaWF0IjoxNzkxODIxODA1LjIzNzQ2MywibmJmIjoxNzkxODIxODA1LjIzNzQ2NiwiZXhwIjoxODIzMzU3ODA1LjIzNTE1NCwic3ViIjoiIiwic2NvcGVzIjpbXX0.YBarvdYUpyC_7jESt5qiBhn2-7yAprZoyCchhrHsBuPz-zYXK2Kbl8S4vSZLeK7Wwmo9f5fltJd9gHLcC6VZshFqG-pgfP8PhRI5yb_C7hDfw4Wy3Z3Au2sWP_PdW1KyvQ0OWQ4tVFjv-q_5UCfVmm8GJ8enRTaFwRJzKM6FGcsrm9koyktEHtLRZL2gWasMjrKxqEjtibjhhnUh2EHli-sxZN8LDwN5ixSsQeW7UOL_MajOE8Zy_MoSfXqPzyyj-ohLLUM3w2GinbmfMdrl78FsA3uXNnE5AQFI2zcry5DmTgJRIk21zupuQ1q3ZjLXcIvhryfK7nCoWkViXIAYVCkjOuofRKpl3ld58OQP7HqzskQKItZarkTns8EZ5-qwAllbYuMu0ZP4eu9-lAOVPgghNBiES0_xhHudVtYgBi1iJi4SQzXyX0q4r0usqJY1715QFkE-wLokgnyG1z8fQI9GCf76OVTWxwHTpYi7JUdN5i2I8EKfdOkEHlBu-fd9TNY4Ml9ZS6ktTeOrwQBNah-OmH12h5uh5NC-oyhRejodv2gWjdwwJdzC787ChCck6TNSZbD9WkktfrIyJW-_tjg5wPL28dyJWzOd0oyIMwFV5NDf2GTMwntbLlcV6VQKtHXQX-H1tRhCcDbiXfS_SIHxZfvdqJRMOB1VVsslWTw" \
  -d '{
    "merchant_account_id": "TEST-01927456",
    "service_code": "APN-COLLECTION",
    "merchant_transaction_id": "ONEINS20931847506001",
    "amount": "100.00",
    "channel": 4,
    "time_offset": "+08:00",
    "currency": "PHP",
    "payment_brand": "Visa",
    "payment_brand_code": "eyJ0eXBlIjoiSldUIiwiYWxnIjoiSFMyNTYifQ.eyJpc3MiOiJUTFBFIiwic3ViIjoiVExQRSBCYXNlIFJvdXRlciBBdXRoZW50aWNhdGlvbiIsImF1ZCI6IlRMUEUgQmFzZSBSb3V0ZXIiLCJleHAiOjE3OTE5OTQxODcsImlhdCI6MTc5MTgyMTM4NywianRpIjoiZDUzYzA1ZDEtZjVjNC00NmM4LTk1ZmEtZmEyMjdiMWVlYTJhIiwiZGF0YSI6ImRmMWM5OWJlLWY3ODktNDhmYy04ZTRmLTZhY2JiYTMzMGQ0YSJ9.6ejKZTdacJ2dKghvJzOjCdNDAst_a8LSO_bdWbsnp5A",
    "product_name": "Travel Insurance",
    "product_description": "Travel Insurance - OneInsurance",
    "first_name": "Juan",
    "last_name": "dela Cruz",
    "email": "juan@oneinsurance.ph",
    "phone": "+639171234567",
    "address_line_one": "123 Ayala Avenue",
    "city_municipality": "Makati City",
    "state_province_region": "Metro Manila",
    "country_code": "PH",
    "postal_code": "1226",
    "success_url": "https://stage-api.oneinsurance.shop/?status=success",
    "failure_url": "https://stage-api.oneinsurance.shop/?status=failure"
  }'
```

**Field notes:**

| Field | Value | Notes |
|---|---|---|
| `channel` | `4` | Custom hosted checkout — hardcoded |
| `time_offset` | `+08:00` | Philippine time — hardcoded |
| `currency` | `PHP` | Hardcoded |
| `merchant_account_id` | `TEST-01927456` | From `MERCHANT_ACCOUNT_ID` env var |
| `service_code` | `APN-COLLECTION` | From `PAYMENT_SERVICE_CODE` env var |
| `payment_brand_code` | opaque JWT | Copy verbatim from Step 2 — do not decode |
| `product_description` | non-empty string | **Required in practice** — DLT 500s if omitted even though docs say optional |
| `success_url` / `failure_url` | HTTPS URLs | Must be pre-approved by DLT for the environment |

**Expected success response:**
```json
{
  "success": true,
  "message": "Transaction ready for payment",
  "data": {
    "is_card_payment": false,
    "payment_status": "PENDING",
    "transaction_id": "<DLT_INTERNAL_ID>",
    "merchant_transaction_id": "ONEINS20931847506001",
    "amount": "100.00",
    "payment_url": "https://checkout.dxp.dtic.com.ph/...",
    "success_url": "https://stage-api.oneinsurance.shop/?status=success",
    "failure_url": "https://stage-api.oneinsurance.shop/?status=failure",
    "timestamp": "2026-10-13T00:09:00.000+0800"
  }
}
```

Redirect the payor to `data.payment_url` immediately.

### Staging behaviour note

On the staging environment (`stage-checkout.dxp.dtic.com.ph`), submit always returns `503 SUBMISSION_UNKNOWN` even when the transaction is successfully created. This is confirmed staging behaviour:

- Resubmitting the **same** `merchant_transaction_id` returns `409 TRANSACTION_REFERENCE_CONFLICT` — proving the first submit was recorded.
- `/sync` returns `409 SYNC_NOT_AVAILABLE` indefinitely on staging.

The application code handles this correctly — `SUBMISSION_UNKNOWN` is not treated as a hard failure. Share curl output with DLT support to confirm expected staging behaviour for this merchant account.

---

## Step 4 — Sync payment status

Call once after the payor returns from the DLT-hosted page. Use the same `merchant_transaction_id` from Step 3. **Do not poll** — call once, show the result.

```bash
curl -s -X POST https://stage-checkout.dxp.dtic.com.ph/api/v1/collection/apn/sync \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "merchant_transaction_id": "ONEINS20931847506001"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "merchant_transaction_id": "ONEINS20931847506001",
    "payment_status": "PAID",
    "provider_message": null,
    "timestamp": "2026-10-13T00:09:00.000+0800"
  }
}
```

**`payment_status` values:**

| Status | Meaning | Action |
|---|---|---|
| `PAID` | Terminal — payment confirmed | Proceed to issue quote |
| `REJECTED` | Terminal — payment declined | Show error, mint fresh transaction ID |
| `PENDING` | Not yet finalized | Show "Check again" button, retry sync manually |

---

## Environment variables (`.env`)

```
PAYMENT_BASE_URL=https://stage-checkout.dxp.dtic.com.ph
PAYMENT_CLIENT_ID=20
PAYMENT_CLIENT_SECRET=7LJZiaqUwCvqYogyCK0enRkhOjx9f2JWXDHTSmab
MERCHANT_ACCOUNT_ID=TEST-01927456
PAYMENT_SERVICE_CODE=APN-COLLECTION
```

---

## BFF routes (app internal)

The browser never calls DLT directly. All DLT calls go through these Next.js BFF routes:

| Route | Method | Maps to |
|---|---|---|
| `GET /api/payment` | GET | `GET /api/v1/collection/apn/brands` |
| `POST /api/payment/submit` | POST | `POST /api/v1/collection/apn/submit` |
| `POST /api/payment/sync` | POST | `POST /api/v1/collection/apn/sync` |
| `GET /api/payment/transaction-id` | GET | Mints `merchant_transaction_id` server-side (no DLT call) |
