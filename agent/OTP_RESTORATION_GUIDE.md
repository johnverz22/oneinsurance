# OTP Functionality - Restoration Guide

## 🚨 Status: TEMPORARILY DISABLED
- **Date Disabled**: February 6, 2026
- **Reason**: Backend API returning 500 Internal Server Error on OTP send endpoint
- **Backend Issue**: `POST /api/v1/auth/login/otp/send` returns 500 error
- **Status**: All OTP code preserved with comments for easy restoration

---

## 📋 Summary

The OTP (One-Time Password) authentication flow has been temporarily bypassed to allow login functionality while the backend team fixes the OTP email sending service. All OTP-related code has been **commented out** (not deleted) and can be restored by following this guide.

---

## 🔧 What Was Changed

### File Modified: `agent/src/app/(login)/login/page.tsx`

#### 1. Import Statement (Line ~20)
**ORIGINAL (Active OTP):**
```typescript
import { useLoginAgent } from '@/app/data/mutations/agent/auth-agent'
import { useSendOTP } from '@/app/data/mutations/otp'
import { useAgentAuthStore } from '@/store/agent-auth-store'
```

**CURRENT (OTP Disabled):**
```typescript
import { useLoginAgent } from '@/app/data/mutations/agent/auth-agent'
// TEMPORARY: OTP import commented out - see agent/OTP_RESTORATION_GUIDE.md
// import { useSendOTP } from '@/app/data/mutations/otp'
import { useAgentAuthStore } from '@/store/agent-auth-store'
```

---

#### 2. Hook Initialization (Line ~32)
**ORIGINAL (Active OTP):**
```typescript
const { mutateAsync: loginAgent } = useLoginAgent()
const { mutateAsync: sendOTP } = useSendOTP()
const { isAuthenticated } = useAgentAuthStore()
```

**CURRENT (OTP Disabled):**
```typescript
const { mutateAsync: loginAgent } = useLoginAgent()
// TEMPORARY: OTP hook commented out - see agent/OTP_RESTORATION_GUIDE.md
// const { mutateAsync: sendOTP } = useSendOTP()
const { login, isAuthenticated } = useAgentAuthStore()
```

**Note:** Added `login` to the destructured values from `useAgentAuthStore()` for direct login bypass.

---

#### 3. Login Submit Handler (Lines ~65-80)
**ORIGINAL (Active OTP):**
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

**CURRENT (OTP Disabled):**
```typescript
const result = (await loginAgent({ data: value })) as LoginAgentResponse

// ============================================================
// TEMPORARY: OTP FLOW DISABLED - See agent/OTP_RESTORATION_GUIDE.md
// ============================================================
// Original OTP flow (commented out):
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

// TEMPORARY BYPASS: Direct login without OTP
login(result)
toast.success('Login successful!')
router.push('/')
// ============================================================
```

---

## 📁 Files Involved in OTP System

### Core OTP Files (Unchanged - Ready to Use)
1. **`agent/src/app/data/mutations/otp.ts`** - OTP API mutations (send, resend, verify)
2. **`agent/src/app/(login)/otp/page.tsx`** - OTP verification page UI
3. **`agent/src/app/(login)/otp/layout.tsx`** - OTP page layout

### Modified Files
1. **`agent/src/app/(login)/login/page.tsx`** - Login page with OTP flow commented out

---

## 🔄 How OTP Flow Works (When Active)

```
┌─────────────────────────────────────────────────────────────┐
│                     OTP Authentication Flow                  │
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

## 🔌 Backend API Endpoints

### 1. Send OTP
- **Endpoint**: `POST /api/v1/auth/login/otp/send`
- **Request Body**: `{ "email": "user@example.com" }`
- **Response**: `{ "message": "OTP sent successfully" }`
- **Current Status**: ❌ Returns 500 Internal Server Error

### 2. Resend OTP
- **Endpoint**: `POST /api/v1/auth/login/otp/resend`
- **Request Body**: `{ "email": "user@example.com" }`
- **Response**: `{ "message": "OTP resent successfully" }`

### 3. Verify OTP
- **Endpoint**: `POST /api/v1/auth/login/otp/verify`
- **Request Body**: `{ "email": "user@example.com", "otp": "123456" }`
- **Response**: `{ "message": "OTP verified successfully" }`

---

## 🐛 Backend Issues to Fix

The backend team needs to investigate and fix:

1. **500 Internal Server Error** on `/api/v1/auth/login/otp/send`
2. Possible causes:
   - Email service not configured (SMTP settings missing)
   - Email library/package not installed
   - OTP generation logic failing
   - Database connection issues
   - Missing environment variables for email service

### Backend Environment Variables to Check
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@example.com
MAIL_FROM_NAME="${APP_NAME}"
```

---

## ✅ Restoration Steps (When Backend is Fixed)

