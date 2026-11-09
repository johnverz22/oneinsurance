# Policy Details - Hardcoded Data Removal

**Date**: February 6, 2026  
**Status**: ✅ Complete - All hardcoded/fallback data removed

---

## Changes Made

### 1. API Route: `agent/src/app/api/policies/[policyId]/route.ts`

**Removed:**
- ❌ 300+ lines of hardcoded sample data from `policy_travel.json`
- ❌ Fallback PolicyCustomerList with sample travelers
- ❌ Fallback PolicyRiskList with 3 travelers and coverages
- ❌ Hardcoded values: `NoOfTravellers: 3`, `NoOfAdults: 2`, `NoOfChildren: 1`
- ❌ Hardcoded travel details (PHILIPPINES → JAPAN, APAC coverage)
- ❌ Hardcoded policy numbers and dates

**Now:**
- ✅ Only returns real backend data from `transaction.policy_details`
- ✅ Returns `null` for `policy_details` if not available in backend
- ✅ No sample/fallback data generation

### 2. Policy Details Page: `agent/src/app/(agent)/(dashboard)/policies/[policyId]/page.tsx`

**Changed Fallback Values:**

| Field | Before | After |
|-------|--------|-------|
| Number of Travellers | `\|\| 1` | `?? 'N/A'` |
| Travel Type | `\|\| 'Individual'` | `\|\| 'N/A'` |
| Trip Type | `\|\| 'Single'` | `\|\| 'N/A'` |
| Plan Code | `\|\| 'TMPHPC2'` | `\|\| 'N/A'` |
| Carrier Code | `\|\| 'MALAYAN'` | `\|\| 'N/A'` |
| Product Name | `\|\| 'Travel Insurance'` | `\|\| 'N/A'` |
| Gross Commission | `\|\| '₱23.82'` | `\|\| 'N/A'` |
| Net Commission | `\|\| '₱24.30'` | `\|\| 'N/A'` |

---

## Impact

### Before
- Policy details page showed sample data when backend didn't provide complete information
- Number of Travellers always showed at least "1" even if data was missing
- Commission values showed hardcoded amounts (₱23.82, ₱24.30)
- Travel details showed sample Philippines → Japan trip

### After
- Policy details page shows only real backend data
- Missing data displays as "N/A"
- No misleading sample/fallback information
- Clear indication when backend data is incomplete

---

## Data Flow

```
Backend Transaction
  └─> policy_details (JSON string or null)
      └─> Parse to object or null
          └─> Display real values or "N/A"
```

**No fallback data at any step**

---

## Testing

To verify the changes:

1. **With Complete Backend Data:**
   - All fields should display actual values from backend
   - Number of Travellers shows real count from `NoOfTravellers`

2. **With Incomplete Backend Data:**
   - Missing fields display "N/A"
   - No sample data appears
   - Page still renders without errors

3. **With No policy_details:**
   - All policy-specific fields show "N/A"
   - Transaction-level data still displays (status, amount, dates)

---

## Backend Requirements

For complete policy details display, backend should provide:

```json
{
  "policy_details": {
    "NoOfTravellers": 3,
    "NoOfAdults": 2,
    "NoOfChildren": 1,
    "TravelType": "INDIVIDUAL",
    "TripType": "SINGLE",
    "PlanCode": "TMPHPC2",
    "CarrierCode": "MALAYAN",
    "ProductName": "Travel Insurance",
    "PolicyCustomerList": [...],
    "PolicyLobList": [...],
    "TravelDetailList": [...]
  }
}
```

If any field is missing, frontend will display "N/A"

---

## Notes

- Used `??` (nullish coalescing) for Number of Travellers to handle `0` correctly
- Used `||` (logical OR) for other fields since empty strings should also show "N/A"
- Commission values only show if `commission_log` exists in backend response
- Customer name extraction still works from PolicyCustomerList when available

---

**Result**: Policy details page now shows 100% real backend data with no hardcoded fallbacks.
