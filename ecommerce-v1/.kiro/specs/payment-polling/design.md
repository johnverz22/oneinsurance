# Design Document

## Overview

This design document outlines the implementation of a polling-based payment verification system to replace the existing websocket-based approach. The system will use HTTP polling to check payment status via `/api/v1/transactions/verify-status`, store the proposal number in localStorage for persistence across redirects, and seamlessly integrate with the existing payment and quote issuance flow.

## Architecture

### High-Level Flow

```
┌─────────────────┐
│  User selects   │
│  payment method │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Save proposal_  │
│ number to       │
│ localStorage    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Redirect to     │
│ payment wall    │
│ (e-wallet only) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ User completes  │
│ payment         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Return to       │
│ payment page    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Retrieve        │
│ proposal_number │
│ from localStorage│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Start polling   │
│ every 2 seconds │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ POST /api/v1/   │
│ transactions/   │
│ verify-status   │
└────────┬────────┘
         │
         ▼
    ┌────┴────┐
    │ Success?│
    └────┬────┘
         │
    ┌────┴────┐
    │   Yes   │
    └────┬────┘
         │
         ▼
┌─────────────────┐
│ Call issue      │
│ quote API       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Display invoice │
│ and COC         │
└─────────────────┘
```

## Components and Interfaces

### 1. Payment Verification API Route

**File**: `src/app/api/v1/transactions/verify-status/route.ts`

**Purpose**: Proxy endpoint that forwards verification requests to the backend payment service.

**Interface**:
```typescript
// Request
POST /api/v1/transactions/verify-status
Content-Type: application/json

{
  "proposal_number": "PROP123456"
}

// Response (Success)
{
  "success": true,
  "message": "Transaction verified successfully",
  "data": {
    "proposal_number": "PROP123456",
    "transaction_status_code": "OK.00.00",
    "is_verified": true,
    "status": "completed",
    "transaction_status": "success",
    "amount": "1000.00",
    "transaction_date": "2026-01-18 10:30:00"
  }
}

// Response (Pending)
{
  "success": false,
  "message": "Transaction pending",
  "data": {
    "proposal_number": "PROP123456",
    "transaction_status_code": "PENDING",
    "is_verified": false,
    "status": "pending",
    "transaction_status": "pending"
  }
}

// Response (Failed)
{
  "success": false,
  "message": "Transaction failed",
  "data": {
    "proposal_number": "PROP123456",
    "transaction_status_code": "FAILED",
    "is_verified": false,
    "status": "failed",
    "transaction_status": "failed"
  }
}
```

### 2. Polling Service Hook

**File**: `src/hooks/use-payment-polling.ts`

**Purpose**: Reusable React hook that manages polling logic, state, and lifecycle.

**Interface**:
```typescript
interface PaymentPollingConfig {
  proposalNumber: string
  interval?: number // default: 2000ms
  maxAttempts?: number // default: 150
  timeout?: number // default: 300000ms (5 minutes)
  onSuccess: (data: PaymentVerificationData) => void
  onError: (error: Error) => void
  onTimeout: () => void
}

interface PaymentVerificationData {
  proposal_number: string
  transaction_status_code: string
  is_verified: boolean
  status: string
  transaction_status: string
  amount: string
  transaction_date: string
}

function usePaymentPolling(config: PaymentPollingConfig): {
  isPolling: boolean
  attemptCount: number
  startPolling: () => void
  stopPolling: () => void
}
```

**Implementation Details**:
- Uses `setInterval` for polling
- Tracks attempt count and elapsed time
- Automatically stops on success, error, or timeout
- Handles network errors with retry logic
- Cleans up interval on unmount

### 3. Payment Verification Mutation

**File**: `src/app/data/mutations/payment-verification.ts`

**Purpose**: React Query mutation for calling the verification API.

**Interface**:
```typescript
interface VerifyPaymentRequest {
  proposal_number: string
}

interface VerifyPaymentResponse {
  success: boolean
  message: string
  data: PaymentVerificationData
}

function useVerifyPayment(): UseMutationResult<
  VerifyPaymentResponse,
  Error,
  VerifyPaymentRequest
>
```

### 4. LocalStorage Utility

**File**: `src/utils/payment-storage.ts`

**Purpose**: Manage proposal number persistence in localStorage.

**Interface**:
```typescript
const STORAGE_KEY = 'payment_proposal_number'

function saveProposalNumber(proposalNumber: string): void
function getProposalNumber(): string | null
function clearProposalNumber(): void
function hasProposalNumber(): boolean
```

