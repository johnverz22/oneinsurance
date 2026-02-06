# Currency Fields Update - Show ₱0.00 Instead of N/A

**Date**: February 6, 2026  
**Status**: ✅ Complete - All currency fields now show ₱0.00 for null/missing values

---

## Rationale

Currency/amount fields should display "₱0.00" instead of "N/A" because:
- 0.00 is a valid currency value
- It's more appropriate for financial data
- It maintains consistency with currency formatting
- Users expect to see monetary values in currency format

---

## Changes Made

### 1. My Sales Page (`agent/src/app/(agent)/(dashboard)/my-sales/page.tsx`)

| Column | Before | After |
|--------|--------|-------|
| Premium | `N/A` | `₱0.00` |
| Net Commission | `N/A` | `₱0.00` |

**Code Changes:**
```typescript
// Premium column
if (!amount || amount === 0) {
  return <p className="font-semibold">₱0.00</p>  // Changed from N/A
}

// Net Commission column
if (!agentCommission) {
  return <p className="font-semibold">₱0.00</p>  // Changed from N/A
}
```

### 2. Policy List Page (`agent/src/app/(agent)/(dashboard)/policies/page.tsx`)

| Column | Before | After |
|--------|--------|-------|
| Premium | `N/A` | `₱0.00` |

**Code Changes:**
```typescript
// Premium column
if (!amount || amount === 0) {
  return <p className="font-semibold">₱0.00</p>  // Changed from N/A
}
```

### 3. Policy Details Page (`agent/src/app/(agent)/(dashboard)/policies/[policyId]/page.tsx`)

| Field | Before | After |
|-------|--------|-------|
| Premium Amount | `N/A` | `₱0.00` |
| Gross Commission | `N/A` | `₱0.00` |
| Net Commission | `N/A` | `₱0.00` |

**Code Changes:**
```typescript
// Premium Amount
{policyDetails?.GrossPremium 
  ? `₱${policyDetails.GrossPremium.toLocaleString()}`
  : policyData.amount 
  ? `₱${Number(policyData.amount).toLocaleString()}`
  : '₱0.00'  // Changed from N/A
}

// Gross Commission
{policyData.commission_log?.gross_commission 
  ? `₱${Number(policyData.commission_log.gross_commission).toLocaleString()}`
  : '₱0.00'  // Changed from N/A
}

// Net Commission
{policyData.commission_log?.net_commission 
  ? `₱${Number(policyData.commission_log.net_commission).toLocaleString()}`
  : '₱0.00'  // Changed from N/A
}
```

---

## Fields That Still Show "N/A"

Non-currency fields continue to show "N/A" when missing:
- Policy Number
- Certificate Number
- Policy Holder
- Payment ID
- Product Name
- Plan Name
- Travel Type
- Trip Type
- Number of Travellers
- Agent Name
- Dates
- etc.

---

## Currency Fields Covered

### My Sales Page
- ✅ Premium (amount column)
- ✅ Net Commission

### Policy List Page
- ✅ Premium (amount column)

### Policy Details Page
- ✅ Premium Amount (GrossPremium or amount)
- ✅ Due Premium (only shows if available)
- ✅ Sum Insured (only shows if available)
- ✅ Premium Tax (only shows if available)
- ✅ LGT (only shows if available)
- ✅ Gross Commission
- ✅ Net Commission

**Note**: Due Premium, Sum Insured, Premium Tax, and LGT are conditional fields that only display when they have values from the backend. They don't show "₱0.00" because they're wrapped in conditional rendering.

---

## Display Logic

### For Required Currency Fields (Always Visible)
```typescript
value ? `₱${value.toLocaleString()}` : '₱0.00'
```

### For Optional Currency Fields (Conditionally Visible)
```typescript
{value && (
  <div>
    <p>Label</p>
    <p>₱{value.toLocaleString()}</p>
  </div>
)}
```

---

## Testing

To verify the changes:

1. **With Real Data:**
   - Premium shows actual amount: `₱258.00`
   - Commissions show actual amounts: `₱23.82`

2. **With Missing Data:**
   - Premium shows: `₱0.00`
   - Commissions show: `₱0.00`

3. **With Zero Value:**
   - Premium shows: `₱0.00`
   - Commissions show: `₱0.00`

---

## Summary

- ✅ All currency/amount fields now show `₱0.00` instead of `N/A`
- ✅ Non-currency fields still show `N/A` when missing
- ✅ Consistent currency formatting across all pages
- ✅ Better user experience for financial data

---

**Result**: Currency fields now properly display `₱0.00` for null/missing values, while non-currency fields continue to show "N/A".
