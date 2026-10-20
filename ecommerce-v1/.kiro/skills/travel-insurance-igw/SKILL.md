---
name: travel-insurance-igw
description: >
  Integrate with the One Insurance IGW Travel Compare-Quote API (v2, live as of Sep 2026).
  Use this skill whenever working on: the travel insurance compare-quote flow, the
  BFF route at /api/travel-insurance/compare-quote, the IgwPlanItem/IgwCoverage mapper,
  the InsurancePlan type, benefit display in insurance-plan.tsx, coverage area / zone
  mapping, or debugging why wrong zone plans are returned for a destination.
---

# Travel Insurance — IGW Compare-Quote API (v2)

This skill documents the IGW backend's `/travel/compare-quote` endpoint as it operates
in the One Insurance ecommerce project, covering the full round-trip: what we send,
what we receive, how we map it internally, and how the UI renders it.

Read `references/api-reference.md` for full request/response schemas and curl examples.

---

## Base URL & Auth

```
Base:  https://stage-api.oneinsurance.shop/api/v1   (= BASE_URL env var)
Token: Bearer (BACKEND_TOKEN env var, server-side only)
```

> **Note (Oct 2026):** The backend dropped the `/igw` path prefix. All travel endpoints
> are now under `/api/v1/travel/...` directly, not `/api/v1/igw/travel/...`.
> The BFF routes use `${process.env.BASE_URL}/travel/...` which is correct.

All calls go through the Next.js BFF — never called directly from the browser.

---

## Request payload

Sent by `travelInsuranceSchemaToInitCompareQuote()` in
`src/utils/mappers/travel-insurance/init-compare-quote.ts`.

Key fields that drive plan results:

| Field | Source | Notes |
|---|---|---|
| `TravelDetailList[].TravelCountry` | ISO2 country code | **Drives zone on backend** — backend ignores `TravelCoverageArea` |
| `TravelDetailList[].TravelCoverageArea` | `DOMESTIC`/`APAC`/`SCHENGEN`/`WORLD` | Used by frontend only for Pacific Cross static plan selection |
| `TravelDetailList[].PlaceOfOrgin` | ISO2 — always `PH` | |
| `EffectiveDate` / `ExpiryDate` | `YYYY-MM-DD` | Departure / return dates |
| `TripType` | `SINGLE` or `ANNUAL` | |
| `TravelType` | `INTERNATIONAL` or `DOMESTIC` | |
| `Age` | Integer | Main insured age |
| `NoOfTravellers` | Integer | Adults + children |

Country codes are mapped from internal coverage-map codes to ISO2 in
`COUNTRY_TO_ISO2` inside the mapper file.

---

## Response shape (v2 — live Sep 2026)

The response key changed from `benefits[]` to `coverages[]` with a full `limit` object.

```jsonc
{
  "success": true,
  "message": "Successful",
  "data": [
    {
      "insurer": { "name": "Malayan Insurance", "logo_url": null },
      "product": { "code": "MIC-TRAVEL-MASTER", "name": "Travel Master" },
      "plan": { "code": "ASIAN_ESSENTIAL", "name": "Asian Essential", "sum_insured": "500000.00" },
      "zone": { "code": "ASIAN", "name": "Asian" },          // NEW in v2
      "premium": { "amount": "540.00", "currency": "PHP" },
      "coverages": [                                          // was "benefits" in v1
        {
          "category": "Emergency Medical Treatment",
          "name": "Coronavirus-19, Sickness and Accidents",
          "is_optional": false,                              // NEW — false=main, true=addon
          "addon_code": null,                                // NEW — BenefitCode when optional
          "limit": {                                         // NEW — per-benefit limit object
            "type": "amount",   // "amount" | "included" | "unlimited"
            "amount": "500000.00",
            "sub_limit_amount": "5000.00",   // e.g. per-item cap on baggage
            "sub_limit_per": "item",
            "per_unit": "day",               // e.g. "day", "hour"
            "per_unit_size": 6,              // e.g. every 6 hours
            "max_units": 10,
            "waiting_period_hours": null,
            "notes": "Per day, up to 10 days."  // → LimitModeDesc in internal shape
          }
        }
      ]
    }
  ]
}
```

