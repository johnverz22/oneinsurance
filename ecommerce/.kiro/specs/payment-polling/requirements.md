# Requirements Document

## Introduction

This specification defines the requirements for replacing the websocket-based payment confirmation system with a polling-based approach for travel insurance payments. The current system uses Laravel Echo with Pusher/Reverb to listen for payment confirmation events. The new system will use HTTP polling to check payment status by calling `/api/v1/transactions/verify-status` with the proposal number, eliminating the dependency on websocket infrastructure.

## Glossary

- **Payment_System**: The travel insurance payment processing system
- **Polling_Service**: The client-side service that periodically checks payment status
- **Payment_Gateway**: The external payment provider (e-wallet, card processor)
- **Proposal_Number**: Unique identifier for the insurance proposal (e.g., "PROP123456")
- **Payment_Status_Endpoint**: API endpoint `/api/v1/transactions/verify-status` that returns current payment status
- **Verification_Response**: Response indicating payment verification status with transaction details
- **Polling_Interval**: Time between consecutive status check requests (2 seconds)
- **Local_Storage**: Browser storage used to persist Proposal_Number across page redirects

## Requirements

### Requirement 1: Payment Status Verification API

**User Story:** As a developer, I want a reliable API endpoint to verify payment status using the proposal number, so that the frontend can poll for payment confirmation without websockets.

#### Acceptance Criteria

1. THE Payment_System SHALL provide a POST endpoint at `/api/v1/transactions/verify-status`
2. WHEN called, THE Payment_Status_Endpoint SHALL accept a JSON payload with `proposal_number` field
3. WHEN a valid Proposal_Number is provided, THE Payment_Status_Endpoint SHALL return the verification status
4. WHEN payment is verified successfully, THE Verification_Response SHALL include `success: true`, `is_verified: true`, and `transaction_status: "success"`
5. THE Verification_Response SHALL include fields: `success`, `message`, `data` object containing `proposal_number`, `transaction_status_code`, `is_verified`, `status`, `transaction_status`, `amount`, and `transaction_date`

### Requirement 2: Proposal Number Storage

**User Story:** As a developer, I want to persist the proposal number before redirecting to the payment wall, so that it's available when the user returns to verify payment status.

#### Acceptance Criteria

1. WHEN a user is about to be redirected to the payment wall, THE Payment_System SHALL save the Proposal_Number to Local_Storage
2. THE Payment_System SHALL store the Proposal_Number with key `payment_proposal_number`
3. WHEN the user returns from the payment wall, THE Payment_System SHALL retrieve the Proposal_Number from Local_Storage
4. WHEN payment verification is complete, THE Payment_System SHALL remove the Proposal_Number from Local_Storage
5. THE Payment_System SHALL handle cases where Local_Storage is unavailable or the Proposal_Number is missing

### Requirement 3: Client-Side Polling Service

**User Story:** As a user, I want the system to automatically check my payment status after I complete payment, so that I receive confirmation without manual intervention.

#### Acceptance Criteria

1. WHEN a user returns from the payment wall, THE Polling_Service SHALL automatically start polling with the stored Proposal_Number
2. THE Polling_Service SHALL make POST requests to `/api/v1/transactions/verify-status` every 2 seconds
3. WHEN the response has `success: true`, `is_verified: true`, and `transaction_status: "success"`, THE Polling_Service SHALL stop polling and trigger success callback
4. WHEN the response indicates failure, THE Polling_Service SHALL stop polling and trigger error callback
5. WHEN maximum polling duration is reached without success, THE Polling_Service SHALL stop polling and trigger timeout callback
6. THE Polling_Service SHALL continue polling until receiving a successful verification response

### Requirement 4: Card Payment Polling

**User Story:** As a user paying with a card, I want the system to check my payment status without leaving the page, so that I get immediate confirmation.

#### Acceptance Criteria

1. WHEN a card payment is submitted, THE Payment_System SHALL start polling for verification using the Proposal_Number
2. THE Payment_System SHALL display a processing indicator while polling
3. WHEN payment is verified successfully, THE Payment_System SHALL issue the insurance quote and display the invoice
4. WHEN payment verification fails, THE Payment_System SHALL display an error message with retry option
5. THE Payment_System SHALL use the same Polling_Service as e-wallet payments

### Requirement 5: E-wallet Payment Return Handling

**User Story:** As a user paying with an e-wallet, I want the system to detect when I return from the payment wall and check my payment status, so that I receive confirmation automatically.

#### Acceptance Criteria