### 5. Updated Payment Selection Component

**File**: `src/components/payment/payment-selection.tsx`

**Changes**:
- Remove all Echo/Pusher websocket code
- Add localStorage save before redirect
- Add polling on component mount when proposal number exists
- Replace websocket confirmation with polling confirmation

**Key Functions**:
```typescript
// Before redirect (e-wallet)
const handleDigitalPaymentSubmit = async (paymentRequest) => {
  // ... existing code ...
  
  // Save proposal number before redirect
  saveProposalNumber(apiResponse.data.ProposalNo)
  
  // Redirect to payment wall
  window.location.href = redirectUrl
}

// On component mount
useEffect(() => {
  const proposalNumber = getProposalNumber()
  
  if (proposalNumber && !isProcessing) {
    startPaymentVerification(proposalNumber)
  }
}, [])

// Polling handler
const startPaymentVerification = (proposalNumber: string) => {
  startPolling({
    proposalNumber,
    onSuccess: async (data) => {
      await handlePaymentSuccess(data)
    },
    onError: (error) => {
      handlePaymentError(error)
    },
    onTimeout: () => {
      handlePaymentTimeout()
    }
  })
}

// Success handler
const handlePaymentSuccess = async (data: PaymentVerificationData) => {
  // Clear localStorage
  clearProposalNumber()
  
  // Issue quote
  const issueQuoteRequestBody = {
    ProposalNo: data.proposal_number
  }
  
  const response = await issueQuote({
    issueQuoteRequest: issueQuoteRequestBody
  })
  
  // Store response and show success
  setIssueQuoteResponse(response)
  setPolicyNo(response.data.PolicyNo)
  setShowSuccessDialog(true)
}
```

### 6. Card Payment Updates

**Changes**:
- Remove websocket confirmation
- Use polling immediately after payment submission
- Same success/error handling as e-wallet

**Key Functions**:
```typescript
const handleCardPaymentSubmit = async (paymentRequest) => {
  setIsProcessing(true)
  
  try {
    // Get auth and submit payment
    const authResponse = await getPaymentAuth()
    const paymentResult = await submitPayment({
      data: paymentRequest,
      brand_token: authResponse.access_token
    })
    
    if (!paymentResult?.success) {
      // Handle error
      return
    }
    
    // Start polling instead of websocket
    setShowCardPaymentProcessing(true)
    
    startPolling({
      proposalNumber: apiResponse.data.ProposalNo,
      onSuccess: async (data) => {
        setShowCardPaymentProcessing(false)
        await handlePaymentSuccess(data)
      },
      onError: (error) => {
        setShowCardPaymentProcessing(false)
        handlePaymentError(error)
      },
      onTimeout: () => {
        setShowCardPaymentProcessing(false)
        handlePaymentTimeout()
      }
    })
  } catch (error) {
    // Handle error
  } finally {
    setIsProcessing(false)
  }
}
```

## Data Models

### Payment Verification Request
```typescript
interface PaymentVerificationRequest {
  proposal_number: string
}
```

### Payment Verification Response
```typescript
interface PaymentVerificationResponse {
  success: boolean
  message: string
  data: {
    proposal_number: string
    transaction_status_code: string // "OK.00.00" for success
    is_verified: boolean
    status: "completed" | "pending" | "failed"
    transaction_status: "success" | "pending" | "failed"
    amount: string
    transaction_date: string
  }
}
```

