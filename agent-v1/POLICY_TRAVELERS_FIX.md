# Policy Details - Number of Travellers Issue

## Problem
The "Number of Travellers" field is showing "10" for all records instead of displaying the actual number of travelers from the policy data.

## Investigation

### Current Implementation
**File**: `agent/src/app/(agent)/(dashboard)/policies/[policyId]/page.tsx` (Line ~796)

```typescript
<div>
  <p className="text-sm font-medium text-muted-foreground">Number of Travellers</p>
  <p className="font-semibold">
    {policyDetails?.NoOfTravellers || 1} 
    {policyDetails?.NoOfAdults && policyDetails?.NoOfChildren && 
      ` (${policyDetails?.NoOfAdults} Adults, ${policyDetails?.NoOfChildren} Children)`
    }
  </p>
</div>
```

### Data Structure
From `policy_travel.json` sample:
```json
{
  "NoOfAdults": 2,
  "NoOfChildren": 1,
  "NoOfTravellers": 3,
  "PolicyLobList": [
    {
      "PolicyRiskList": [
        { "IsMainInsured": "Y", "IsAdultTraveller": "Y", ... },
        { "IsMainInsured": "N", "IsAdultTraveller": "N", ... },
        { "IsMainInsured": "N", "IsAdultTraveller": "Y", ... }
      ]
    }
  ]
}
```

## Root Cause Analysis

The frontend code is correctly reading `policyDetails?.NoOfTravellers` from the backend response. If all records show "10", there are two possible causes:

1. **Backend Issue**: The backend is returning `NoOfTravellers: 10` for all policies regardless of actual traveler count
2. **Data Issue**: The policy_details JSON stored in the database has incorrect `NoOfTravellers` values

## Solution Options

### Option 1: Calculate from PolicyRiskList (Recommended)
Instead of relying on `NoOfTravellers` field, calculate the actual count from `PolicyRiskList`:

```typescript
// Calculate actual number of travelers from PolicyRiskList
const actualTravelerCount = policyDetails?.PolicyLobList?.[0]?.PolicyRiskList?.length || 0
const adultsCount = policyDetails?.PolicyLobList?.[0]?.PolicyRiskList?.filter(
  risk => risk.IsAdultTraveller === 'Y'
).length || 0
const childrenCount = policyDetails?.PolicyLobList?.[0]?.PolicyRiskList?.filter(
  risk => risk.IsAdultTraveller === 'N'
).length || 0

// Display
<p className="font-semibold">
  {actualTravelerCount || policyDetails?.NoOfTravellers || 1}
  {adultsCount > 0 && childrenCount > 0 && 
    ` (${adultsCount} Adults, ${childrenCount} Children)`
  }
</p>
```

### Option 2: Fix Backend Data
If the backend is setting `NoOfTravellers` to a default value of 10, the backend needs to be updated to:
1. Calculate the correct count when creating/updating policies
2. Store the accurate `NoOfTravellers`, `NoOfAdults`, and `NoOfChildren` values

### Option 3: Hybrid Approach (Best)
Use calculated values as primary source, with backend values as fallback:

```typescript
// Calculate from actual data
const policyRiskList = policyDetails?.PolicyLobList?.[0]?.PolicyRiskList || []
const calculatedTravelers = policyRiskList.length
const calculatedAdults = policyRiskList.filter(r => r.IsAdultTraveller === 'Y').length
const calculatedChildren = policyRiskList.filter(r => r.IsAdultTraveller === 'N').length

// Use calculated if available, otherwise use backend values
const travelerCount = calculatedTravelers > 0 ? calculatedTravelers : (policyDetails?.NoOfTravellers || 1)
const adultsCount = calculatedAdults > 0 ? calculatedAdults : policyDetails?.NoOfAdults
const childrenCount = calculatedChildren > 0 ? calculatedChildren : policyDetails?.NoOfChildren
```

## Recommendation

Implement **Option 3 (Hybrid Approach)** because:
- ✅ Shows accurate data based on actual PolicyRiskList
- ✅ Falls back to backend values if PolicyRiskList is empty
- ✅ Works even if backend data is incorrect
- ✅ No backend changes required
- ✅ Self-healing - displays correct data regardless of backend issues

## Implementation

Update the Travel Insurance Information section in the policy details page to calculate travelers from PolicyRiskList.

---

**Date**: February 6, 2026  
**Status**: Investigation Complete - Ready for Implementation
