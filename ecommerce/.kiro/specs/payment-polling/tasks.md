# Implementation Plan: Payment Polling System

## Overview

This plan outlines the implementation of a polling-based payment verification system to replace websocket-based confirmation. Tasks are organized to build incrementally, with testing integrated throughout.

## Tasks

- [ ] 1. Create payment verification API infrastructure
  - Create API route for payment status verification
  - Set up request/response types
  - Add error handling and logging
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [ ] 1.1 Create payment verification API route
  - Create file `src/app/api/v1/transactions/verify-status/route.ts`
  - Implement POST handler that accepts `{proposal_number: string}`
  - Forward request to backend payment service at `${PAYMENT_BASE_URL}/api/v1/transactions/verify-status`
  - Return response with proper CORS headers
  - Handle 400/500 errors gracefully
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 1.2 Create payment verification types
  - Create/update `src/types/payment.ts` with verification types
  - Add `PaymentVerificationRequest` interface
  - Add `PaymentVerificationResponse` interface with all required fields
  - Add `PaymentVerificationData` interface
  - _Requirements: 1.5_

- [ ]* 1.3 Write unit tests for API route
  - Test successful verification response
  - Test pending status response
  - Test failed status response
  - Test missing proposal number (400 error)
  - Test backend service error (500 error)
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Create localStorage utilities for proposal number persistence
  - Implement save/retrieve/clear functions
  - Add error handling for localStorage unavailability
  - Add TypeScript types
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 2.1 Create payment storage utility
  - Create file `src/utils/payment-storage.ts`
  - Implement `saveProposalNumber(proposalNumber: string): void`
  - Implement `getProposalNumber(): string | null`
  - Implement `clearProposalNumber(): void`
  - Implement `hasProposalNumber(): boolean`
  - Add try-catch for localStorage errors
  - Add window undefined check for SSR safety
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 2.2 Write unit tests for payment storage
  - Test save and retrieve proposal number
  - Test clear proposal number
  - Test hasProposalNumber returns correct boolean
  - Test localStorage unavailable scenario
  - Test SSR scenario (window undefined)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 3. Create payment verification mutation
  - Create React Query mutation for verification API
  - Add proper error handling
  - Add TypeScript types
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 3.1 Create payment verification mutation
  - Create file `src/app/data/mutations/payment-verification.ts`
  - Implement `useVerifyPayment()` mutation using React Query
  - Make POST request to `/api/v1/transactions/verify-status`
  - Accept `{proposal_number: string}` as parameter
  - Return typed response `VerifyPaymentResponse`
  - Add error handling for network failures
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 4. Create polling service hook
  - Implement reusable polling hook with configurable parameters
  - Add interval management and cleanup
  - Add success/error/timeout callbacks
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 4.1 Create polling hook
  - Create file `src/hooks/use-payment-polling.ts`
  - Implement `usePaymentPolling(config: PaymentPollingConfig)` hook
  - Accept config with: proposalNumber, interval (default 2000ms), maxAttempts (default 150), timeout (default 300000ms), callbacks
  - Use `setInterval` to poll every 2 seconds
  - Call verification mutation on each interval
  - Check for success: `success: true`, `is_verified: true`, `transaction_status: "success"`, `transaction_status_code: "OK.00.00"`
  - Check for failure: `transaction_status: "failed"`
  - Check for timeout: attemptCount >= maxAttempts OR elapsed time >= timeout
  - Stop polling and call appropriate callback on success/failure/timeout
  - Handle network errors: log but continue polling
  - Clean up interval on unmount
  - Return `{isPolling, attemptCount, startPolling, stopPolling}`
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 6.1, 6.2, 6.3, 6.4, 6.5, 11.1, 11.2, 11.3_

- [ ]* 4.2 Write property test for polling interval consistency
  - **Property 2: Polling Interval Consistency**
  - **Validates: Requirements 3.2, 6.1**
  - Generate random polling durations (10-60 seconds)
  - Start polling and measure time between requests
  - Verify interval is 2000ms ± 100ms
  - _Requirements: 3.2, 6.1_

