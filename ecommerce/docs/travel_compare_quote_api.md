# IGW Travel Compare Quote

Compare travel quotes via this gateway's direct integration against **OneInsuranceAPI**.

The endpoint accepts the same InsureMo-shaped payload as the existing Travel compare-quote endpoint. The server extracts origin, destination, dates, traveler count, and principal date of birth internally before calling OneInsuranceAPI.

## Base URL

| Variable   | Default value                     |
| ---------- | --------------------------------- |
| `base_url` | `https://stage-api.oneinsurance.shop/api/v1` |

---

## Compare Quote

Sends the full InsureMo-shaped payload to the gateway.

```
POST {{base_url}}/igw/travel/compare-quote
```

### Headers

| Key            | Value              |
| -------------- | ------------------ |
| `Accept`       | `application/json` |
| `Content-Type` | `application/json` |

### Request Body

#### Top-level fields

| Field                 | Type    | Example         | Notes                                                        |
| --------------------- | ------- | --------------- | ------------------------------------------------------------ |
| `ProductCode`         | string  | `"TRAVEL"`      | Product identifier                                           |
| `ProductVersion`      | string  | `"1.0"`         | Product version                                              |
| `EffectiveDate`       | string  | `"2026-10-01"`  | Trip start date (`YYYY-MM-DD`). Mapped to `departure_date`   |
| `ExpiryDate`          | string  | `"2026-10-04"`  | Trip end date (`YYYY-MM-DD`). Mapped to `return_date`        |
| `TripType`            | string  | `"SINGLE"`      | Trip type                                                    |
| `TravelType`          | string  | `"INDIVIDUAL"`  | Travel type                                                  |
| `NoOfTravellers`      | integer | `1`             | Mapped to `traveler_count`                                   |
| `BranchCode`          | string  | `"HO"`          | Branch code                                                  |
| `Age`                 | integer | `34`            | Age of traveller                                             |
| `LGT`                 | number  | `0.75`          | —                                                            |
| `PromoCodeList`       | array   | `[]`            | List of promo codes                                          |
| `TravelDetailList`    | array   | see below       | Origin/destination details                                   |
| `PolicyCustomerList`  | array   | see below       | Customer details                                             |
| `PolicyLobList`       | array   | see below       | Line-of-business and risk details                            |
| `AgentCode`           | string  | `"2BCUMAXGAV"`  | Agent code                                                   |
| `Slug`                | string  | `"travel-insurance"` | Product slug                                            |

#### `TravelDetailList[]`

| Field                | Type    | Example    | Notes                                                                 |
| -------------------- | ------- | ---------- | --------------------------------------------------------------------- |
| `TravelCoverageArea` | string  | `"WORLD"`  | Coverage area                                                         |
| `PlaceOfOrgin`       | string  | `"PH"`     | Origin country. Mapped to `origin_country`. *(Spelled `Orgin` in the API.)* |
| `TravelCountry`      | string  | `"JP"`     | Destination country. Mapped to `destination_countries`                |
| `DisplaySequence`    | integer | `1`        | Display order                                                         |

#### `PolicyCustomerList[]`

| Field         | Type   | Example        | Notes                            |
| ------------- | ------ | -------------- | -------------------------------- |
| `DateOfBirth` | string | `"1990-03-01"` | Customer date of birth (`YYYY-MM-DD`) |

#### `PolicyLobList[]`

| Field            | Type   | Example    | Notes                  |
| ---------------- | ------ | ---------- | ---------------------- |
| `ProductCode`    | string | `"TRAVEL"` | Product identifier     |
| `PolicyRiskList` | array  | see below  | List of insured risks  |

#### `PolicyLobList[].PolicyRiskList[]`

