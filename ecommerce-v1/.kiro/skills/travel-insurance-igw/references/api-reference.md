# IGW Travel Compare-Quote API Reference

**Endpoint:** `POST /travel/compare-quote`
**Base URL:** `https://stage-api.oneinsurance.shop/api/v1`   (= `BASE_URL` env var)
**Auth:** `Authorization: Bearer {BACKEND_TOKEN}`

> **Note (Oct 2026):** Backend dropped the `/igw` prefix. Endpoints are now
> `/api/v1/travel/...` not `/api/v1/igw/travel/...`.

---

## Request

```jsonc
{
  "AgentCode": "demo",
  "Slug": "travel-insurance",
  "ProductCode": "TRAVEL",
  "ProductVersion": "1.0",
  "EffectiveDate": "2026-10-01",      // YYYY-MM-DD departure
  "ExpiryDate": "2026-10-10",         // YYYY-MM-DD return
  "TripType": "SINGLE",               // "SINGLE" | "ANNUAL"
  "TravelType": "INTERNATIONAL",      // "INTERNATIONAL" | "DOMESTIC"
  "Age": 30,
  "NoOfTravellers": 1,
  "BranchCode": "HO",
  "LGT": 0.75,
  "PromoCodeList": [],
  "TravelDetailList": [
    {
      "TravelCoverageArea": "APAC",   // Frontend use only — backend ignores for zone
      "PlaceOfOrgin": "PH",           // ISO2
      "TravelCountry": "JP",          // ISO2 — backend uses this to determine zone
      "DisplaySequence": 1
    }
  ],
  "PolicyCustomerList": [
    { "DateOfBirth": "1996-01-01" }
  ],
  "PolicyLobList": [
    {
      "ProductCode": "TRAVEL",
      "PolicyRiskList": [
        {
          "ProductElementCode": "R00001",
          "IsMainInsured": "Y",
          "DateOfBirth": "1996-01-01",
          "IsAdultTraveller": "Y",
          "FirstName": "", "MiddleName": "", "LastName": "",
          "IdNo": "", "IdTypeCode": "", "Suffix": "", "Gender": "",
          "AddrProvince": "", "City": "", "PostCode": "",
          "AddressLine1": "", "AddressLine2": "",
          "Email": "", "Mobile": ""
        }
      ]
    }
  ]
}
```

---

## Response (v2 schema — live Sep 2026)

```jsonc
{
  "success": true,
  "message": "Successful",
  "data": [
    {
      "insurer": {
        "name": "Malayan Insurance",
        "logo_url": null                  // string | null
      },
      "product": {
        "code": "MIC-TRAVEL-MASTER",
        "name": "Travel Master"
      },
      "plan": {
        "code": "ASIAN_ESSENTIAL",        // zone-prefixed plan code
        "name": "Asian Essential",
        "sum_insured": "500000.00"
      },
      "zone": {                           // NEW in v2
        "code": "ASIAN",                  // "ASIAN" | "WORLD" | "SCHENGEN" | "DOMESTIC"
        "name": "Asian"
      },
      "premium": {
        "amount": "540.00",
        "currency": "PHP"
      },
      "coverages": [                      // was "benefits" in v1
        {
          "category": "Emergency Medical Treatment",
          "name": "Coronavirus-19, Sickness and Accidents",
          "is_optional": false,           // false=MainBenefit, true=AddonBenefit
          "addon_code": null,             // string when is_optional=true, else null
          "limit": {
            "type": "amount",             // "amount" | "included" | "unlimited"
            "amount": "500000.00",        // string | null
            "sub_limit_amount": null,     // e.g. "5000.00" per item for baggage
            "sub_limit_per": null,        // e.g. "item"
            "per_unit": null,             // e.g. "day" | "hour"
            "per_unit_size": null,        // e.g. 6 (every 6 hours)
            "max_units": null,            // e.g. 10
            "waiting_period_hours": null,
            "notes": null                 // human string e.g. "Per day, up to 7 days."
          }
        },
        {
          "category": "Travel Assistance Benefits",
          "name": "Emergency Medical Evacuation",
          "is_optional": false,
          "addon_code": null,
          "limit": {
            "type": "unlimited",          // no amount — display as "Unlimited"
            "amount": null,
            "sub_limit_amount": null,
            "sub_limit_per": null,
            "per_unit": null,
            "per_unit_size": null,
            "max_units": null,
            "waiting_period_hours": null,
            "notes": null
          }
        },
        {
          "category": "Emergency Medical Treatment",
          "name": "Cashless Hospitalization",
          "is_optional": false,
          "addon_code": null,
          "limit": {
            "type": "included",           // no amount — display as "Included"
            "amount": null,
            "sub_limit_amount": null,
            "sub_limit_per": null,
            "per_unit": null,
            "per_unit_size": null,
            "max_units": null,
            "waiting_period_hours": null,
            "notes": "Available to all international destinations."
          }
        }
      ]
    }
  ]
}
```

