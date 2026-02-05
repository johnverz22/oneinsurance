# Temporary OTP Skip - Restoration Guide

This document contains the OTP implementation that was temporarily disabled for development purposes.

## Current Status
- **Date Disabled**: 2026-02-05
- **Reason**: Temporary skip for development/testing
- **Status**: OTP functionality preserved, just bypassed

## Files Involved in OTP Flow

- `agent/src/app/(login)/login/page.tsx` - Login page with OTP trigger
- `agent/src/app/(login)/otp/page.tsx` - OTP verification page  
- `agent/src/app/(login)/otp/layout.tsx` - OTP page layout
- `agent/src/app/data/mutations/otp.ts` - OTP API mutations

## Original OTP Implementation (Currently Active)

### Login Page (`agent/src/app/(login)/login/page.tsx`)

**Imports Required:**
```typescript
import { useSendOTP } from '@/app/data/mutations/otp'
```

**Hook Initialization:**
```typescript
const { mutateAsync: sendOTP } = useSendOTP()
```

**OTP Flow Implementation (lines ~65-80):**
```typescript
        const result = (await loginAgent({ data: value })) as LoginAgentResponse

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

## Temporary Skip Implementation

**Replace the OTP flow with:**
```typescript
        const result = (await loginAgent({ data: value })) as LoginAgentResponse

        // TEMPORARY: Skip OTP verification - directly login
        // TODO: Restore OTP flow using this documentation
        login(result)
        toast.success('Login successful!')
        router.push('/')
```

**Additional Import Needed for Skip:**
```typescript
const { login, isAuthenticated } = useAgentAuthStore()
```

## How to Restore OTP

1. **Remove the temporary skip implementation** in `agent/src/app/(login)/login/page.tsx`
2. **Restore the original OTP implementation** (code provided above)
3. **Ensure OTP imports are present:**
   ```typescript
   import { useSendOTP } from '@/app/data/mutations/otp'
   ```
4. **Ensure OTP mutation is initialized:**
   ```typescript
   const { mutateAsync: sendOTP } = useSendOTP()
   ```
5. **Remove the direct login import if not needed elsewhere:**
   ```typescript
   // Remove this if only used for temporary skip
   const { login, isAuthenticated } = useAgentAuthStore()
   ```

## OTP Flow Description

1. User enters email/password on login page
2. System validates credentials with backend
3. If valid, OTP is sent to user's email
4. User is redirected to OTP verification page
5. User enters 6-digit OTP code
6. System verifies OTP and completes login using stored session data
7. User is redirected to dashboard

## Notes

- OTP codes expire after a certain time (configured on backend)
- Users can request OTP resend
- Failed OTP attempts are tracked
- Session data is temporarily stored during OTP verification process
- All OTP-related components and mutations remain intact and functional

## Restoration Checklist

- [ ] Replace temporary skip code with original OTP flow
- [ ] Verify OTP imports are present
- [ ] Test OTP email sending
- [ ] Test OTP verification flow
- [ ] Test OTP resend functionality
- [ ] Remove this documentation file after restoration