| Field                | Type   | Example        | Notes                                                                                   |
| -------------------- | ------ | -------------- | --------------------------------------------------------------------------------------- |
| `ProductElementCode` | string | `"R00001"`     | Risk element code                                                                       |
| `IsMainInsured`      | string | `"Y"`          | `Y` marks the principal traveller. Its `DateOfBirth` is mapped to `principal_date_of_birth` |
| `DateOfBirth`        | string | `"1990-03-01"` | Traveller date of birth (`YYYY-MM-DD`)                                                  |
| `IsAdultTraveller`   | string | `"Y"`          | `Y` / `N`                                                                               |
| `FirstName`          | string | `"Ram"`        | Traveller first name                                                                    |
| `LastName`           | string | `"Kumar"`      | Traveller last name                                                                     |
| `Gender`             | string | `"M"`          | Traveller gender                                                                        |

### Example Request Body

```json
{
  "ProductCode": "TRAVEL",
  "ProductVersion": "1.0",
  "EffectiveDate": "2026-10-01",
  "ExpiryDate": "2026-10-04",
  "TripType": "SINGLE",
  "TravelType": "INDIVIDUAL",
  "NoOfTravellers": 1,
  "BranchCode": "HO",
  "Age": 34,
  "LGT": 0.75,
  "PromoCodeList": [],
  "TravelDetailList": [
    {
      "TravelCoverageArea": "WORLD",
      "PlaceOfOrgin": "PH",
      "TravelCountry": "JP",
      "DisplaySequence": 1
    }
  ],
  "PolicyCustomerList": [
    {
      "DateOfBirth": "1990-03-01"
    }
  ],
  "PolicyLobList": [
    {
      "ProductCode": "TRAVEL",
      "PolicyRiskList": [
        {
          "ProductElementCode": "R00001",
          "IsMainInsured": "Y",
          "DateOfBirth": "1990-03-01",
          "IsAdultTraveller": "Y",
          "FirstName": "Ram",
          "LastName": "Kumar",
          "Gender": "M"
        }
      ]
    }
  ],
  "AgentCode": "2BCUMAXGAV",
  "Slug": "travel-insurance"
}
```

### Example cURL

```bash
curl --request POST 'https://stage-api.oneinsurance.shop/api/v1/igw/travel/compare-quote' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "ProductCode": "TRAVEL",
    "ProductVersion": "1.0",
    "EffectiveDate": "2026-10-01",
    "ExpiryDate": "2026-10-04",
    "TripType": "SINGLE",
    "TravelType": "INDIVIDUAL",
    "NoOfTravellers": 1,
    "BranchCode": "HO",
    "Age": 34,
    "LGT": 0.75,
    "PromoCodeList": [],
    "TravelDetailList": [
      {
        "TravelCoverageArea": "WORLD",
        "PlaceOfOrgin": "PH",
        "TravelCountry": "JP",
        "DisplaySequence": 1
      }
    ],
    "PolicyCustomerList": [
      { "DateOfBirth": "1990-03-01" }
    ],
    "PolicyLobList": [
      {
        "ProductCode": "TRAVEL",
        "PolicyRiskList": [
          {
            "ProductElementCode": "R00001",
            "IsMainInsured": "Y",
            "DateOfBirth": "1990-03-01",
            "IsAdultTraveller": "Y",
            "FirstName": "Ram",
            "LastName": "Kumar",
            "Gender": "M"
          }
        ]
      }
    ],
    "AgentCode": "2BCUMAXGAV",
    "Slug": "travel-insurance"
  }'
```

### Server-side Mapping to OneInsuranceAPI

The gateway converts the InsureMo-shaped payload into OneInsuranceAPI's compare-quote request:

| OneInsuranceAPI field     | Source in the request payload                                              |
| ------------------------- | -------------------------------------------------------------------------- |
| `origin_country`          | First `TravelDetailList` entry → `PlaceOfOrgin`                            |
| `destination_countries`   | `TravelDetailList` entry/entries → `TravelCountry`                         |
| `departure_date`          | `EffectiveDate`                                                            |
| `return_date`             | `ExpiryDate`                                                               |
| `traveler_count`          | `NoOfTravellers`                                                           |
| `principal_date_of_birth` | `PolicyRiskList` entry where `IsMainInsured = "Y"` → `DateOfBirth`         |

### Response

No example response is included in the Postman collection.