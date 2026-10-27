# Issue quote: request and response (front end)

`POST /api/v1/travel/issue-quote`

Step 3 of the travel flow. After the customer has **paid**, the FE calls issue-quote with the `proposal_number` from full-quote. The Draft quote is issued at the insurer and the response carries the policy number and each traveller's certificate number.

```
compare-quote/init  ->  full-quote  ->  payment  ->  issue-quote
```

Headers: `Content-Type: application/json`, `Accept: application/json`. No `Idempotency-Key` is needed: retries are safe by themselves (see "Retrying safely").

## Request

```json
{
  "proposal_number": "MIC-TMPHPC2-261013-000001",
  "payment": {
    "reference": "ULFYGP50569194752265",
    "status": "success",
    "paid_at": "2026-10-14T14:40:00+08:00"
  },
  "custom_field": {
    "plan_name": "TM CSL ASIAN W/ COVID 500K",
    "payment_brand": "GCASH"
  }
}
```

| Field | Required | Notes |
|---|---|---|
| `proposal_number` | yes | `data.proposal_number` from the full-quote response, max 100. Treat it as an opaque string |
| `payment.reference` | no, but send it | The merchant reference of the payment, max 100. See below |
| `payment.status` | no | The status the payment provider returned, max 50. **Not checked and not used**, see below |
| `payment.paid_at` | no | ISO 8601 date and time the payment was made |
| `custom_field.plan_name` | no | Plan name to show on the transaction, max 100. If left out, the insurer's plan name is used |
| `custom_field.payment_brand` | no | How the customer paid, for example `GCASH` or `MasterCard`, max 100. Saved on the transaction |

### `payment.reference`

The merchant reference number that identifies this payment at the payment provider (the same value DLT knows it by).

- Send the real merchant reference, not a made-up value. For Oona it is also used as the insurer's payment session id.
- If it is missing, OI falls back to the reference it already stored for this proposal. If there is none, the insurer may reject the issue. So send it.
- Use the same value on every retry of the same payment.

### `payment.status`

OI does not look at this value, and the insurer always receives `success`. The FE is responsible for calling issue-quote **only after the payment has succeeded**. If you call it for a payment that did not succeed, OI will still try to issue the quote.

### `payment.paid_at`

If you do not send it, the server uses the time of the first issue attempt and keeps it for retries.

### The amount

Do not send an amount. It is always the quoted premium from full-quote.

### Fields you must not send

`payment.session_id`, `payment.coc_number`, `payment.coc_status` and `payment.coc_auth` are no longer used. For Oona the server creates them itself. If you still send them they are ignored.

### Old names

`CustomField.PlanName` and `CustomField.PaymentBrand` are no longer read. Use `custom_field.plan_name` and `custom_field.payment_brand`.

## Response

`200` OK:

```json
{
  "success": true,
  "message": "Successful",
  "data": {
    "id": "b1f0c2d4-...",
    "proposal_number": "MIC-TMPHPC2-261013-000001",
    "status": "completed",
    "policy_no": "POL-123",
    "other_details": {
      "return_code": 1,
      "message": "Policy issued",
      "premium_due": "258.00",
      "ecoc_numbers": [ { "first_name": "Ram", "last_name": "Kumar", "ecoc_number": "ECOC-1" } ]
    },
    "certificate_url": null,
    "issued_at": "2026-10-13T10:00:00Z",
    "insurer": { "code": "MIC", "name": "Malayan Insurance" },
    "premium": { "amount": "258.00", "currency": "PHP" },
    "travellers": [
      { "is_principal_applicant": true, "first_name": "Ram", "last_name": "Kumar",
        "date_of_birth": "1990-03-01", "certificate_number": "ECOC-1" }
    ]
  }
}
```

- `policy_no` is the insurer's policy number.
- `travellers[].certificate_number` is per traveller. Malayan gives one number each, Oona gives the same value to every traveller, and it is `null` for insurers that don't provide one. Don't assume it is present.
- `other_details` is whatever else the insurer answered at issue, or `null`. The keys depend on the insurer (Malayan: `return_code`, `message`, `premium_due`, `ecoc_numbers[]`. Oona: `proposal_no`, `prn_no`, `policy_status`, `proposal_status`, `issue_date`, `ecoc_numbers[]`). Treat it as an optional bag and do not depend on a key being there.
- `certificate_url` is `null` for all insurers for now. The insurer sends the certificate to the customer directly.

## Errors

All errors are `{ "success": false, "message": "..." }`. A `422` from OI's own validation also has `errors{}`.

| Status | Meaning | What to do |
|---|---|---|
| `404` | The `proposal_number` is unknown to OI ("Transaction not found."), or the quote is not yours | Check the number |
| `410` | The quote expired, or its price changed since it was created | Start again from compare-quote |
| `409` | The quote is already being issued | Wait a moment and retry |
| `422` | Validation: `proposal_number` missing, or a field too long (for example `payment.reference` over 100). Or the insurer gateway rejected the request, for example the paid amount does not equal the quoted premium | Show the message and the field error |
| `502` "Travel issue quote failed." | Insurer or gateway failure. The quote stays a Draft | Retry later. Retrying is safe |

Example `422` from validation:

```json
{
  "message": "The payment.reference field must not be greater than 100 characters.",
  "errors": { "payment.reference": ["The payment.reference field must not be greater than 100 characters."] }
}
```

Nothing is sent to the insurer when OI rejects the request with a `422`.

When issuing fails after the customer has paid, OI records it and alerts the team, so the customer is not left unnoticed. Show a message that the payment was received and the policy is being processed, not that the payment failed.

## Retrying safely

Sending the same request again for the same payment never issues a second policy:

- Retry with the **same** `payment.reference` and `payment.paid_at` (or none), and the server replays the original result.
- If you change the reference between attempts, it counts as a new request. The server still will not issue a second policy for a quote that is already issued, and it finishes recording the issued policy for you.
- If an earlier attempt succeeded at the insurer but your request failed, calling issue-quote again completes it and returns the policy.

## Example call

```ts
export async function issueQuote(input: {
  proposalNumber: string;
  payment: { reference: string; paidAt?: string };
  planName?: string;
  paymentBrand?: string;
}) {
  const res = await fetch('/api/v1/travel/issue-quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      proposal_number: input.proposalNumber,
      payment: { reference: input.payment.reference, paid_at: input.payment.paidAt },
      custom_field: { plan_name: input.planName, payment_brand: input.paymentBrand },
    }),
  });

  const body = await res.json();
  if (!res.ok) throw Object.assign(new Error(body.message), { status: res.status, errors: body.errors });

  return body.data; // policy_no, other_details, travellers[].certificate_number
}
```

## Checklist

1. Call issue-quote only after the payment succeeded.
2. Send `proposal_number` and `payment.reference` (max 100 characters).
3. Send `payment.paid_at` and `custom_field.payment_brand` when you have them.
4. Do not send an amount, `session_id` or any `coc_*` field.
5. Handle `410` by going back to compare-quote, and `409` and `502` with a retry.
6. Show `422` errors next to the matching fields.
7. Read the certificate number per traveller and expect it to be `null` for some insurers.

A ready example is in the Postman and Hoppscotch collection "Travel Insurance - Front-end Guide", request "3.1 Issue Quote".