### Polling Configuration
```typescript
interface PollingConfig {
  proposalNumber: string
  interval: number // 2000ms
  maxAttempts: number // 150
  timeout: number // 300000ms
  onSuccess: (data: PaymentVerificationData) => void
  onError: (error: Error) => void
  onTimeout: () => void
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Proposal Number Persistence
*For any* payment flow that redirects to an external payment wall, saving the proposal number to localStorage before redirect and retrieving it after return should yield the same proposal number value.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 2: Polling Interval Consistency
*For any* polling session, the time between consecutive verification requests should be 2000ms ± 100ms (accounting for network latency and processing time).

**Validates: Requirements 3.2, 6.1**

### Property 3: Success Detection
*For any* verification response where `success: true`, `is_verified: true`, `transaction_status: "success"`, and `transaction_status_code: "OK.00.00"`, the polling service should stop polling and trigger the success callback.

**Validates: Requirements 3.3, 7.1**

### Property 4: Polling Termination
*For any* polling session, when either maxAttempts is reached OR timeout duration is exceeded OR a success/failure response is received, polling should stop and no further requests should be made.

**Validates: Requirements 3.4, 3.5, 6.3, 6.4**

### Property 5: LocalStorage Cleanup
*For any* successful payment verification, the proposal number should be removed from localStorage after the success callback completes.

**Validates: Requirements 2.4, 7.5**

### Property 6: Network Error Resilience
*For any* polling request that fails due to network error, the polling service should continue polling after the configured interval without counting the failed request toward the timeout.

**Validates: Requirements 11.1, 11.2, 11.3**

### Property 7: Quote Issuance Idempotency
*For any* proposal number, calling the issue quote API multiple times should not create duplicate policies or cause errors.

**Validates: Requirements 11.5**

### Property 8: Card Payment Polling
*For any* card payment submission that returns success, the system should immediately start polling with the proposal number without requiring a page redirect.

**Validates: Requirements 4.1, 4.5**

### Property 9: E-wallet Return Detection
*For any* page load where a proposal number exists in localStorage, the system should automatically start polling for payment verification.

**Validates: Requirements 5.1, 5.3**

### Property 10: URL Cleanup
*For any* return from payment wall with `transaction_id` in the URL, the system should remove the query parameter from the URL without causing a page reload.

**Validates: Requirements 5.2**

## Error Handling

### Network Errors
- **Scenario**: API request fails due to network issues
- **Handling**: 
  - Log error
  - Continue polling (don't count toward timeout)
  - Show persistent "Processing..." message
  - If consecutive failures exceed threshold (10), show warning but continue

### Timeout Errors
- **Scenario**: Maximum attempts or duration reached without success
- **Handling**:
  - Stop polling
  - Show timeout message with proposal number
  - Provide "Contact Support" button
  - Log timeout event with attempt count and duration

### Payment Failure
- **Scenario**: Verification response indicates payment failed
- **Handling**:
  - Stop polling
  - Show error message from response
  - Provide "Try Again" button to restart payment
  - Log failure details

### Missing Proposal Number
- **Scenario**: localStorage doesn't contain proposal number on return
- **Handling**:
  - Check URL for transaction_id (legacy support)
  - If not found, show error message
  - Provide "Start New Payment" button
  - Log missing proposal number event

### API Response Errors
- **Scenario**: API returns 400/500 error
- **Handling**:
  - Parse error message from response
  - Show user-friendly error message
  - Provide retry option
  - Log error details

## Testing Strategy

### Unit Tests
- Test localStorage save/retrieve/clear functions
- Test polling interval timing
- Test success/error/timeout callbacks
- Test URL parameter removal
- Test proposal number validation

### Property-Based Tests
- Test polling interval consistency across random durations
- Test success detection with various response formats
- Test network error resilience with random failure patterns
- Test localStorage persistence across random proposal numbers
- Test timeout behavior with random attempt counts

### Integration Tests
- Test complete e-wallet flow (save → redirect → return → poll → success)
- Test complete card payment flow (submit → poll → success)
- Test error scenarios (timeout, failure, network errors)
- Test concurrent polling sessions
- Test localStorage cleanup after success

### Manual Testing
- Test with real payment gateway
- Test redirect flow with actual e-wallet providers
- Test card payment with actual card processor
- Verify invoice and COC display correctly
- Test on multiple browsers and devices

## Implementation Notes

### Polling Service Implementation
```typescript
// src/hooks/use-payment-polling.ts
import { useEffect, useRef, useState, useCallback } from 'react'
import { useVerifyPayment } from '@/app/data/mutations/payment-verification'

