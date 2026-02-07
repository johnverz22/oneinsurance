# 🔴 OTP TEMPORARILY SKIPPED - Restoration Guide #2

**Date Disabled**: February 7, 2026  
**Reason**: Temporary skip for development/testing purposes  
**Status**: All OTP code preserved with clear 🔴 markers for easy restoration

---

## 🚨 Status: TEMPORARILY DISABLED

The OTP authentication flow has been temporarily disabled. All code is preserved and marked with 🔴 emoji for easy identification and restoration.

---

## 📋 Quick Restoration Steps

### Step 1: Restore Import (Line ~22)

**Find:**
```typescript
// 🔴 TEMPORARY OTP SKIP - See agent/OTP_SKIP_RESTORATION.md to restore
// import { useSendOTP } from '@/app/data/mutations/otp'
```

**Replace with:**
```typescript
import { useSendOTP } from '@/app/data/mutations/otp'
```

---

### Step 2: Restore Hook (Line ~34)

**Find:**
```typescript
// 🔴 TEMPORARY OTP SKIP - See agent/OTP_SKIP_RESTORATION.md to restore
// const { mutateAsync: sendOTP } = useSendOTP()
const { login, isAuthenticated } = useAgentAuthStore()
```

**Replace with:**
```typescript
const { mutateAsync: sendOTP } = useSendOTP()
const { isAuthenticated } = useAgentAuthStore()
```

**Note**: Remove `login` from destructuring as it's not needed in OTP flow

---

### Step 3: Restore OTP Flow (Lines ~67-95)

**Find the entire block marked with:**
```typescript
// ============================================================
// 🔴 TEMPORARY OTP SKIP - See agent/OTP_SKIP_RESTORATION.md
// ============================================================
```

**Uncomment the OTP flow and remove the bypass:**

**Replace:**
```typescript
// ============================================================
// 🔴 TEMPORARY OTP SKIP - See agent/OTP_SKIP_RESTORATION.md
// ============================================================
// 📌 TO RESTORE OTP: Uncomment the block below and remove the bypass
/*
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
*/

// 🔴 TEMPORARY BYPASS: Direct login without OTP
login(result)
toast.success('Login successful!')
router.push('/')
// ============================================================
```

**With:**
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

## 🔍 Search for Restoration Markers

Use this command to find all OTP-related comments:
```bash
grep -n "🔴.*OTP" agent/src/app/\(login\)/login/page.tsx
```

Or search for: `🔴 TEMPORARY OTP SKIP`

---

## 📁 Files Involved

### Modified File
- ✅ `agent/src/app/(login)/login/page.tsx` - OTP flow commented out with 🔴 markers

### Unchanged Files (Ready to Use)
- ✅ `agent/src/app/(login)/otp/page.tsx` - OTP verification UI
- ✅ `agent/src/app/(login)/otp/layout.tsx` - OTP page layout
- ✅ `agent/src/app/data/mutations/otp.ts` - OTP API mutations

---

## 🔄 How OTP Flow Works (When Active)

```
┌─────────────────────────────────────────────────────────────┐
│                  OTP Authentication Flow                     │
└─────────────────────────────────────────────────────────────┘

1. User enters email/password on login page
   └─> POST /api/v1/auth/login (validates credentials)
   
2. If credentials valid, send OTP to email
   └─> POST /api/v1/auth/login/otp/send
   └─> Backend generates 6-digit OTP
   └─> Backend sends OTP via email
   
3. Store auth data temporarily in sessionStorage
   └─> sessionStorage.setItem('pending_auth', JSON.stringify(result))
   
4. Redirect user to OTP verification page
   └─> router.push(`/otp?email=${email}`)
   
5. User enters 6-digit OTP code
   └─> POST /api/v1/auth/login/otp/verify
   └─> Backend validates OTP
   
6. On successful verification:
   └─> Retrieve pending_auth from sessionStorage
   └─> Complete login with stored auth data
   └─> Clear sessionStorage
   └─> Redirect to dashboard
```

---

## 🔴 Current Bypass Flow (Temporary)

```
┌─────────────────────────────────────────────────────────────┐
│              Current Bypass Flow (TEMPORARY)                 │
└─────────────────────────────────────────────────────────────┘

1. User enters email/password on login page
   └─> POST /api/v1/auth/login (validates credentials)
   
2. 🔴 BYPASS: Skip OTP, login directly
   └─> login(result)
   └─> toast.success('Login successful!')
   └─> router.push('/')
   
3. User redirected to dashboard immediately
   └─> No OTP verification required
```

---

## ✅ Testing Checklist (After Restoration)

- [ ] Valid credentials → OTP sent → Email received
- [ ] Enter correct OTP → Login successful
- [ ] Enter incorrect OTP → Error message shown
- [ ] OTP expires → Appropriate error message
- [ ] Resend OTP → New OTP received
- [ ] Invalid email → Proper error handling
- [ ] Network error → Graceful error handling
- [ ] Back button from OTP page → Returns to login

---

## 📝 Code Blocks to Restore

### Block 1: Import Statement
```typescript
import { useSendOTP } from '@/app/data/mutations/otp'
```

### Block 2: Hook Declaration
```typescript
const { mutateAsync: sendOTP } = useSendOTP()
const { isAuthenticated } = useAgentAuthStore()
```

### Block 3: OTP Flow Logic
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

## 🎯 One-Command Restoration

If you want to restore all at once, use these three replacements in order:

1. **Uncomment import**: Remove `// ` before `import { useSendOTP }`
2. **Uncomment hook**: Remove `// ` before `const { mutateAsync: sendOTP }`
3. **Uncomment OTP flow**: Remove `/*` and `*/` around OTP flow, delete bypass code

---

## 📌 Notes

- All OTP code is preserved with 🔴 emoji markers for easy identification
- The bypass uses direct login: `login(result)` and redirects to `/`
- OTP verification page and API mutations remain fully functional
- No code was deleted, only commented out
- Search for `🔴` emoji to find all temporary changes

---

## ⚠️ Security Warning

**This bypass should NEVER be deployed to production!**

- Two-factor authentication is currently disabled
- Users can login with just email/password
- No email verification required
- This is for development/testing purposes only

---

**Last Updated**: February 7, 2026  
**Status**: 🔴 TEMPORARILY DISABLED - Code preserved for easy restoration  
**Restoration File**: `agent/OTP_SKIP_TEMP_2.md`