1. WHEN a user returns from the payment wall, THE Payment_System SHALL retrieve the Proposal_Number from Local_Storage
2. THE Payment_System SHALL remove the `transaction_id` query parameter from the URL if present
3. THE Payment_System SHALL start the Polling_Service with the retrieved Proposal_Number
4. WHEN polling completes successfully, THE Payment_System SHALL issue the insurance quote and display the invoice
5. WHEN polling fails or times out, THE Payment_System SHALL display an error with the Proposal_Number and contact support information

### Requirement 6: Polling Configuration

**User Story:** As a developer, I want configurable polling parameters, so that I can optimize performance and user experience.

#### Acceptance Criteria

1. THE Polling_Service SHALL use a Polling_Interval of 2000ms (2 seconds)
2. THE Polling_Service SHALL accept a maximum timeout duration parameter (default 300000ms / 5 minutes)
3. THE Polling_Service SHALL accept a maximum retry count parameter (default 150 attempts)
4. WHEN any limit is reached, THE Polling_Service SHALL stop and trigger timeout callback
5. THE Polling_Service SHALL expose these parameters through a configuration object

### Requirement 7: Success Response Handling and Quote Issuance

**User Story:** As a user, I want to see my payment confirmation, invoice, and certificate of coverage immediately after successful payment, so that I have proof of my insurance purchase.

#### Acceptance Criteria

1. WHEN the Verification_Response has `transaction_status_code: "OK.00.00"`, THE Payment_System SHALL consider payment successful
2. WHEN payment is verified successfully, THE Payment_System SHALL call the issue quote endpoint at `/quote/travel/issue-quote`
3. THE Payment_System SHALL send a POST request with payload `{ProposalNo: "PROP123456"}` to issue the quote
4. WHEN the issue quote response is received, THE Payment_System SHALL store the policy data including PolicyNo
5. THE Payment_System SHALL display the PaymentSuccessInline component with invoice and Certificate of Coverage (COC)
6. THE Payment_System SHALL allow users to toggle between viewing the invoice and the COC
7. THE Payment_System SHALL provide a download button for the invoice PDF

### Requirement 8: Error Handling and User Feedback

**User Story:** As a user, I want clear feedback about my payment status, so that I know what's happening and what to do if something goes wrong.

#### Acceptance Criteria

1. WHEN polling is in progress, THE Payment_System SHALL display "Processing your payment..." message
2. WHEN payment is verified successfully, THE Payment_System SHALL display success message with policy details and invoice
3. WHEN payment verification fails, THE Payment_System SHALL display the failure reason from the response message
4. WHEN polling times out, THE Payment_System SHALL display timeout message with Proposal_Number and support contact
5. THE Payment_System SHALL log all polling attempts and responses for debugging

### Requirement 9: Websocket Removal

**User Story:** As a developer, I want to remove all websocket dependencies, so that the system is simpler and has fewer infrastructure requirements.

#### Acceptance Criteria

1. THE Payment_System SHALL remove all Echo/Pusher initialization code from payment components
2. THE Payment_System SHALL remove all websocket event listeners from `handleCardPaymentSubmit` and `handleTransactionCompletion`
3. THE Payment_System SHALL remove the `getEcho()` function calls and related utilities
4. THE Payment_System SHALL remove websocket-related environment variables (REVERB_*) from documentation
5. THE Payment_System SHALL remove Echo and Pusher npm packages from dependencies

### Requirement 10: Backward Compatibility

**User Story:** As a developer, I want the new polling system to work with existing payment flows, so that no other parts of the system need changes.

#### Acceptance Criteria

1. THE Polling_Service SHALL work with the existing payment submission API
2. THE Polling_Service SHALL trigger the same success callbacks as the websocket system
3. THE Polling_Service SHALL maintain the same error handling patterns
4. THE Polling_Service SHALL work with both card and e-wallet payment methods
5. THE Polling_Service SHALL integrate with the existing quote issuance flow

### Requirement 11: Performance and Reliability

**User Story:** As a user, I want reliable payment confirmation, so that I don't lose my payment or have to contact support.

#### Acceptance Criteria

1. THE Polling_Service SHALL handle network errors gracefully and retry
2. WHEN a polling request fails due to network error, THE Polling_Service SHALL retry after the Polling_Interval
3. THE Polling_Service SHALL not count failed network requests toward the timeout
4. THE Payment_Status_Endpoint SHALL be idempotent (safe to call multiple times with same Proposal_Number)
5. THE Payment_System SHALL prevent duplicate quote issuance for the same Proposal_Number
