# Travel Insurance: front-end integration guide

Audience: front-end developers (Next.js / React). Backend: One Insurance API.

- Staging base URL: `https://stage-api.oneinsurance.shop`
- Staging websocket: `wss://stage-api.oneinsurance.shop` (port 443, path `/app`)
- Postman: import `Travel-openapi.json` and run the requests in order.

## 1. The flow

Travel purchase has two API steps. Step 1 is asynchronous and uses a websocket; step 2 is a normal request.

```
1. COMPARE QUOTE                                   2. FULL QUOTE
   POST /compare-quote/init  -> ClientRequestId       POST /full-quote
   subscribe to channel <ClientRequestId>               { ClientRequestId, plan picked
   event insurance.plan.received                          from a card, travellers }
   GET  /compare-quote/<ClientRequestId> -> cards       -> 201 quote + proposal_number
   user picks one card
```

**One id runs through the whole flow.** `ClientRequestId` is returned by compare-quote `init`. It is the websocket channel name, the id in the result `GET`, and the id you send back at full-quote.

## 2. Step 1: Compare Quote

Comparing plans can take several seconds (the API queries the insurers), so you start it, get an id back, and are told over a websocket when it is ready.

```
Browser                         One Insurance API                 Insurers
   | POST /compare-quote/init         |                                |
   |--------------------------------->|-- submit ---------------------->|
   |<-- 202 { ClientRequestId } ------|                                |
   | subscribe to channel <id>        |-- poll ----------------------->|
   |<== event: insurance.plan.received (or .failed) ===|               |
   | GET /compare-quote/<id>          |                                |
   |<-- 200 { data: [cards] } --------|                                |
```

The event only says "ready". It carries no plans. Always fetch the cards with the GET.

### 2.1 Start a comparison

`POST /api/v1/travel/compare-quote/init`

Headers: `Content-Type: application/json`, `Accept: application/json`. `Idempotency-Key` is optional; reuse the same value when retrying the same request.

Body: the InsureMo-shaped travel payload. See the Postman request "1.1 Init Compare Quote" for a complete example. Required top-level fields: `ProductCode`, `ProductVersion`, `EffectiveDate`, `ExpiryDate`, `TripType`, `TravelType`, `TravelDetailList[]`, `PolicyLobList[]` (with exactly one main insured risk, `IsMainInsured = "Y"`), `AgentCode`, `Slug`. `NoOfTravellers` sets how many travellers full-quote must later receive.

Response `202`:

```json
{
  "success": true,
  "message": "Accepted",
  "data": {
    "ClientRequestId": "870be517-a145-4a25-b8b1-0447513291f4",
    "Channel": "870be517-a145-4a25-b8b1-0447513291f4",
    "Events": { "ready": "insurance.plan.received", "failed": "insurance.plan.failed" }
  }
}
```

`init` submits to the insurer gateway before it responds, so a rejected comparison fails **here**, not later as a websocket event.

Errors from `init` (all `{ success: false, message }`):

| Status | Meaning |
|---|---|
| `422` | Invalid payload, or "requires a main insured traveller" |
| `401` / `5xx` / other | Upstream or configuration failure. Show a generic error and retry |

### 2.2 Get the result

`GET /api/v1/travel/compare-quote/{ClientRequestId}`

| Status | Meaning | Body |
|---|---|---|
| `200` | Ready | `{ success: true, data: [card, ...] }` |
| `202` | Still running | `{ success: true, data: { status: "pending" } }`, header `Retry-After: 2` |
| `404` | Unknown or expired id (results are kept for 1 hour) | `{ success: false, message }` |
| `410` | Comparison expired at the insurer, search again | `{ success: false, message }` |
| `504` | Timed out, search again | `{ success: false, message }` |
| other | Upstream failure (for example `502`, `500`) | `{ success: false, message }` |

A card looks like this:

