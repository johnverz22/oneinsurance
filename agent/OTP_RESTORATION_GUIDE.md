# OTP Functionality - Restoration Guide

## 🚨 Status: TEMPORARILY DISABLED (AGAIN)
- **Date Disabled**: February 6, 2026
- **Reason**: Temporary skip for development/testing purposes
- **Status**: All OTP code preserved with clear comment markers (⚠️) for easy restoration

---

## 📋 Quick Restoration Steps

The OTP code is commented out with clear markers. To restore:

### Step 1: Restore Import (Line ~22)
**Find:**
```typescript
// ⚠️ TEMPORARY: OTP disabled - see agent/OTP_RESTORATION_GUIDE.md to restore
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
// ⚠️ TEMPORARY: OTP disabled - see agent/OTP_RESTORATION_GUIDE.md to restore
// const { mutateAsync: sendOTP } = useSendOTP()
const { login, isAuthenticated } = useAgentAuthStore()
```

**Replace with:**
```typescript
const { mutateAsync: sendOTP } = useSendOTP()
const { isAuthenticated } = useAgentAuthStore()
```

---

### Step 3: Restore OTP Flow (Lines ~67-95)
**Find the entire block marked with:**
```typescript
// ============================================================
// ⚠️ TEMPORARY: OTP DISABLED - See agent/OTP_RESTORATION_GUIDE.md
// ============================================================
```

**Uncomment the OTP flow and remove the bypass:**

**Replace:**
```typescript
// ============================================================
// ⚠️ TEMPORARY: OTP DISABLED - See agent/OTP_RESTORATION_GUIDE.md
// ============================================================
// 📌 TO RESTORE OTP: Uncomment the block below and comment out the bypass
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

// ⚠️ TEMPORARY BYPASS: Direct login without OTP
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
grep -n "⚠️.*OTP" agent/src/app/\(login\)/login/page.tsx
```

---

## 📁 Files Involved

### Modified File
- ✅ `agent/src/app/(login)/login/page.tsx` - OTP flow commented out with ⚠️ markers

### Unchanged Files (Ready to Use)
- ✅ `agent/src/app/(login)/otp/page.tsx` - OTP verification UI
- ✅ `agent/src/app/(login)/otp/layout.tsx` - OTP page layout
- ✅ `agent/src/app/data/mutations/otp.ts` - OTP API mutations

---

## 🔄 How OTP Flow Works (When Active)

```
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

## 🔌 Backend API Endpoints

### 1. Send OTP
- **Endpoint**: `POST /api/v1/auth/login/otp/send`
- **Request Body**: `{ "email": "user@example.com" }`
- **Response**: `{ "message": "OTP sent successfully" }`

### 2. Resend OTP
- **Endpoint**: `POST /api/v1/auth/login/otp/resend`
- **Request Body**: `{ "email": "user@example.com" }`
- **Response**: `{ "message": "OTP resent successfully" }`

### 3. Verify OTP
- **Endpoint**: `POST /api/v1/auth/login/otp/verify`
- **Request Body**: `{ "email": "user@example.com", "otp": "123456" }`
- **Response**: `{ "message": "OTP verified successfully" }`

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

## 📝 Notes

- All OTP code is preserved with `⚠️` emoji markers for easy identification
- The bypass uses direct login: `login(result)` and redirects to `/`
- OTP verification page and API mutations remain fully functional
- No code was deleted, only commented out

---

**Last Updated**: February 6, 2026  
**Status**: ⚠️ TEMPORARILY DISABLED - Code preserved for easy restoration
