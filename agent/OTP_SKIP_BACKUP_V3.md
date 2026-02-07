# OTP Skip Backup - Version 3

This file contains the original OTP-related code that was temporarily disabled for testing purposes.

## Files Modified

1. `agent/src/app/(login)/login/page.tsx` - Login page with OTP flow

---

## Original Code Sections

### 1. Login Page - OTP Flow (agent/src/app/(login)/login/page.tsx)

#### Import Statement (Line 18)
```typescript
import { useSendOTP } from '@/app/data/mutations/otp'
```

#### Hook Declaration (Line 33)
```typescript
const { mutateAsync: sendOTP } = useSendOTP()
const { isAuthenticated, login } = useAgentAuthStore()
```

Note: The store uses `login` method, not `setAuth`

#### OTP Flow in onSubmit (Lines 64-79)
```typescript
// Send OTP after successful login validation
try {
  await sendOTP(value.email)
  toast.success('OTP has been sent to your email')
  
  // Store auth data temporarily in sessionStorage to complete after OTP
  sessionStorage.setItem('pending_auth', JSON.stringify(result))
  
  // Redirect to OTP page with email
  router.push(`/otp?email=${encodeURIComponent(value.email)}`)
} catch (otpError: any) {
  if (otpError?.response?.status === 404) {
    toast.error('User not found.')
  } else {
    toast.error('Failed to send OTP. Please try again.')
  }
}
```

---

## Restoration Instructions

To restore OTP functionality:

1. Open `agent/src/app/(login)/login/page.tsx`
2. Uncomment the import statement for `useSendOTP`
3. Uncomment the hook declaration `const { mutateAsync: sendOTP } = useSendOTP()`
4. Replace the direct login success code with the OTP flow code (lines 64-79 above)
5. Test the OTP flow to ensure it works correctly

---

## Notes

- The OTP page (`agent/src/app/(login)/otp/page.tsx`) remains unchanged
- The OTP mutation (`agent/src/app/data/mutations/otp.ts`) remains unchanged
- Only the login flow was modified to skip OTP temporarily
- Auth data is stored directly instead of being stored in sessionStorage for OTP verification
