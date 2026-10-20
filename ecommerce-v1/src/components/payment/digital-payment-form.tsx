// DLT Hosted Checkout v4.0 — digital payments follow the same form as cards.
// This module re-exports HostedCheckoutForm from card-payment-form.tsx under
// the DigitalPaymentForm name so any components using the old import path
// continue to work without changes.
export { HostedCheckoutForm as DigitalPaymentForm } from './card-payment-form'
