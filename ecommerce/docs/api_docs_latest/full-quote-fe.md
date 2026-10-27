# Full quote: request and response (front end)

`POST /api/v1/travel/full-quote`

Step 2 of the travel flow. After the user picks a plan card from compare-quote and enters the traveller details, the FE creates the quote. This is a plain request and response, with no websocket. The result is a **Draft** quote with a `proposal_number`. The next steps are payment, then issue-quote.

```
compare-quote/init  ->  (websocket + GET)  ->  full-quote  ->  payment  ->  issue-quote
```

Headers: `Accept: application/json`, plus `Content-Type: application/json` (or `multipart/form-data` when sending ID images, see "ID images"). `Idempotency-Key` is optional (see "Retrying safely").

## What changed from the old request

The request now uses snake_case like compare-quote. The old names are no longer read: a request that still sends `ClientRequestId` or `AgentCode` gets a `422`, and the FE must switch before this is released.

| Old | New |
|---|---|
| `ClientRequestId` | `client_request_id` |
| `AgentCode` | `agent_code` |
| `CustomField` | `custom_field` |
| `CustomField.PlanName` | `custom_field.plan_name` |
| `CustomField.IdImages[n][...]` | `custom_field.id_images[n][...]` |
| `CustomField.TravellerLists` | removed. Do not send it |

The compare-quote `init` response keys are snake_case too: `client_request_id`, `channel` and `events`. Issue-quote also uses `custom_field.plan_name` and `custom_field.payment_brand` instead of `CustomField.PlanName` and `CustomField.PaymentBrand` (see `issue-quote-changes-for-fe.md`).

## Request

```json
{
  "client_request_id": "870be517-a145-4a25-b8b1-0447513291f4",
  "agent_code": "2BCUMAXGAV",

  "insurer_code": "MIC",
  "product_code": "MIC-TRAVEL-MASTER",
  "plan_code": "TMPHPC2",

  "travellers": [
    {
      "is_principal_applicant": true,
      "first_name": "Ram",
      "last_name": "Kumar",
      "date_of_birth": "1990-03-01",
      "gender": "male",
      "id_type": "PAS",
      "id_number": "L8976M98",
      "address": {
        "line1": "KKK",
        "city": "Manila",
        "country": "PH"
      },
      "email": "xyz@gmail.com",
      "mobile": "9898765467"
    }
  ],

  "custom_field": {
    "plan_name": "TM CSL ASIAN W/ COVID 500K"
  }
}
```

### Top-level fields

| Field | Required | Where it comes from |
|---|---|---|
| `client_request_id` | yes (UUID) | The id returned by compare-quote `init`. The same value you used for the websocket channel and the result GET |
| `agent_code` | yes | The agent selling the policy. Must belong to a known agent with a linked user |
| `insurer_code` | yes | `card.insurer.code` of the picked card |
| `product_code` | yes | `card.product.code` of the picked card |
| `plan_code` | yes | `card.plan.code` of the picked card |
| `travellers[]` | yes | 1 to 20 people. The count must equal `traveler_count` sent to compare-quote, with **exactly one** `is_principal_applicant: true` |
| `custom_field` | no | Fields used by this app only (see below). Never sent to the insurer |
| `custom_field.plan_name` | no | Name of the plan to show on the transaction. If left out, the insurer's plan name is used |
| `custom_field.id_images` | no | ID photos, multipart only (see "ID images") |

`client_request_id`, `agent_code` and `custom_field` are used by this app only and are never sent to the insurer.

### Traveller fields