---

## Verified zone mapping (by TravelCountry ISO2)

Backend assigns zone from `TravelCountry` only. Tested Sep 2026:

| ISO2 | Zone returned | Expected | Status |
|---|---|---|---|
| `JP` | ASIAN | ASIAN | ✅ |
| `SG` | ASIAN | ASIAN | ✅ |
| `TH` | ASIAN | ASIAN | ✅ |
| `MY` | ASIAN | ASIAN | ✅ |
| `IN` | WORLD | ASIAN | ⚠️ Backend bug |
| `DE` | SCHENGEN | SCHENGEN | ✅ |
| `FR` | SCHENGEN | SCHENGEN | ✅ |
| `US` | WORLD | WORLD | ✅ |
| `AU` | WORLD | WORLD | ✅ |

India (`IN`) returns WORLD plans — confirmed backend bug, reported Sep 2026.
Other South Asian ISO2 codes (`BD`, `NP`, `MM`, `LK`, `PK`) may have the same issue —
not yet tested.

---

## Sample curl (stage)

```bash
curl -s -X POST "https://stage-api.oneinsurance.shop/api/v1/travel/compare-quote" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BACKEND_TOKEN" \
  -d '{
    "AgentCode": "demo",
    "Slug": "travel-insurance",
    "ProductCode": "TRAVEL",
    "ProductVersion": "1.0",
    "EffectiveDate": "2026-10-01",
    "ExpiryDate": "2026-10-10",
    "TripType": "SINGLE",
    "TravelType": "INTERNATIONAL",
    "Age": 30,
    "NoOfTravellers": 1,
    "BranchCode": "HO",
    "LGT": 0.75,
    "PromoCodeList": [],
    "TravelDetailList": [{"TravelCoverageArea":"APAC","PlaceOfOrgin":"PH","TravelCountry":"JP","DisplaySequence":1}],
    "PolicyCustomerList": [{"DateOfBirth":"1996-01-01"}],
    "PolicyLobList": [{"ProductCode":"TRAVEL","PolicyRiskList":[{"ProductElementCode":"R00001","IsMainInsured":"Y","DateOfBirth":"1996-01-01","IsAdultTraveller":"Y","FirstName":"","MiddleName":"","LastName":"","IdNo":"","IdTypeCode":"","Suffix":"","Gender":"","AddrProvince":"","City":"","PostCode":"","AddressLine1":"","AddressLine2":"","Email":"","Mobile":""}]}]
  }' | python3 -m json.tool
```

---

## File locations

| Purpose | File |
|---|---|
| BFF route (mapper) | `src/app/api/travel-insurance/compare-quote/route.ts` |
| Request builder | `src/utils/mappers/travel-insurance/init-compare-quote.ts` |
| Mutation / fetch | `src/app/data/mutations/create-quote-request.ts` |
| Internal types | `src/types/plan.ts` (`InsurancePlanSchema`, `InsuranceBenefitSchema`) |
| Benefit helpers | `src/utils/travel-benefits-helpers.ts` |
| Plan card UI | `src/components/travel-insurance/insurance-plan.tsx` |
| Plan list UI | `src/components/travel-insurance/coverage-options-form.tsx` |
| Country→ISO2 map | `COUNTRY_TO_ISO2` in `init-compare-quote.ts` |
| Coverage area map | `src/constants/travel-coverage.ts` (`TravelCoverageMap`) |
| Pacific Cross static | `src/constants/pacific-cross-travel-plans*.json` |