### Step 1: Verify Backend is Working
Test the OTP endpoint manually:
```bash
curl -X POST https://dev-one-insurance.intel-soln.com.ph/api/v1/auth/login/otp/send \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

Expected response: `200 OK` with success message

---

### Step 2: Restore Import Statement

**Find this in `agent/src/app/(login)/login/page.tsx` (around line 20):**
```typescript
import { useLoginAgent } from '@/app/data/mutations/agent/auth-agent'
// TEMPORARY: OTP import commented out - see agent/OTP_RESTORATION_GUIDE.md
// import { useSendOTP } from '@/app/data/mutations/otp'
import { useAgentAuthStore } from '@/store/agent-auth-store'
```

**Replace with:**
```typescript
import { useLoginAgent } from '@/app/data/mutations/agent/auth-agent'
import { useSendOTP } from '@/app/data/mutations/otp'
import { useAgentAuthStore } from '@/store/agent-auth-store'
```

---

### Step 3: Restore Hook Initialization

**Find this (around line 32):**
```typescript
const { mutateAsync: loginAgent } = useLoginAgent()
// TEMPORARY: OTP hook commented out - see agent/OTP_RESTORATION_GUIDE.md
// const { mutateAsync: sendOTP } = useSendOTP()
const { login, isAuthenticated } = useAgentAuthStore()
```

**Replace with:**
```typescript
const { mutateAsync: loginAgent } = useLoginAgent()
const { mutateAsync: sendOTP } = useSendOTP()
const { isAuthenticated } = useAgentAuthStore()
```

**Note:** Remove `login` from the destructured values as it won't be needed.

---

### Step 4: Restore OTP Flow Logic

**Find this entire block (around lines 65-95):**
```typescript
const result = (await loginAgent({ data: value })) as LoginAgentResponse

// ============================================================
// TEMPORARY: OTP FLOW DISABLED - See agent/OTP_RESTORATION_GUIDE.md
// ============================================================
// Original OTP flow (commented out):
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

// TEMPORARY BYPASS: Direct login without OTP
login(result)
toast.success('Login successful!')
router.push('/')
// ============================================================
```

**Replace with:**
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

---

### Step 5: Test the Restored OTP Flow

1. **Clear browser cache and sessionStorage**
2. **Navigate to login page**
3. **Enter valid credentials**
4. **Verify**:
   - ✅ OTP is sent to email
   - ✅ User is redirected to `/otp?email=...`
   - ✅ OTP verification page loads
   - ✅ User can enter 6-digit code
   - ✅ User can resend OTP
   - ✅ Successful verification redirects to dashboard

---

## 🧪 Testing Checklist

After restoration, test these scenarios:

- [ ] Valid credentials → OTP sent → Email received
- [ ] Enter correct OTP → Login successful
- [ ] Enter incorrect OTP → Error message shown
- [ ] OTP expires → Appropriate error message
- [ ] Resend OTP → New OTP received
- [ ] Invalid email → Proper error handling
- [ ] Network error → Graceful error handling
- [ ] Back button from OTP page → Returns to login

---

## 📝 Additional Notes

### Environment Variables
The OTP system uses `NEXT_PUBLIC_BASE_URL` from `.env`:
```env
NEXT_PUBLIC_BASE_URL=https://dev-one-insurance.intel-soln.com.ph/api/v1
```

### OTP Configuration (Backend)
- OTP length: 6 digits
- OTP expiration: Configured on backend (typically 5-10 minutes)
- OTP delivery: Email
- Rate limiting: Should be implemented on backend

### Security Considerations
- OTP codes should expire after a short time
- Limit OTP resend attempts
- Implement rate limiting on backend
- Use HTTPS for all OTP-related requests
- Clear sessionStorage after successful login

---

## 🔗 Related Files Reference

```
agent/
├── src/
│   ├── app/
│   │   ├── (login)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx          ← MODIFIED (OTP flow commented)
│   │   │   └── otp/
│   │   │       ├── page.tsx          ← OTP verification UI (unchanged)
│   │   │       └── layout.tsx        ← OTP layout (unchanged)
│   │   └── data/
│   │       └── mutations/
│   │           └── otp.ts            ← OTP API calls (unchanged)
│   └── store/
│       └── agent-auth-store.ts       ← Auth state management
├── .env                              ← Environment variables
└── OTP_RESTORATION_GUIDE.md          ← This file
```

---

## 📞 Support

If you encounter issues during restoration:
1. Check backend logs for errors
2. Verify all environment variables are set
3. Test backend endpoints independently
4. Review browser console for frontend errors
5. Check network tab for API responses

---

## ✨ Quick Restoration Command

Use this search pattern to find all OTP-related comments:
```bash
# Search for temporary OTP comments
grep -r "TEMPORARY.*OTP" agent/src/
```

---

**Last Updated**: February 6, 2026  
**Maintained By**: Development Team  
**Backend Issue Tracker**: Backend team needs to fix `/api/v1/auth/login/otp/send` endpoint
