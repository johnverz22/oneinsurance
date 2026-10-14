// ---------------------------------------------------------------------------
// Payment mutations — DLT Hosted Checkout v4.0
//
// The BFF (/api/payment/*) manages the DLT OAuth token entirely server-side.
// The browser never holds or passes an Authorization header for DLT calls.
// ---------------------------------------------------------------------------

import {
  PaymentSubmitRequest,
  PaymentSubmitResponse,
  PaymentSyncRequest,
  PaymentSyncResponse,
  PaymentAuthResponse,
} from '@/types/payment'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

/**
 * Submit a Hosted Checkout payment request.
 * The BFF injects merchant_account_id, service_code, channel, time_offset,
 * and the DLT Bearer token.  No Authorization header is sent from the browser.
 *
 * Accepts both the v4.0 direct shape { ...PaymentSubmitRequest } and the
 * legacy v3.0 shape { data: PaymentSubmitRequest, brand_token: string } so
 * health/CTPL pages continue to compile while they are migrated.
 */
export function usePaymentSubmit() {
  return useMutation({
    mutationKey: ['payment-submit'],
    mutationFn: async (
      input:
        | PaymentSubmitRequest
        | { data: PaymentSubmitRequest; brand_token: string }
    ) => {
      // Accept both the new direct shape and the old { data, brand_token } shape
      const payload = 'data' in input && 'brand_token' in input ? input.data : input

      const response = await axios.post<PaymentSubmitResponse>(
        '/api/payment/submit',
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      )
      return response.data
    },
  })
}

/**
 * Verify payment status after the payor returns from the DLT-hosted page.
 * Call once on result-screen mount — this is not a polling hook.
 */
export function usePaymentSync() {
  return useMutation({
    mutationKey: ['payment-sync'],
    mutationFn: async (req: PaymentSyncRequest) => {
      const response = await axios.post<PaymentSyncResponse>(
        '/api/payment/sync',
        req,
        { headers: { 'Content-Type': 'application/json' } }
      )
      return response.data
    },
  })
}

/**
 * @deprecated BFF now manages the DLT OAuth token internally.
 * Kept as a shim so health/CTPL payment pages compile while they are migrated
 * to Hosted Checkout.  Returns a dummy token — the BFF ignores any
 * Authorization header sent by the browser.
 */
export function usePaymentAuth() {
  return useMutation({
    mutationKey: ['payment-auth'],
    mutationFn: async (): Promise<PaymentAuthResponse> => ({
      token_type: 'Bearer',
      expires_in: 0,
      access_token: '',
    }),
  })
}