| Field | Required | Notes |
|---|---|---|
| `is_principal_applicant` | yes | boolean. Exactly one traveller must be `true` (the policy holder) |
| `first_name` | yes | max 100 |
| `middle_name` | no | max 100 |
| `last_name` | yes | max 100 |
| `suffix` | no | max 20 |
| `date_of_birth` | yes | `YYYY-MM-DD`, before today |
| `gender` | yes | `male` or `female`. `other` is accepted by some insurers, but **not Oona** |
| `id_type` | yes | Free string for most insurers (`PAS` for passport). **Oona** only accepts: `VOT`, `POS`, `SSS`, `UMI`, `PAS`, `TIN`, `DRI`, `PRC`, `PID`, `EPH`, `PHI`, `BID`, `SCC`, `OTH` (case does not matter, it is upper-cased for you) |
| `id_number` | yes | max 100 |
| `address.line1` | yes | max 255 |
| `address.line2` | no | max 255 |
| `address.city` | yes | max 100 |
| `address.province` | no | max 100 |
| `address.postal_code` | see below | max 20 |
| `address.province_code` | see below | max 20 |
| `address.city_code` | see below | max 20 |
| `address.country` | yes | 2-letter country code, uppercase, e.g. `PH` |
| `email` | no | valid email. The principal traveller's email is where the client's alerts go, so send it |
| `mobile` | no (**yes for Oona**) | max 30. The principal traveller's number is used for the client's alerts, so send it |
| `selected_addons` | no | array of add-on codes the user ticked: `covid19`, `hazardous_sports`, `sports_equipment`, `cruise`. Each one must have been offered as an optional coverage on the picked card |

**Insurers that need address codes (Oona today):** `address.postal_code`, `address.province_code` and `address.city_code` are required. The city must belong to the province, and the zip code to the city, or you get a `422` on the field.

### Not validated here

OI itself only checks `client_request_id` and `agent_code` (plus the shape of `custom_field`). Everything else is passed to the insurer gateway (the IGW), which does all the validation and returns the errors below. Use the values the gateway accepts.

## Response

`201` Created:

```json
{
  "success": true,
  "message": "Successful",
  "data": {
    "id": "b1f0c2d4-...",
    "proposal_number": "MIC-TMPHPC2-261013-000001",
    "status": "draft",
    "insurer": { "code": "MIC", "name": "Malayan Insurance" },
    "product": { "code": "MIC-TRAVEL-MASTER", "name": "Travel Master" },
    "plan": { "code": "TMPHPC2", "name": "TM CSL ASIAN W/ COVID 500K" },
    "premium": { "amount": "258.00", "currency": "PHP" },
    "travellers": [ { "is_principal_applicant": true, "first_name": "Ram", "last_name": "Kumar", "date_of_birth": "1990-03-01" } ],
    "expires_at": "2026-10-14T00:00:00Z"
  }
}
```

Keep `data.proposal_number`. It identifies the quote for payment and issue-quote, and for resuming it later. The premium in this response is the amount the customer must pay. The quote stays a Draft until it is issued, and it expires at `expires_at`.

## Errors

All errors are `{ "success": false, "message": "..." }`.

| Status | Meaning | What to do |
|---|---|---|
| `422` | Validation. The body also has `errors{}`, keyed by field path such as `travellers.0.id_number` | Show the error under that field |
| `422` on `quote_comparison_request_id` | The comparison is not ready, has expired, or the plan was not in its results | Run compare-quote again |
| `422` "Agent not found or has no linked user for code: ..." | `agent_code` is wrong | Check the agent code |
| `409` | A request with the same `Idempotency-Key` is still being processed | Wait a moment and retry |
| `502` "Travel full quote failed." | The insurer or gateway failed (auth, server error) | Retry later, with the same key |

Error keys such as `travellers.0.id_number` contain dots. Read them with bracket access (`errors['travellers.0.id_number']`), not as a nested path.

## Retrying safely

If a request times out and you retry it, you must not create a second quote. Either send the same `Idempotency-Key` header on both attempts, or send an identical body (the API derives a stable key from the body, so an identical retry returns the original quote and the same `proposal_number`). A changed body with the same key is rejected.

## ID images (optional)

To send ID photos, switch to `multipart/form-data`. Send every quote field as an individual form field (arrays use `name[0][field]`) and add the images under `custom_field[id_images][n]`:

