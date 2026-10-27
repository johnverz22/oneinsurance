# API integration findings — `api_docs_latest` vs current code

The three docs in this folder describe a contract change on the OI backend:
all travel endpoints now take **flat snake_case payloads**. The old
InsureMo-shaped bodies (`TravelDetailList`, `PolicyLobList`, `ClientRequestId`,
`AgentCode`, `CustomField.PlanName`, …) are rejected with `422`.

## 1. Compare quote init — `POST /travel/compare-quote/init`

Doc: `compare-quote-flat-payload-fe.md`

Current code (`src/utils/mappers/travel-insurance/init-compare-quote.ts`) still
sends the full InsureMo body (`ProductCode`, `EffectiveDate`, `TripType`,
`TravelDetailList`, `PolicyCustomerList`, `PolicyLobList`, `ReturnDestination`,
`AgentCode`, `Slug`). **This now gets a 422.**

New contract (9 fields, nothing else needed):

| New field | Source |
|---|---|
| `origin_country` | first leg `PlaceOfOrgin`, ISO2 |
| `destination_countries` | outbound legs `TravelCountry`, ISO2, **deduplicated**, 1–10 |
| `return_destination` | `returnDestination`, ISO2 — **omit the key when none** (doc is explicit; our current `'PH'` fallback must go) |
| `departure_date` | `departureDate` |
| `return_date` | `returnDate` |
| `traveler_count` | `noOfAdults + noOfChildren` (now required) |
| `principal_date_of_birth` | `dateOfBirth` |
| `agent_code` | agent code (was `AgentCode`) |
| `slug` | same value as before, lower-case key (was `Slug`) |

Init **response** keys are now snake_case too: `data.client_request_id`,
`data.channel`, `data.events` (were `ClientRequestId`, `Channel`, `Events`).
`use-travel-compare.ts` reads `data.ClientRequestId` and subscribes
`echo.channel(id)` — must read `client_request_id` and prefer the returned
`channel` name.

Init `422` bodies carry an `errors{}` map keyed by field — the hook should pass
it through so callers can show field errors.

Open question: doc examples use `"slug": "ifrc"`; we send `"travel-insurance"`.
Keeping our existing value since the doc says "the same slug as before" —
confirm with backend if compare-quote starts rejecting it.

## 2. Full quote — `POST /travel/full-quote`

Doc: `full-quote-fe.md`

Current mapper (`src/utils/mappers/travel-insurance/full-quote.ts`) sends:

- `ClientRequestId` → must be `client_request_id`
- `AgentCode` → must be `agent_code`
- `client_email` → **not in the contract** — remove
- `CustomField.PlanName` → `custom_field.plan_name`
- `CustomField.TravellerLists` → **removed — do not send**
- ID images (mutation `full-quote-request.ts`) → `custom_field[id_images][n][file_name|front_id|back_id]`

The `travellers[]` shape we already send matches the doc exactly
(`is_principal_applicant`, names, `date_of_birth`, `gender`, `id_type`,
`id_number`, `address{line1,line2,city,province,postal_code,province_code,
city_code,country}`, `email`, `mobile`, `selected_addons`). No changes needed
there. `insurer_code`, `product_code`, `plan_code` already correct.

Do **not** send `return_destination` on full-quote — compare-quote only.

## 3. Issue quote — `POST /travel/issue-quote`

Doc: `issue-quote-fe.md`

Current state:

- BFF route (`api/travel-insurance/issue-quote/route.ts`) forwards
  `CustomField` verbatim → must forward `custom_field` with
  `plan_name` / `payment_brand` (old names are ignored by the backend now).
- `/issuance` page builds `CustomField: { PlanName, PaymentBrand }` → rename.
- `payment.status`: doc says it is **optional and unchecked**. Our BFF
  *requires* it and returns 400 — and `proposal-loader.ts`
  `recoverIssuedPolicy()` calls the BFF **without** a status, meaning the
  paid-not-issued recovery probe has been 400ing at our own route. Relax the
  requirement and only forward it when present.
- Already correct: `proposal_number`, `payment.reference` (max 100),
  `payment.paid_at` optional, no amount, no `session_id`/`coc_*`.

## 4. Unaffected

- `GET /travel/compare-quote/{id}` result shape — unchanged per docs; the
  plan-card mapping in `compare-quote/route.ts` stays.
- `GET /travel/full-quote/{proposal}` resume check (`proposal-loader.ts`).
- Payment/DLT endpoints — different contract, not in these docs.
- `InitTravelInsuranceRequest` type — still used by the legacy CTPL
  synchronous path (`init-compare` GET, `compare-quote` POST); leave it.

## Change list

1. `init-compare-quote.ts`: build the flat snake_case payload (new exported
   type), dedupe destinations, omit `return_destination` when unset.
2. `use-travel-compare.ts`: new payload type; read `client_request_id`; use
   `data.channel` for Echo when present; surface `errors` on failure.
3. `plans/page.tsx`: drop the `as InitTravelInsuranceRequest` cast.
4. `full-quote.ts` + `full-quote-request.ts`: rename request fields, drop
   `TravellerLists`/`client_email`, `custom_field[id_images]` form keys.
5. `full-quote/route.ts`: comment updates only (reconstruction is
   key-agnostic).
6. `issue-quote/route.ts`: forward `custom_field`; make `payment.status`
   optional.
7. `issuance/page.tsx` + `policy-types.ts`: send `custom_field.{plan_name,
   payment_brand}`.