export function usePaymentPolling(config: PaymentPollingConfig) {
  const [isPolling, setIsPolling] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const { mutateAsync: verifyPayment } = useVerifyPayment()
  
  const {
    proposalNumber,
    interval = 2000,
    maxAttempts = 150,
    timeout = 300000,
    onSuccess,
    onError,
    onTimeout
  } = config
  
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsPolling(false)
  }, [])
  
  const checkPaymentStatus = useCallback(async () => {
    try {
      const response = await verifyPayment({
        proposal_number: proposalNumber
      })
      
      setAttemptCount(prev => prev + 1)
      
      // Check for success
      if (
        response.success &&
        response.data.is_verified &&
        response.data.transaction_status === 'success' &&
        response.data.transaction_status_code === 'OK.00.00'
      ) {
        stopPolling()
        onSuccess(response.data)
        return
      }
      
      // Check for failure
      if (response.data.transaction_status === 'failed') {
        stopPolling()
        onError(new Error(response.message))
        return
      }
      
      // Check timeout conditions
      const elapsedTime = Date.now() - startTimeRef.current
      if (attemptCount >= maxAttempts || elapsedTime >= timeout) {
        stopPolling()
        onTimeout()
        return
      }
      
      // Continue polling (status is pending)
    } catch (error) {
      // Network error - log but continue polling
      console.error('Payment verification error:', error)
      
      // Check if we should timeout due to too many errors
      const elapsedTime = Date.now() - startTimeRef.current
      if (elapsedTime >= timeout) {
        stopPolling()
        onTimeout()
      }
    }
  }, [
    proposalNumber,
    verifyPayment,
    attemptCount,
    maxAttempts,
    timeout,
    onSuccess,
    onError,
    onTimeout,
    stopPolling
  ])
  
  const startPolling = useCallback(() => {
    if (isPolling) return
    
    setIsPolling(true)
    setAttemptCount(0)
    startTimeRef.current = Date.now()
    
    // Check immediately
    checkPaymentStatus()
    
    // Then check at intervals
    intervalRef.current = setInterval(checkPaymentStatus, interval)
  }, [isPolling, interval, checkPaymentStatus])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])
  
  return {
    isPolling,
    attemptCount,
    startPolling,
    stopPolling
  }
}
```

### API Route Implementation
```typescript
// src/app/api/v1/transactions/verify-status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { proposal_number } = body
    
    if (!proposal_number) {
      return NextResponse.json(
        { success: false, message: 'Proposal number is required' },
        { status: 400 }
      )
    }
    
    // Forward to backend payment service
    const response = await axios.post(
      `${process.env.PAYMENT_BASE_URL}/api/v1/transactions/verify-status`,
      { proposal_number },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PAYMENT_API_KEY}`
        }
      }
    )
    
    return NextResponse.json(response.data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  } catch (error: any) {
    console.error('Payment verification error:', error)
    
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        error.response.data,
        { status: error.response.status }
      )
    }
    
    return NextResponse.json(
      { success: false, message: 'Payment verification failed' },
      { status: 500 }
    )
  }
}
```

### LocalStorage Utility Implementation
```typescript
// src/utils/payment-storage.ts
const STORAGE_KEY = 'payment_proposal_number'

export function saveProposalNumber(proposalNumber: string): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, proposalNumber)
  } catch (error) {
    console.error('Failed to save proposal number:', error)
  }
}

export function getProposalNumber(): string | null {
  if (typeof window === 'undefined') return null
  
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to get proposal number:', error)
    return null
  }
}

export function clearProposalNumber(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear proposal number:', error)
  }
}

export function hasProposalNumber(): boolean {
  return getProposalNumber() !== null
}
```

## Migration Plan

### Phase 1: Add Polling Infrastructure
1. Create API route for payment verification
2. Create polling hook
3. Create localStorage utilities
4. Create payment verification mutation
5. Add unit tests for new utilities

### Phase 2: Update Payment Components
1. Update digital payment form to save proposal number
2. Update payment selection to use polling on mount
3. Update card payment to use polling instead of websocket
4. Keep websocket code temporarily for fallback

### Phase 3: Testing and Validation
1. Test e-wallet flow end-to-end
2. Test card payment flow end-to-end
3. Test error scenarios
4. Test on staging environment
5. Monitor for issues

### Phase 4: Remove Websocket Code
1. Remove Echo/Pusher initialization
2. Remove websocket event listeners
3. Remove getEcho function
4. Uninstall Echo and Pusher packages
5. Remove websocket environment variables
6. Update documentation

## Performance Considerations

### Polling Frequency
- 2-second interval balances responsiveness with server load
- Typical payment confirmation takes 5-30 seconds
- Maximum 150 attempts = 5 minutes of polling

### Network Efficiency
- Small payload size (~100 bytes)
- Minimal server processing required
- Caching not applicable (status changes frequently)

### Browser Performance
- Single interval timer per session
- Automatic cleanup on unmount
- No memory leaks from unclosed connections

### Server Load
- Idempotent endpoint (safe to call repeatedly)
- Lightweight query (indexed by proposal number)
- Rate limiting not required (user-initiated, bounded duration)

## Security Considerations

### Proposal Number Protection
- Stored in localStorage (client-side only)
- Not transmitted in URL (prevents logging/sharing)
- Cleared after successful verification

### API Security
- Backend validates proposal number ownership
- Rate limiting on backend (if needed)
- HTTPS required for all requests

### Error Message Safety
- Don't expose internal error details
- Generic messages for security-related errors
- Log detailed errors server-side only
