Title: Live Content

Description: Fetched live

Source: https://developers.oneinsurance.shop/downloads/design/step-5

---

# Travel insurance — Step 5: Payment

Revision: 19 October 2026. Page: `/mockups/travel/step-5`. Download: `/downloads/design/step-5` → `step-5-design.md`.

## Purpose and preview boundary

Let a user review the proposal total, choose a payment method and provide payer/billing information. The current screen is a payment preview. Selecting a brand and submitting the form opens local preview feedback; it does not collect funds or confirm payment with a processor.

Apply `/downloads/design/ui-theme` for shared styling. Keep the green focus border/outline on payer fields in both themes. Brand assets illustrate selectable methods and do not prove an active processor integration.

## Entry and page structure

Step 5 uses `travelApplicant` with both `data-review-page` and `data-payment-page`, then `travelPayment` in the payment partial. It inherits the locked proposal model and restores local preview data or fictional defaults on direct entry.

The screen order is developer area, proposal-mode header, five-stage progress, payment content, cancellation interactions and footer. Within payment content:

1. A loading skeleton reserves the form/summary layout.
2. Proposal details show trip, traveller names and selected add-ons.
3. Payment method selection uses recognizable logos and radio semantics.
4. Payer contact information follows.
5. Billing address and “Use lead traveller's address” follow.
6. The selected-plan/premium summary provides the payment action.
7. A mobile total/action bar appears when the main summary has moved above the viewport.

Keep the total near the action. Avoid repeating several visually competing primary actions on the same viewport.

## Payment choices

The preview lists GCash, Maya, GrabPay, ShopeePay, Visa and Mastercard. GCash is the initial selection. Each is a real labelled radio control; the logo tile supplies the visible boundary and selected check. Keyboard focus must be visible even though the native radio is visually hidden.

Use the supplied proportional PNGs under `images/mockups/travel-insurance/payments`. Avoid distorted logos, text-only choices with no selected state, or inaccessible image-only buttons. The user selects one method. Do not collect card credentials in this mockup.

## Payer and billing fields

Payer first/last name, email and phone are prefilled from the lead traveller where available and remain editable. Billing includes country, postal code, state/province/region, city/municipality and two address lines. The current template requires these fields, including address line 2; that is a mockup requirement to verify before production.

The country dropdown contains a limited preview list, not a complete serviceable-country contract. Retain native email/tel types, billing autocomplete and the current phone pattern. Labels should state required status consistently. Errors must be visible in text rather than communicated through a logo or red border alone.

“Use lead traveller's address” copies address values while preserving the earlier manual address for restoration. Toggling off restores that manual state when available. Editing billing text clears the copy indication according to the current handler. Do not overwrite unrelated payer contact fields when copying an address.

## Layout and responsive design

Use the existing travel applicant/payment grid and summary rail. Form controls stack at narrow widths and combine into structured columns at sm. The payment brand grid changes with available width, including its 1100px rule. Keep each logo choice large enough to use by touch.

The mobile payment bar uses the existing intersection observer, which activates after the main summary passes above the viewport. Preserve sufficient bottom spacing so it does not cover the last field or an error. Hide the bar in print. When the main total is visible, the floating duplicate should not compete with it.

Dark mode uses neutral charcoal fields/cards with readable supporting text. Selected method styling, total and focus remain distinguishable without relying solely on green. Use actual radio checked state rather than an independently maintained visual flag.

## State matrix

| State/action | Design expectation |
| --- | --- |
| Initial loading | Existing local three-second skeleton; accessible loading status |
| Ready | Form and summary appear with stable layout |
| Method changed | Exactly one method selected; label and checked state agree |
| Address copied/restored | Values and checkbox state remain consistent |
| Invalid payer input | Native/current validation prevents advancing silently |
| Preview payment | Named dialog explicitly identifies the demonstration |
| Cancel proposal | Existing locked-proposal cancellation flow |
| Reduced motion | Immediate/nonanimated panels and mobile bar behavior |

Loading here is a timer in `travel-payment.js`. It should not be documented as payment-provider communication. The preview dialog and the separate policy issuance route do not establish a real payment-to-issuance event chain.

## Accessibility and verification

Test all six choices with keyboard, inspect checked and focus states, and ensure logo alternative text names the method. Test empty/invalid email and phone, payer edits, address copy/off/restore and manual address changes. Scroll through the full mobile form and confirm the total bar does not obscure inputs or actions. Check loading, dark mode, reduced motion and cancellation.

Use fictional names/contact details. The Developer guide link is separate from the payment action and must download Markdown without submitting the form.

## Source map and production requirements

- Page: `resources/views/mockups/travel-insurance/step-5.blade.php`.
- Partials: `payment`, `payment-skeleton`, `selected-plan`, `cancel-proposal`.
- State: `resources/js/travel-payment.js`, `travel-applicant.js`.
- Tests: `tests/Unit/TravelPayment.test.js` and `TravelApplicant.test.js`.
- CSS: `.travel-payment-*`, summary rail, responsive/print/reduced-motion rules in `app.css`.

Production requires a verified processor contract, server-authoritative amount/currency, idempotent checkout, safe return/callback handling, authenticated proposal ownership and reconciliation. Define pending, failed, cancelled, duplicate and confirmed outcomes before connecting issuance. A client-side success screen must not become the source of payment truth.