```json
{
  "insurer":  { "name": "Malayan Insurance", "logo_url": "https://...", "code": "MIC" },
  "product":  { "code": "MIC-TRAVEL-MASTER", "name": "Travel Master" },
  "plan":     { "code": "TMPHPC2", "name": "TM CSL ASIAN W/ COVID 500K", "sum_insured": "500000.00" },
  "zone":     { "code": "ASIAN", "name": "Asian" },
  "premium":  { "amount": "258.00", "currency": "PHP" },
  "coverages": [
    {
      "category": "Personal Accident Insurance",
      "name": "Accidental Death, Dismemberment and Disablement",
      "is_optional": false,
      "addon_code": null,
      "limit": { "type": "amount", "amount": "1000000.00", "sub_limit_amount": null,
                 "sub_limit_per": null, "per_unit": null, "per_unit_size": null,
                 "max_units": null, "waiting_period_hours": null, "notes": null }
    }
  ]
}
```

Amounts are strings. Do not parse them as floats for money calculations.

The three codes `insurer.code`, `product.code` and `plan.code` identify the card. You send them back at full-quote.

### 2.3 Websocket

- Server: Laravel Reverb (Pusher protocol). Channel type: **public**, so no auth endpoint is needed.
- Channel name: the `ClientRequestId`.
- Events (custom names, so Echo needs the **leading dot**):

| Event | Payload |
|---|---|
| `.insurance.plan.received` | `{ "cache_key": "igw_compare_quote_<id>" }`. Ready: call the GET |
| `.insurance.plan.failed` | `{ "client_request_id": "<id>", "code": 410, "message": "..." }` |

#### Install

```bash
npm install laravel-echo pusher-js
```

#### Environment (Next.js)

```dotenv
NEXT_PUBLIC_API_URL=https://stage-api.oneinsurance.shop
NEXT_PUBLIC_REVERB_APP_KEY=<ask backend>
NEXT_PUBLIC_REVERB_HOST=stage-api.oneinsurance.shop
NEXT_PUBLIC_REVERB_PORT=443
NEXT_PUBLIC_REVERB_SCHEME=https
```

`NEXT_PUBLIC_*` values are inlined at build time. Rebuild after changing them.

#### Echo client (browser only)

```ts
// lib/echo.ts
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global { interface Window { Pusher: typeof Pusher } }

let echo: Echo<'reverb'> | null = null;

export function getEcho() {
  if (typeof window === 'undefined') return null;      // never create on the server
  if (echo) return echo;

  window.Pusher = Pusher;
  const useTls = process.env.NEXT_PUBLIC_REVERB_SCHEME === 'https';

  echo = new Echo({
    broadcaster: 'reverb',
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY!,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST!,
    wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 80),
    wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 443),
    forceTLS: useTls,
    enabledTransports: ['ws', 'wss'],
  });
  return echo;
}
```

`forceTLS` must be `true` on HTTPS pages. Otherwise the browser tries plain `ws://` and fails.

#### React hook for compare-quote