- [ ]* 4.3 Write property test for success detection
  - **Property 3: Success Detection**
  - **Validates: Requirements 3.3, 7.1**
  - Generate random success responses with required fields
  - Verify polling stops and success callback is triggered
  - Verify no additional requests are made after success
  - _Requirements: 3.3, 7.1_

- [ ]* 4.4 Write property test for polling termination
  - **Property 4: Polling Termination**
  - **Validates: Requirements 3.4, 3.5, 6.3, 6.4**
  - Generate random maxAttempts and timeout values
  - Verify polling stops when limits are reached
  - Verify timeout callback is triggered
  - Verify no requests after termination
  - _Requirements: 3.4, 3.5, 6.3, 6.4_

- [ ]* 4.5 Write property test for network error resilience
  - **Property 6: Network Error Resilience**
  - **Validates: Requirements 11.1, 11.2, 11.3**
  - Generate random network error patterns
  - Verify polling continues after network errors
  - Verify failed requests don't count toward timeout
  - Verify eventual success after errors
  - _Requirements: 11.1, 11.2, 11.3_

- [ ] 5. Update digital payment form to save proposal number
  - Add localStorage save before redirect
  - Ensure proposal number is available
  - _Requirements: 2.1, 2.2, 5.1_

- [ ] 5.1 Update digital payment submission handler
  - Open `src/components/payment/payment-selection.tsx`
  - Import `saveProposalNumber` from payment storage utility
  - In `handleDigitalPaymentSubmit`, before `window.location.href = redirectUrl`
  - Add `saveProposalNumber(apiResponse.data.ProposalNo)`
  - Verify proposal number is saved before redirect
  - _Requirements: 2.1, 2.2, 5.1_

- [ ] 6. Update payment selection component for e-wallet return handling
  - Add useEffect to detect proposal number on mount
  - Start polling when proposal number exists
  - Handle success/error/timeout callbacks
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 6.1 Add polling on component mount
  - Open `src/components/payment/payment-selection.tsx`
  - Import `usePaymentPolling` hook
  - Import `getProposalNumber`, `clearProposalNumber` from payment storage
  - Add `useEffect` that runs on mount
  - Check if proposal number exists in localStorage
  - If exists and not already processing, start polling
  - Remove `transaction_id` from URL if present using `removeTransactionIdFromUrl()`
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 6.2 Implement payment success handler
  - Create `handlePaymentSuccess` function
  - Accept `PaymentVerificationData` parameter
  - Clear proposal number from localStorage
  - Set `isIssuingQuote` to true
  - Call `issueQuote` with `{ProposalNo: data.proposal_number}`
  - Store issue quote response
  - Set policy number
  - Set generic digital payment brand for success dialog
  - Show success dialog
  - Set `isIssuingQuote` to false
  - Show popup with success message
  - _Requirements: 5.4, 7.2, 7.3, 7.4, 7.5_

- [ ] 6.3 Implement payment error handler
  - Create `handlePaymentError` function
  - Accept `Error` parameter
  - Clear proposal number from localStorage
  - Show error toast with error message
  - Log error details
  - _Requirements: 5.5, 8.3_

- [ ] 6.4 Implement payment timeout handler
  - Create `handlePaymentTimeout` function
  - Clear proposal number from localStorage
  - Show timeout message with proposal number and support contact
  - Log timeout event
  - _Requirements: 5.5, 8.4_

- [ ] 7. Update card payment to use polling instead of websocket
  - Remove websocket initialization and listeners
  - Add polling after payment submission
  - Use same success/error handlers as e-wallet
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 7.1 Update card payment submission handler
  - Open `src/components/payment/payment-selection.tsx`
  - In `handleCardPaymentSubmit`, remove all Echo/Pusher code
  - Remove `getEcho()` calls
  - Remove `echo.channel()` and event listeners
  - Remove `confirmationPromise` with websocket
  - After successful `submitPayment`, start polling using `usePaymentPolling` hook
  - Pass `apiResponse.data.ProposalNo` as proposal number
  - Use `handlePaymentSuccess`, `handlePaymentError`, `handlePaymentTimeout` as callbacks
  - Keep `setShowCardPaymentProcessing(true)` before polling
  - Set `setShowCardPaymentProcessing(false)` in callbacks
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 9.2_

