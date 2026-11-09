# Policy Page Pagination Fix

## Problem
The Policy Management page had inconsistent pagination (showing 10, then 1, then 3 items per page) because it was:
1. Fetching all transactions from `/api/v1/agents/transactions`
2. Filtering completed transactions on the frontend
3. This caused pagination to break since the backend returned 10 items, but after filtering only some were completed

## Solution
Implemented dedicated backend endpoint for completed transactions to handle filtering server-side.

## Changes Made

### 1. Created New API Route
**File**: `agent/src/app/api/transactions/completed/route.ts`
- Proxies requests to backend endpoint: `/api/v1/agents/transactions/completed`
- Preserves query parameters for pagination (`?page=1&per_page=10`)
- Uses same authentication and error handling as main transactions route

### 2. Created React Query Hook
**File**: `agent/src/app/data/queries/transactions.ts`
- Added `useGetCompletedTransactions` hook
- Uses query key: `['completedTransactions', page, perPage]`
- Calls `/api/transactions/completed` endpoint

### 3. Updated Policy Page
**File**: `agent/src/app/(agent)/(dashboard)/policies/page.tsx`
- Changed from `useGetTransactions` to `useGetCompletedTransactions`
- Removed frontend filtering logic (no more `filter()` on transactions)
- Removed `displayData` transformation - uses `transactionsResponse` directly
- Pagination now works correctly with consistent 10 items per page

## Backend Endpoint
The backend endpoint is expected at:
```
{BASE_URL}/agents/transactions/completed?page=1&per_page=10
```

Current BASE_URL: `https://dev-one-insurance.intel-soln.com.ph/api/v1`

## Key Differences

### Before (Broken)
```typescript
// Fetched all transactions
useGetTransactions(page, perPage)

// Filtered on frontend (breaks pagination)
const completedTransactions = transactions.filter(
  t => t.status?.toLowerCase() === 'completed'
)
```

### After (Fixed)
```typescript
// Fetches only completed transactions from backend
useGetCompletedTransactions(page, perPage)

// No filtering needed - backend handles it
// Pagination works correctly
```

## Pages Comparison

### My Sales Page
- Uses: `useGetTransactions` (all transactions)
- Shows: All transaction statuses (pending, completed, failed, etc.)
- Endpoint: `/api/v1/agents/transactions`

### Policy Management Page
- Uses: `useGetCompletedTransactions` (completed only)
- Shows: Only completed transactions
- Endpoint: `/api/v1/agents/transactions/completed`

## Testing
To verify the fix:
1. Navigate to Policy Management page
2. Check that pagination shows consistent 10 items per page (default)
3. Verify all displayed transactions have status = "completed"
4. Test pagination navigation (page 1, 2, 3, etc.)
5. Verify My Sales page still shows all transactions (not affected)

## Date: February 6, 2026