```ts
// hooks/useTravelCompare.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { getEcho } from '@/lib/echo';

const API = process.env.NEXT_PUBLIC_API_URL!;
const MAX_WAIT_MS = 60_000;      // give up after this
const FALLBACK_POLL_MS = 3_000;  // safety net if the event is missed

type Status = 'idle' | 'loading' | 'ready' | 'error';

export function useTravelCompare() {
  const [status, setStatus] = useState<Status>('idle');
  const [cards, setCards] = useState<any[]>([]);
  const [clientRequestId, setClientRequestId] = useState<string | null>(null);
  const [error, setError] = useState<{ code?: number; message: string } | null>(null);
  const cleanup = useRef<() => void>(() => {});

  useEffect(() => () => cleanup.current(), []);   // unmount

  const compare = useCallback(async (payload: unknown) => {
    cleanup.current();                             // cancel any previous run
    setStatus('loading'); setCards([]); setError(null); setClientRequestId(null);

    // 1. start
    const res = await fetch(`${API}/api/v1/travel/compare-quote/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!res.ok) {                                  // rejected at init: no id, no channel
      setStatus('error'); setError({ code: res.status, message: body.message });
      return;
    }
    const id: string = body.data.ClientRequestId;
    setClientRequestId(id);                         // keep it: full-quote needs it

    let done = false;
    const finish = (fn: () => void) => { if (done) return; done = true; teardown(); fn(); };

    // 2. fetch the cards (used by the event, the first check and the fallback)
    const fetchResult = async () => {
      const r = await fetch(`${API}/api/v1/travel/compare-quote/${id}`, {
        headers: { Accept: 'application/json' },
      });
      if (r.status === 202) return;                 // still pending
      const j = await r.json();
      if (r.ok) finish(() => { setCards(j.data); setStatus('ready'); });
      else finish(() => { setError({ code: r.status, message: j.message }); setStatus('error'); });
    };

    // 3. subscribe
    const echo = getEcho();
    const channel = echo?.channel(id);
    channel?.listen('.insurance.plan.received', fetchResult);
    channel?.listen('.insurance.plan.failed', (e: { code: number; message: string }) =>
      finish(() => { setError({ code: e.code, message: e.message }); setStatus('error'); }));

    // 4. safety net: one immediate check (event may have fired before we subscribed),
    //    then a slow poll, then a hard timeout
    fetchResult();
    const poll = setInterval(fetchResult, FALLBACK_POLL_MS);
    const timeout = setTimeout(
      () => finish(() => { setError({ code: 504, message: 'Timed out waiting for quotes.' }); setStatus('error'); }),
      MAX_WAIT_MS,
    );

    function teardown() {
      clearInterval(poll); clearTimeout(timeout);
      echo?.leave(id);                              // unsubscribe
    }
    cleanup.current = () => { done = true; teardown(); };
  }, []);

  return { compare, status, cards, clientRequestId, error };
}
```

Why the immediate GET and the fallback poll:

- You only learn the channel name after `init` returns, so you subscribe after the work has started. On a fast result the event can fire before the subscription is active. The immediate GET catches that.
- The fallback poll covers a dropped websocket connection. The event is an optimization, and the GET is the source of truth.
- Always clean up: leave the channel and clear timers on unmount or when starting a new search. React Strict Mode runs effects twice in development.

## 3. Step 2: Full Quote

Once the user picks a card and enters the traveller details, create the quote. This is a plain request and response, with no websocket.

`POST /api/v1/travel/full-quote`

Headers: `Content-Type: application/json`, `Accept: application/json`. `Idempotency-Key` is optional (see 3.3).

### 3.1 Request

```json
{
  "ClientRequestId": "870be517-a145-4a25-b8b1-0447513291f4",
  "AgentCode": "2BCUMAXGAV",

  "insurer_code": "MIC",
  "product_code": "MIC-TRAVEL-MASTER",
  "plan_code": "TMPHPC2",

  "travellers": [
    {
      "is_principal_applicant": true,
      "first_name": "Ram",
      "middle_name": "K",
      "last_name": "Kumar",
      "suffix": null,
      "date_of_birth": "1990-03-01",
      "gender": "male",
      "id_type": "PAS",
      "id_number": "L8976M98",
      "address": {
        "line1": "KKK",
        "line2": "Manila",
        "city": "Manila",
        "province": "Metro Manila",
        "postal_code": "2922",
        "country": "PH"
      },
      "email": "xyz@gmail.com",
      "mobile": "9898765467"
    }
  ],

  "CustomField": {
    "PlanName": "TM CSL ASIAN W/ COVID 500K",
    "TravellerLists": []
  }
}
```

| Field | Source |
|---|---|
| `ClientRequestId` | The id returned by compare-quote `init` (same value you used for the websocket and the GET) |
| `AgentCode` | The agent selling the policy |
| `insurer_code`, `product_code`, `plan_code` | From the card the user picked: `card.insurer.code`, `card.product.code`, `card.plan.code` |
| `travellers[]` | The people to insure. The count must equal `NoOfTravellers` from the compare request, with exactly one `is_principal_applicant: true` |
| `CustomField` | Optional, used only by this API (never sent to the insurer). `PlanName` names the plan on the transaction, `TravellerLists` is the traveller list record, and `IdImages` carries ID photos (multipart, see 3.4) |

**This API does not validate the quote fields.** Everything except `ClientRequestId` and `AgentCode` is passed to the insurer gateway, which validates it (id types, country codes, required traveller fields and so on). Use the values the gateway accepts; ask the backend team for the current list of `id_type` values and country codes.

### 3.2 Response

`201` Created:

```json
{
  "success": true,
  "message": "Successful",
  "data": {
    "id": "b1f0c2d4-...",
    "proposal_number": "MIC-2026-0001",
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

Keep `data.proposal_number`. It identifies the quote for payment and later steps. The quote is a Draft until it is issued, and it expires at `expires_at`.

Errors (all `{ success: false, message }`):

| Status | Meaning | What to do |
|---|---|---|
| `422` | Validation. The body also has `errors{}`, keyed by field path such as `"travellers.0.id_number"` | Show the field errors |
| `422` on `quote_comparison_request_id` | The comparison is not ready, has expired, or the plan was not in its results | Search again |
| `409` | A request with the same `Idempotency-Key` is still being processed | Wait and retry |
| `422` "Agent not found..." | `AgentCode` unknown or has no linked user | Check the agent |
| `502` "Travel full quote failed." | Insurer or gateway failure (auth, server error) | Retry later |

Error keys such as `travellers.0.id_number` contain dots. Read them with bracket access (`errors['travellers.0.id_number']`), not as a nested path.

### 3.3 Retrying safely

If a request times out and you retry it, you must not create a second quote. Either send the same `Idempotency-Key` header on both attempts, or send an identical body (the API derives a stable key from the payload, so an identical retry returns the original quote). A changed body with the same key is rejected.

### 3.4 Uploading ID images (optional)

To send ID photos, switch to `multipart/form-data`. Send the quote fields as individual form fields (`travellers[0][first_name]` and so on) and add the images under `CustomField[IdImages][n][file_name]`, `[front_id]` and `[back_id]` (jpeg, jpg, png or webp, up to 10 MB each).

With multipart, every field arrives as a string. Send booleans as `1` or `0` (for example `travellers[0][is_principal_applicant]=1`), not `"true"`, or the gateway rejects them.

### 3.5 Example call

```ts
// lib/travel.ts
export async function createFullQuote(input: {
  clientRequestId: string;
  agentCode: string;
  card: { insurer: { code: string }; product: { code: string }; plan: { code: string; name: string } };
  travellers: unknown[];
}) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/travel/full-quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      ClientRequestId: input.clientRequestId,
      AgentCode: input.agentCode,
      insurer_code: input.card.insurer.code,
      product_code: input.card.product.code,
      plan_code: input.card.plan.code,
      travellers: input.travellers,
      CustomField: { PlanName: input.card.plan.name, TravellerLists: [] },
    }),
  });
  const body = await res.json();
  if (!res.ok) throw Object.assign(new Error(body.message), { status: res.status, errors: body.errors });
  return body.data;                                  // includes proposal_number
}
```

## 4. Handling errors in the UI

| Where | Code | Suggested UI |
|---|---|---|
| compare `init` | `422` | Show the message. Nothing was started, so there is no channel to clean up |
| compare GET / event | `410` | "Your search expired. Please search again." |
| compare GET / event | `504` | "Quotes are taking longer than usual. Try again." |
| compare GET | `404` | Treat as expired, search again |
| full-quote | `422` with `errors{}` | Highlight the offending fields |
| full-quote | `422` on `quote_comparison_request_id` | "Your quotes expired. Please compare again." |
| full-quote | `502` / `5xx` | Generic error and retry |

## 5. Testing

1. Postman: import `Travel-openapi.json` and run **1.1 Init Compare Quote**, then **1.2 Get Compare Quote Result** until it returns `200`, then **2.1 Full Quote**. The collection saves `client_request_id`, the first card's codes and `proposal_number` into variables for you.
2. Browser: open DevTools, Network, WS tab. You should see a `wss://stage-api.oneinsurance.shop/app/<key>` connection with `pusher:connection_established`, then `pusher_internal:subscription_succeeded`, then `insurance.plan.received`.
3. Common problems:
   - Connection fails or mixed-content error: `forceTLS` is false on an HTTPS page, or the key or host is wrong.
   - Connected but no events: forgot the leading dot in `.insurance.plan.received`.
   - Works locally, not on staging: `NEXT_PUBLIC_*` values weren't rebuilt.
   - Full-quote returns a `422` on `quote_comparison_request_id`: the comparison has not finished (wait for `200` on the GET first), or you sent a different id than the one `init` returned.

## 6. Notes

- The channel is public. The id is an unguessable UUID, and the payload sent over the socket carries no plan data.
- Compare results are kept for 1 hour. After that the GET returns 404 and you need to search again.
- The older synchronous `POST /api/v1/travel/compare-quote` still exists. It holds the connection for up to about 25 seconds, so prefer the websocket flow for the UI.
- These endpoints currently have no authentication. If that changes before production, backend will tell you which header to send.