- [ ] 8. Remove websocket code from transaction completion handler
  - Remove Echo initialization and listeners
  - This handler is now obsolete (replaced by polling on mount)
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 8.1 Remove websocket from transaction completion
  - Open `src/components/payment/payment-selection.tsx`
  - In `handleTransactionCompletion`, remove all Echo/Pusher code
  - Remove `getEcho()` calls
  - Remove `echo.channel()` and event listeners
  - Remove `confirmationPromise` with websocket
  - This function is now handled by polling on mount (step 6.1)
  - Consider removing this function entirely if no longer needed
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 9. Checkpoint - Test e-wallet and card payment flows
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 9.1 Write integration test for e-wallet flow
  - Test complete flow: save proposal → redirect → return → poll → success
  - Mock localStorage
  - Mock verification API responses (pending → success)
  - Verify polling starts on mount
  - Verify success handler called with correct data
  - Verify localStorage cleared after success
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 5.1, 5.3, 5.4_

- [ ]* 9.2 Write integration test for card payment flow
  - Test complete flow: submit → poll → success
  - Mock payment submission API
  - Mock verification API responses (pending → success)
  - Verify polling starts after submission
  - Verify success handler called
  - Verify processing dialog shown/hidden correctly
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]* 9.3 Write integration test for error scenarios
  - Test timeout scenario
  - Test payment failure scenario
  - Test network error scenario
  - Verify appropriate error messages shown
  - Verify localStorage cleaned up
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 11.1, 11.2_

- [ ] 10. Remove websocket dependencies
  - Remove Echo/Pusher imports and initialization
  - Remove getEcho function
  - Update package.json
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 10.1 Remove Echo imports and usage
  - Search codebase for `import.*echo` or `getEcho`
  - Remove all Echo/Pusher imports from payment components
  - Remove `getEcho()` function from `src/lib/echo.ts` or delete file entirely
  - Remove any remaining websocket event listeners
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 10.2 Remove websocket packages
  - Open `package.json`
  - Remove `laravel-echo` package
  - Remove `pusher-js` package
  - Run `npm install` to update lockfile
  - _Requirements: 9.5_

- [ ] 10.3 Update environment variables documentation
  - Remove `NEXT_PUBLIC_REVERB_APP_KEY` from `.env.example` if exists
  - Remove `NEXT_PUBLIC_REVERB_HOST` from `.env.example` if exists
  - Remove `NEXT_PUBLIC_REVERB_PORT` from `.env.example` if exists
  - Remove `NEXT_PUBLIC_REVERB_SCHEME` from `.env.example` if exists
  - Update README or documentation to remove websocket setup instructions
  - _Requirements: 9.4_

- [ ] 11. Final testing and validation
  - Test on staging environment
  - Verify invoice and COC display correctly
  - Monitor for any issues
  - _Requirements: All_

- [ ]* 11.1 Write property test for proposal number persistence
  - **Property 1: Proposal Number Persistence**
  - **Validates: Requirements 2.1, 2.2, 2.3**
  - Generate random proposal numbers
  - Save to localStorage
  - Retrieve from localStorage
  - Verify retrieved value matches saved value
  - _Requirements: 2.1, 2.2, 2.3_

- [ ]* 11.2 Write property test for localStorage cleanup
  - **Property 5: LocalStorage Cleanup**
  - **Validates: Requirements 2.4, 7.5**
  - Generate random proposal numbers
  - Save to localStorage
  - Simulate successful payment
  - Verify proposal number removed from localStorage
  - _Requirements: 2.4, 7.5_

- [ ] 11.3 Manual testing checklist
  - Test e-wallet payment with real payment gateway
  - Test card payment with real card processor
  - Test on Chrome, Firefox, Safari
  - Test on mobile devices
  - Verify invoice displays correctly
  - Verify COC displays correctly
  - Verify download invoice works
  - Test error scenarios (timeout, failure)
  - Verify no console errors
  - _Requirements: All_

## Notes

- Tasks marked with `*` are optional test tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Integration tests validate end-to-end flows
- Manual testing validates real-world scenarios