| Form field | Type | Notes |
|---|---|---|
| `client_request_id`, `agent_code`, `insurer_code`, `product_code`, `plan_code` | text | as above |
| `travellers[0][first_name]`, `travellers[0][address][line1]`, ... | text | one field per traveller value |
| `custom_field[plan_name]` | text | optional |
| `custom_field[id_images][0][file_name]` | text | base name for the saved files |
| `custom_field[id_images][0][front_id]` | file | jpeg, jpg, png or webp, up to 10 MB |
| `custom_field[id_images][0][back_id]` | file | jpeg, jpg, png or webp, up to 10 MB |

Add `custom_field[id_images][1][...]` and so on for more travellers. Once an image set is sent, `file_name`, `front_id` and `back_id` are all required for it.

With multipart, every value arrives as a string. Send booleans as `1` or `0` (`travellers[0][is_principal_applicant]=1`), not `"true"`, or the gateway rejects them.

```ts
const fd = new FormData();
fd.append('client_request_id', clientRequestId);
fd.append('agent_code', agentCode);
fd.append('insurer_code', card.insurer.code);
fd.append('product_code', card.product.code);
fd.append('plan_code', card.plan.code);
fd.append('travellers[0][is_principal_applicant]', '1');
fd.append('travellers[0][first_name]', 'Ram');
// ...the rest of the traveller fields
fd.append('custom_field[plan_name]', card.plan.name);
fd.append('custom_field[id_images][0][file_name]', 'ram_kumar');
fd.append('custom_field[id_images][0][front_id]', frontFile); // File object
fd.append('custom_field[id_images][0][back_id]', backFile);

// Do not set Content-Type yourself, the browser adds the multipart boundary.
const res = await fetch('/api/v1/travel/full-quote', {
  method: 'POST',
  headers: { Accept: 'application/json' },
  body: fd,
});
```

The images are saved to Google Drive after the quote is created, so a problem with them does not undo the quote. Check the `201` and keep the `proposal_number` either way.

## Example call (JSON)

```ts
export async function createFullQuote(input: {
  clientRequestId: string;
  agentCode: string;
  card: { insurer: { code: string }; product: { code: string }; plan: { code: string; name: string } };
  travellers: unknown[];
  idempotencyKey?: string;
}) {
  const res = await fetch('/api/v1/travel/full-quote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(input.idempotencyKey && { 'Idempotency-Key': input.idempotencyKey }),
    },
    body: JSON.stringify({
      client_request_id: input.clientRequestId,
      agent_code: input.agentCode,
      insurer_code: input.card.insurer.code,
      product_code: input.card.product.code,
      plan_code: input.card.plan.code,
      travellers: input.travellers,
      custom_field: { plan_name: input.card.plan.name },
    }),
  });

  const body = await res.json();
  if (!res.ok) throw Object.assign(new Error(body.message), { status: res.status, errors: body.errors });

  return body.data; // keep data.proposal_number
}
```

## After full-quote

1. Show the premium (`data.premium`) and take payment.
2. Call `POST /api/v1/travel/issue-quote` with the `proposal_number` and the payment result. See `issue-quote-changes-for-fe.md`.
3. If the customer comes back later, `GET /api/v1/travel/full-quote/{proposal_number}` tells you whether the quote can still be resumed. See `quote-resume-validation.md`.

A ready example is in the Postman and Hoppscotch collection "Travel Insurance - Front-end Guide", request "2.1 Full Quote".

## Checklist

1. Get `insurer_code`, `product_code`, `plan_code` and `plan.name` from the card the user picked.
2. Send exactly the `traveler_count` you gave compare-quote, with one principal traveller.
3. Send the principal traveller's `email` and `mobile`.
4. For Oona, also send `mobile`, `province_code`, `city_code`, `postal_code` and an Oona `id_type`.
5. Show `422` `errors` against the matching fields, and run compare-quote again on a `422` for `quote_comparison_request_id`.
6. Keep `data.proposal_number` for payment and issue-quote.
