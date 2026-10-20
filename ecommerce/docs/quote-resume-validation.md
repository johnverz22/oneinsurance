# Resume a full quote by proposal number

`GET /api/v1/travel/full-quote/{proposalNumber}` tells the FE whether the quotation behind a proposal number can still be resumed. Open route for now (request authenticity is deferred, see the project notes); the response carries no traveller details.

## Flow

1. **Format check.** `{insurer}-{plan}-{yymmdd}-{6 digits}`; anything else is `invalid` (422), with no lookup.
2. **Local layer (OI `transactions`)**, no IGW call:
   - no row: `not_found` (404)
   - `policy_number` set: `completed` (409), cannot be resumed
   - `status = completed` without a policy (paid, not issued): `paid_not_issued` (409), cannot be resumed
   - otherwise (`pending`, or `rejected` payment): ask the IGW
3. **IGW layer.** `GET /api/v1/travel/quotes/{proposalNumber}`. The IGW owns expiry and re-validates a Draft on every read (past `expires_at`, or the plan or price changed at the insurer: 410).

## States

| IGW answer | `data.state` | HTTP | `resumable` |
|---|---|---|---|
| 200, `draft` | `resumable` | 200 | true |
| 410, or 200 with `expired` | `expired` | 410 | false |
| 200, `completed` | `completed` | 409 | false |
| 404 | `not_found` | 404 | false |
| 5xx, 502, timeout, IGW login failure | `unavailable` (includes `request_id` from `X-Request-Id`) | 503 | false |

`unavailable` is never reported as expired: the FE should offer a retry. `success` is true only for `resumable`.

## Response

```json
{
  "success": true,
  "message": "This quotation can be resumed.",
  "data": {
    "proposal_number": "MIC-TMPHPC2-261013-000001",
    "state": "resumable",
    "resumable": true,
    "expires_at": "2026-10-20T10:00:00+00:00",
    "quote": { "status": "draft", "insurer": "Malayan Insurance", "product": "Travel Master",
               "plan": "TM Asian", "premium": { "amount": "258.00", "currency": "PHP" },
               "trip": { }, "traveller_count": 1,
               "travellers": [ { "is_principal_applicant": true, "first_name": "Ram", "middle_name": "K",
                                "last_name": "Kumar", "suffix": null, "date_of_birth": "1990-03-01",
                                "selected_addons": [] } ] }
  }
}
```

## Notes

- Code: `ResolveQuoteResumption` (local layer and state mapping) and `FetchTravelQuote` (IGW call, never throws).
- `quote.travellers[]` carries `is_principal_applicant`, the names, `suffix`, `date_of_birth` and `selected_addons`, so the FE can fill the quote form again. ID numbers, addresses and certificate numbers are never passed through (the IGW does not send them, and OI drops them if it ever did).
- Names and birth dates are personal data on an open route with sequential proposal numbers. Request authenticity is deferred (see the project notes); until it lands, anyone who guesses a pending proposal number can read them.
- The IGW call has a side effect (it can mark a quote expired), which is why this is not part of `GET /transactions/{identifier}`.
- Needs a working IGW login (`IGW_CLIENT_ID` / `IGW_CLIENT_SECRET`); without it every non-local answer is `unavailable`.
