# 🔴 OTP Quick Restore Reference

**File**: `agent/src/app/(login)/login/page.tsx`  
**Search for**: `🔴` emoji

---

## 3 Simple Steps to Restore OTP

### Step 1: Uncomment Import (Line ~22)
```typescript
// REMOVE THIS LINE: // 🔴 TEMPORARY OTP SKIP - See agent/OTP_SKIP_RESTORATION.md to restore
// REMOVE THIS: //
import { useSendOTP } from '@/app/data/mutations/otp'
```

### Step 2: Uncomment Hook & Fix Store (Line ~34-36)
```typescript
// REMOVE THIS LINE: // 🔴 TEMPORARY OTP SKIP - See agent/OTP_SKIP_RESTORATION.md to restore
// REMOVE THIS: //
const { mutateAsync: sendOTP } = useSendOTP()
const { isAuthenticated } = useAgentAuthStore()  // REMOVE 'login' from here
```

### Step 3: Uncomment OTP Flow & Remove Bypass (Line ~67-95)
```typescript
// DELETE THE ENTIRE BLOCK BELOW:
// ============================================================
// 🔴 TEMPORARY OTP SKIP - See agent/OTP_SKIP_RESTORATION.md
// ============================================================
// 📌 TO RESTORE OTP: Uncomment the block below and remove the bypass
/*
... OTP CODE HERE ...
*/

// 🔴 TEMPORARY BYPASS: Direct login without OTP
login(result)
toast.success('Login successful!')
router.push('/')
// ============================================================

// REPLACE WITH THIS:
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

## Done! ✅

OTP authentication is now restored and active.

---

**Full Guide**: `agent/OTP_SKIP_RESTORATION.md`  
**Summary**: `agent/OTP_SKIP_SUMMARY.md`