### v1 → v2 diff

| Field | v1 | v2 |
|---|---|---|
| Per-plan benefits key | `benefits[]` | `coverages[]` |
| Per-benefit limit | ❌ absent (only plan-level `sum_insured`) | ✅ `limit` object |
| `limit.type` | — | `"amount"` / `"included"` / `"unlimited"` |
| `limit.amount` | — | Per-benefit numeric string or null |
| `limit.notes` | — | Human-readable qualifier (maps to `LimitModeDesc`) |
| `is_optional` | — | Splits main vs addon benefits |
| `addon_code` | — | BenefitCode when `is_optional: true` |
| `zone` | — | `{ code, name }` — backend-determined, not from `TravelCoverageArea` |
| `logo_url` | always present (string) | `string | null` |

---

## BFF mapper (`compare-quote/route.ts`)

Location: `src/app/api/travel-insurance/compare-quote/route.ts`

The mapper converts the flat IGW response into the internal `TravelInsuranceApiResponse`
shape (grouped by carrier).

### Full-quote insurer allowlist

Plans from insurers not yet supported at full-quote are stripped before the response
reaches the browser, so users can only select plans they can actually purchase.

```ts
const FULL_QUOTE_SUPPORTED_INSURERS = new Set(['MIC'])
```

| Insurer code | Name | Full-quote support |
|---|---|---|
| `MIC` | Malayan Insurance | ✅ supported |
| `OONA` | Oona Insurance | ❌ not yet — backend returns 422 "This insurer does not support full quotes through this API" |

To enable a new insurer: confirm with the backend team that `POST /api/v1/travel/full-quote`
returns 201 for that `insurer_code`, then add it to `FULL_QUOTE_SUPPORTED_INSURERS` in
`src/app/api/travel-insurance/compare-quote/route.ts`.

### `deriveLimitDisplay(limit)`

| `limit.type` | `Silimit` | `DefaultLimitDesc` |
|---|---|---|
| `"amount"` | `limit.amount` (string) | `undefined` |
| `"included"` | `undefined` | `"Included"` |
| `"unlimited"` | `undefined` | `"Unlimited"` |

### Coverage → benefit mapping

```ts
{
  BenefitCode:      c.addon_code ?? `${plan.code}-${idx}`,
  BenefitDesc:      c.name,
  BenefitType:      c.is_optional ? 'ADDON' : 'MAIN',
  CoverageName:     c.category,
  SubCoverageName:  c.name,
  Silimit:          silimit,           // numeric string or undefined
  DefaultLimitDesc: defaultLimitDesc,  // "Included"/"Unlimited" or undefined
  LimitModeDesc:    c.limit.notes,    // e.g. "Per day, up to 7 days."
  IsMainBenefit:    c.is_optional ? 'N' : 'Y',
}
```

`is_optional === false` → `MainBenefits[]`
`is_optional === true`  → `AddonBenefits[]`

---

## Internal type additions (`src/types/plan.ts`)

`InsurancePlanSchema` now includes optional fields passed through from the API:

```ts
Currency: z.string().optional()   // from premium.currency
Zone:     z.object({ code: z.string(), name: z.string() }).optional()
LogoUrl:  z.string().optional()
```

`InsuranceBenefitSchema` already had `DefaultLimitDesc` and `LimitModeDesc` as optional
strings — no change needed.

---

## UI rendering (`insurance-plan.tsx`)

### Benefit limit display priority

1. `benefit.Silimit` present → `₱{formatted number}`
2. `benefit.DefaultLimitDesc` present → styled badge: `"Included"` (green) or `"Unlimited"` (blue)
3. Neither → `—`

### Card layout

**Collapsed (default):**
3-panel horizontal layout:
- Left: provider logo block
- Middle: plan name + `CollapsedBenefits` grid (one highlight chip per category: icon + category label + abbreviated limit e.g. `₱500K`, `₱1M`, `Unlimited`)
- Right: premium amount + Apply Now button (separated by left border)

