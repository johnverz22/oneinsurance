# Session Timeout & Infinite Loading Fix

## Problem
When an agent was logged in for a long time and the dev server was restarted (or the session expired), the agent portal would show an infinite loading spinner. The user had to manually logout and login again to access the portal.

## Root Cause
1. The authentication token stored in localStorage became invalid/expired
2. The dashboard layout was waiting for the `useGetAccounts()` query to complete
3. When the API returned a 401 error, the query failed but didn't trigger a logout
4. The layout kept showing `<PageLoader />` because `data` was undefined
5. No automatic session cleanup or redirect was happening

## Solution

### 1. Dashboard Layout Error Handling
**File:** `agent/src/app/(agent)/(dashboard)/layout.tsx`

Added proper error handling to detect authentication failures:
- Extract `isLoading`, `isError`, and `error` from the `useGetAccounts()` query
- Added `useEffect` to detect 401 errors and automatically logout + redirect
- Show loading state only when actually loading, not when errored
- Properly handle error states to prevent infinite loading

```typescript
// Handle authentication errors
useEffect(() => {
  if (isError && error) {
    // Check if it's an authentication error (401)
    const axiosError = error as any
    if (
      axiosError?.response?.status === 401 ||
      axiosError?.message?.includes('Unauthorized')
    ) {
      // Token is invalid or expired, logout and redirect
      logout()
      router.push('/login')
    }
  }
}, [isError, error, logout, router])
```

### 2. Query Retry Configuration
**File:** `agent/src/app/data/queries/accounts.ts`

Added smart retry logic:
- Don't retry on 401 errors (authentication failures)
- Retry up to 2 times for other errors (network issues, etc.)
- Added 1 second delay between retries
- Ensure query is only enabled when both `accessToken` and `user` exist

```typescript
retry: (failureCount, error: any) => {
  // Don't retry on authentication errors
  if (error?.response?.status === 401) {
    return false
  }
  // Retry up to 2 times for other errors
  return failureCount < 2
},
retryDelay: 1000,
```

### 3. Global Axios Interceptor
**File:** `agent/src/lib/axios.ts`

Added global 401 error handler:
- Intercepts all API responses
- Detects 401 Unauthorized errors
- Automatically logs out the user
- Redirects to login page
- Shows appropriate error message

```typescript
// Handle 401 Unauthorized errors
if (error.response?.status === 401) {
  const { logout } = useAgentAuthStore.getState()
  logout()
  
  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
  
  throw new Error('Session expired. Please login again.')
}
```

## Benefits

1. **Automatic Session Cleanup:** Invalid/expired sessions are automatically detected and cleared
2. **Better UX:** Users are immediately redirected to login instead of seeing infinite loading
3. **No Manual Intervention:** No need to manually logout when session expires
4. **Global Protection:** All API calls are protected by the axios interceptor
5. **Smart Retries:** Network errors are retried, but auth errors are not
6. **Clear Feedback:** Users see "Session expired" message instead of generic errors

## Testing

To test the fix:
1. Login to the agent portal
2. Stop the dev server
3. Manually invalidate the token in localStorage or wait for it to expire
4. Restart the dev server
5. Refresh the agent portal page
6. **Expected:** User is automatically redirected to login page
7. **Before:** Infinite loading spinner

## Related Files
- `agent/src/app/(agent)/(dashboard)/layout.tsx` - Dashboard layout with error handling
- `agent/src/app/data/queries/accounts.ts` - Accounts query with retry logic
- `agent/src/lib/axios.ts` - Global axios interceptor for 401 errors
- `agent/src/store/agent-auth-store.ts` - Auth store with logout functionality
