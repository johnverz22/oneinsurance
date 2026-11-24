# FE hand-off: agent portal, statistics, password change and small gaps

For: front-end developers on the agent portal (dashboard, sales page, settings page).

This answers the items in the agent portal integration report (13 November) that needed a backend change. Items that already worked (login and OTP, files, accounts, `GET /transactions/{id}`, `GET /agents/referral/{id}`) are not repeated.

Status (2026-11-19):

| Change | PR | Status |
|---|---|---|
| Statistics from paid sales, change password, own referral code, `is_verified` and `background`, own transaction detail | [#57](https://github.com/nelszy/one-insurance/pull/57) | Open. Not on staging yet. A migration must run first. Confirm with the backend before testing. |

---

## 1. Statistics: `GET /api/v1/agents/statistics`

```
GET /api/v1/agents/statistics?date_from=2026-11-01&date_to=2026-11-30
Authorization: Bearer <agent token>
```

- **`date_from` and `date_to` are now optional**, format `YYYY-MM-DD`. Send both or neither. Without them the figures are **all-time**. A wrong format or `date_to` before `date_from` is a **422** (`errors.date_from`, `errors.date_to`).
- **A sale is a payment confirmed by the payment provider** (the DLT notification). A policy that was issued but whose payment is not confirmed is **not** counted. Sales are counted on the day they were paid.
- The reply is **not** wrapped in `data`. The fields are at the top level, as before.

```json
{
  "total_sales": 3747.00,
  "total_premium": 3747.00,
  "number_of_sales": 5,
  "total_cases": 5,
  "gross_commissions": 450.00,
  "net_commissions": 400.00,
  "average_payout": 0,
  "number_of_products": 1,
  "product_sales_ranking": [
    { "product_id": 3, "product_name": "Travel Insurance", "total_cases": 5, "total_sales": 3747.00 }
  ],
  "daily_premiums": { "2026-11-01": 0, "2026-11-02": 1500.50, "2026-11-03": 0 }
}
```

This is a hand-written sample. The field names and shape follow the backend.

| Field | Meaning |
|---|---|
| `total_premium` | Premium of the paid sales. `total_sales` is the same number, kept so nothing breaks. |
| `total_cases` | Number of paid sales. `number_of_sales` is the same number, kept. |
| `gross_commissions`, `net_commissions` | Commission earned on **those** paid sales. |
| `average_payout` | Average payout in the range. Unchanged. |
| `number_of_products` | Distinct products with a paid sale. |
| `product_sales_ranking` | Up to 10 products by cases. `product_name` and `product_id` can be `null` if the product is not in the catalogue. |
| `daily_premiums` | Premium per day, keyed `YYYY-MM-DD`. |

**`daily_premiums`:**
- **Every day of the range is present**, with `0` on days without a sale, so the chart has no gaps. Use it directly.
- With **no dates**, it runs from the first paid day to today. With no sales at all it is `{}`, so check for an empty object.
- A range of **366 days or more** lists only the days that have a sale. Fill the gaps in the chart yourself for those long ranges, or limit the date picker to a year.
- Amounts are numbers, not strings.

**Do not expect numbers on staging yet.** The figures stay at zero until payments are confirmed. For a test sale, send the DLT test notification after issuing the policy. Commission figures also need a commission log for that sale.

## 2. Change password: `POST /api/v1/agents/auth/change-password`

```
POST /api/v1/agents/auth/change-password
Authorization: Bearer <agent token>
Content-Type: application/json

{
  "current_password": "CurrentPassword123!",
  "password": "NewSecurePassword456!",
  "password_confirmation": "NewSecurePassword456!"
}
```

The BFF handler you already have works as is.

| Field | Rule |
|---|---|
| `current_password` | Required. Must match the agent's current password. |
| `password` | Required. 12 to 50 characters. Must differ from the current password. |
| `password_confirmation` | Required. Must match `password`. |

**Success `200`:**

```json
{ "success": true, "message": "Password updated successfully" }
```

**Errors:**

| Status | When | Body |
|---|---|---|
| 422 | Wrong current password. | `errors.current_password`: "The provided password does not match your current password." |
| 422 | New password too short, too long, not confirmed, or the same as the current one. | `errors.password` has the message. |
| 401 | No or expired token. | Send the user to sign in. |
| 403 | The signed-in user is not an agent. | |

- **Other devices are signed out.** After a change, the agent's tokens on other devices stop working (they get 401). **The device that changed the password stays signed in**, so do not force a sign-in on success.
- The new password is accepted in the form you validate. There is **no character set restriction** beyond the length (the sign-up page has its own rules).

## 3. Referral code without an id: `GET /api/v1/agents/referral`

Returns the signed-in agent's own code. No id is needed.

```json
{ "success": true, "message": "Agent referral code fetched successfully", "data": "ckO6uNx2O6" }
```

`data` is `null` when the agent has no code. Non-agents get 403. `GET /agents/referral/{id}` still works.

## 4. Profile: `GET /agents/me` and `PUT /agents/me`

`GET /api/v1/agents/me` now has two more fields in `data`:

| Field | Value |
|---|---|
| `is_verified` | `true` when the agent's email is confirmed **and** the account is `active`. Use it for the verified badge instead of guessing from `email_verified_at` and the documents. |
| `background` | The agent's own professional background, text, or `null`. |

`is_verified` does **not** look at the documents yet. A document check can be added later without changing the field.

`PUT /api/v1/agents/me` now also accepts `background`:

| Field | Rule |
|---|---|
| `background` | Optional. Text up to 2000 characters. **Send `null` to clear it.** A longer text is a 422 on `errors.background`. |

As before, send only the fields that changed. Show `background` in the "Your background" field and fall back to `designation` only when it is `null`.

## 5. Transaction detail: `GET /api/v1/agents/transactions/{id}`

Opens one of the agent's own transactions, by **id or by proposal number**. The reply is the same transaction object as `GET /transactions/{id}`. Another agent's transaction is **404**. You can keep calling `GET /transactions/{id}`, which still works.

## 6. Still open (not in this change)

- **Recent activity feed** (`GET /agents/activities`): not built. It needs a design first (which events, and where they are stored). Keep using `GET /agents/transactions` on the dashboard for now.
- **Lines of business:** the agent has only Travel because only Travel is assigned. An administrator assigns the others in the admin portal. It is data, not a code change.
- **Older transactions with no `product`, `net_commission` or `commission_log`:** these come from test data with no matching product code or commission configuration. New transactions should be complete. If a new one is still missing them, tell the backend.
- **A policy that is issued but not yet confirmed as paid** shows as `pending` and is not counted in the statistics. This is on purpose.

## 7. Checklist

- [ ] Dashboard: call `/agents/statistics` with or without dates. Handle a missing range as all-time. Do not treat 422 on missing dates as an error any more.
- [ ] Use `daily_premiums` for the trend chart, and handle `{}`. For ranges of a year or more, fill the zero days yourself.
- [ ] Use `total_premium` and `total_cases`. The old names still work.
- [ ] Settings: password form to `POST /agents/auth/change-password`. Show `errors.current_password` and `errors.password` next to the fields. Do not sign the user out on success.
- [ ] Settings: use `is_verified` for the badge and `background` for the "Your background" field. Save it with `PUT /agents/me` (`null` clears it).
- [ ] Referral: use `GET /agents/referral` (no id). Handle a `null` code.
- [ ] Sales: open a row with `GET /agents/transactions/{id}` (or keep the old route).
- [ ] Test on staging once #57 is there: send a DLT test notification, then check the dashboard numbers and the daily chart.
- [ ] Do not build the activity feed against `/agents/activities`. It does not exist.

## 8. Questions for the backend

- Should `is_verified` also require the agent's required documents to be approved?
- Should the statistics also show issued-but-unpaid policies as a separate figure (for example `pending_cases`)?
- What events should the activity feed show, and should the agent be able to mark them as read?
