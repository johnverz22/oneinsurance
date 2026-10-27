# Compare quote: new flat request payload (front end)

Applies to `POST /api/v1/travel/compare-quote/init`. The websocket flow, the result GET and full-quote are unchanged.

## What changes

The compare-quote request body is now OneInsuranceAPI's own flat payload (7 fields, no nesting) plus `agent_code` and `slug`. The old InsureMo-shaped body (`TravelDetailList`, `PolicyLobList`, `EffectiveDate`, ...) is **no longer accepted**. A request that still sends it gets a `422`, so the front end must switch before this is released.

Before (old, now rejected):

```json
{
  "ProductCode": "TRAVEL",
  "ProductVersion": "1.0",
  "EffectiveDate": "2026-12-01",
  "ExpiryDate": "2026-12-10",
  "TripType": "SINGLE",
  "TravelType": "INDIVIDUAL",
  "NoOfTravellers": 1,
  "TravelDetailList": [
    { "TravelCoverageArea": "WORLD", "PlaceOfOrgin": "PH", "TravelCountry": "JP", "DisplaySequence": 1 }
  ],
  "PolicyLobList": [
    { "ProductCode": "TRAVEL", "PolicyRiskList": [
      { "ProductElementCode": "R00001", "IsMainInsured": "Y", "DateOfBirth": "1990-03-01" }
    ] }
  ],
  "AgentCode": "2BCUMAXGAV",
  "Slug": "ifrc"
}
```

After:

```json
{
  "origin_country": "PH",
  "destination_countries": ["JP"],
  "return_destination": "SG",
  "departure_date": "2026-12-01",
  "return_date": "2026-12-10",
  "traveler_count": 1,
  "principal_date_of_birth": "1990-03-01",
  "agent_code": "2BCUMAXGAV",
  "slug": "ifrc"
}
```

## Fields

| Field | Required | Type | Notes |
|---|---|---|---|
| `origin_country` | yes | string | 2-letter country code, uppercase, e.g. `"PH"` |
| `destination_countries` | yes | array of strings | 1 to 10 two-letter codes, e.g. `["JP", "KR"]`. List each country once |
| `return_destination` | no | string | 2-letter code of the country the trip returns to. Leave the key out when there is none. No insurer prices from it yet, it is only kept on the quote |
| `departure_date` | yes | date `YYYY-MM-DD` | Must be before `return_date`. The IGW also rejects a date in the past |
| `return_date` | yes | date `YYYY-MM-DD` | Must be after `departure_date` |
| `traveler_count` | yes | integer | At least 1 (the IGW allows up to 20). Full-quote must later receive exactly this many travellers |
| `principal_date_of_birth` | yes | date `YYYY-MM-DD` | Date of birth of the main traveller |
| `agent_code` | yes | string | The agent's code (was `AgentCode`). Kept by this app, not sent to the IGW |
| `slug` | yes | string | The same slug as before (e.g. `"ifrc"`), now lower case (was `Slug`). Kept by this app, not sent to the IGW |

Any other key you send is ignored, so there is no need to send `ProductCode`, `TripType` and the rest. Keep sending `agent_code` and `slug`: they are required.

## Moving from the old shape

| Old field | New field |
|---|---|
| `AgentCode` | `agent_code` (still required) |
| `Slug` | `slug` (still required) |
| `TravelDetailList[0].PlaceOfOrgin` | `origin_country` |
| `TravelDetailList[].TravelCountry` (one entry per country) | `destination_countries` (one array, each country once) |
| `EffectiveDate` | `departure_date` |
| `ExpiryDate` | `return_date` |
| `NoOfTravellers` | `traveler_count` (now required) |
| `DateOfBirth` of the risk with `IsMainInsured = "Y"` | `principal_date_of_birth` |
| `ProductCode`, `ProductVersion`, `TripType`, `TravelType`, `BranchCode`, `Age`, `LGT`, `PromoCodeList`, `PolicyCustomerList`, traveller names and the rest of `PolicyLobList` | not needed, remove |

Things to watch:

- Dates are sent as `YYYY-MM-DD`, not a timestamp.
- Country codes are 2 letters. Do not send names such as `"PHILIPPINES"` or 3-letter codes.
- `traveler_count` is no longer optional and is no longer worked out from the risks list. Send it.
- The "main insured" check is gone: the main traveller is simply `principal_date_of_birth`.

## Response and errors

The success response is still `202`, but its keys are now snake_case: `client_request_id`, `channel` and `events` (they were `ClientRequestId`, `Channel` and `Events`). Then listen on the channel and fetch the cards exactly as before.

A bad body is rejected right away with `422`:

```json
{
  "message": "The origin country field is required. (and 1 more error)",
  "errors": {
    "origin_country": ["The origin country field is required."],
    "return_date": ["The return date field is required."]
  }
}
```

Show these under the matching form fields. A country code that has the right length but is not a real country is rejected by the IGW, also at init and also as a `422`.

## Full-quote

Do not send `return_destination` on full-quote. It belongs to compare-quote only; full-quote ignores it. The `client_request_id` returned by init is what ties full-quote back to the comparison.

## Checklist

1. Build the request from the new field names above and stop sending the old ones.
2. Send `traveler_count` and `principal_date_of_birth` explicitly, and send `agent_code` and `slug` (renamed from `AgentCode` and `Slug`).
3. Send `return_destination` only when the user picked one.
4. Handle the `422` `errors` object for init.
5. Re-test the whole flow: init, websocket event, result GET, full-quote.

A ready example is in the Postman and Hoppscotch collection "Travel Insurance - Front-end Guide", request "1.1 Init Compare Quote".