Bottom: floating pill toggle button (`absolute bottom-0 translate-y-1/2`) — must NOT have
`overflow-hidden` on the card wrapper or the button gets clipped.

**Expanded:**
Full 2-column category detail grid below the 3-panel row. Categories are split
`Math.ceil(n/2)` left, remainder right to avoid whitespace gaps from unequal column heights.

### Category grouping (`groupBenefitsByCategory`)

Benefits are grouped by `CoverageName` (falling back to `SubCoverageName`), then sorted
by canonical order defined in `CATEGORY_CONFIG` in `travel-benefits-helpers.ts`:

| API category | Display label | Icon | Order |
|---|---|---|---|
| Emergency Medical Treatment | Medical | HeartPulse | 1 |
| Personal Accident Insurance | Personal Accident | ShieldAlert | 2 |
| Travel Inconvenience Benefits | Travel Inconvenience | Luggage | 3 |
| Recovery of Travel Expenses | Trip Protection | Plane | 4 |
| Travel Assistance Benefits | Assistance | LifeBuoy | 5 |
| Personal Liability | Personal Liability | Scale | 6 |
| Value-Added Feature | Value-Added | Star | 7 |

---

## Zone / coverage area behaviour

**Critical:** The backend determines the zone (`ASIAN`, `WORLD`, `SCHENGEN`, `DOMESTIC`)
from `TravelCountry` (ISO2) only. It ignores `TravelCoverageArea` in the request.

### Known zone mappings (verified by curl, Sep 2026)

| ISO2 | Country | Backend zone |
|---|---|---|
| `JP` | Japan | ASIAN ✅ |
| `SG` | Singapore | ASIAN ✅ |
| `TH` | Thailand | ASIAN ✅ |
| `IN` | India | **WORLD ⚠️ — backend bug, should be ASIAN** |
| `DE` | Germany | SCHENGEN |
| `US` | United States | WORLD |

India returning WORLD zone is a **known backend bug** (reported Sep 2026). Do not try
to work around it on the frontend — the fix must be applied in the IGW backend's
ISO2-to-zone mapping table.

### Frontend `TravelCoverageArea` usage

`TravelCoverageArea` in the store is only used by `coverage-options-form.tsx` to select
which **Pacific Cross static JSON** to display alongside dynamic API plans:

| `TravelCoverageArea` | Pacific Cross plans shown |
|---|---|
| `DOMESTIC` | `pacific-cross-travel-plans-domestic.json` |
| `APAC` | Both `pacific-cross-travel-plans.json` + `pacific-cross-travel-plans-asia.json` |
| `SCHENGEN` / `WORLD` | `pacific-cross-travel-plans.json` only |

`TravelCoverageArea` is set by `findCoverageArea()` in `travel-details-form.tsx` which
walks `TravelCoverageMap` key order: `DOMESTIC → APAC → SCHENGEN → WORLD` (first match wins).

### Duplicate country codes in `TravelCoverageMap`

Countries appearing in multiple zones (first-match wins in `findCoverageArea`):

| Code | Appears in | Resolved to | Correct? |
|---|---|---|---|
| `EGYPT` | APAC + WORLD | APAC | ⚠️ Debatable |
| `TURKEY` | APAC + SCHENGEN | APAC | ⚠️ Should be SCHENGEN |
| `PHILIPPINES` | APAC + WORLD | APAC | ✅ Origin country |

---

## Static Pacific Cross plans

Not from the API. Hardcoded JSON files imported at build time:

```
src/constants/pacific-cross-travel-plans.json          — Worldwide/Schengen
src/constants/pacific-cross-travel-plans-asia.json     — Asia/APAC
src/constants/pacific-cross-travel-plans-domestic.json — Domestic PH
```

These plans have `IsExternalLink: "Y"` — clicking Apply Now opens the Pacific Cross
partner portal in a new tab, bypassing the checkout flow entirely.

Benefits in these JSONs have accurate per-benefit `Silimit` and `DefaultLimitDesc` values
(unlike the old v1 API which stamped the plan-level `sum_insured` on all benefits).
