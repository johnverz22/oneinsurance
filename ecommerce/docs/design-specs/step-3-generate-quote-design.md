Title: Live Content

Description: Fetched live

Source: https://developers.oneinsurance.shop/downloads/design/step-3

---

# Travel insurance — Step 3: Generate quote

Revision: 19 October 2026. Page: `/mockups/travel/step-3`. Download: `/downloads/design/step-3` → `step-3-design.md`.

## Purpose and status

Collect applicant/traveller details, optional add-ons and review acknowledgement before generating a proposal preview. This stage moves from plan exploration to detailed form entry. It uses browser state and sample pricing; it is not a verified insurer application endpoint.

The shared theme guide at `/downloads/design/ui-theme` defines colors, typography, borders, focus and motion. Keep inputs consistent with `/ui`; do not create a second field system for identity or beneficiary controls.

## Journey and state ownership

The five-step progress marks Generate quote current. `travelMockup` provides trip context and `travelApplicant` manages applicants, selected plan, add-ons and review. The selected plan and trip can arrive in query parameters from Step 2. Invalid preview values fall back to sample state. Use the existing parsing and allowed-plan checks rather than trusting arbitrary query text.

`travel-applicant.js` also supports an edit preview and saved session state. Generated proposals are locked in later stages. Preserve the existing distinction between editable form entry and generated review; do not add an edit link that silently mutates a locked proposal.

## Information hierarchy

1. Developer strip and consumer header.
2. Five-stage progress.
3. Loading/ready content and trip summary.
4. Page heading and instruction.
5. Main form column with coverage/plan context, add-ons and individual traveller cards.
6. Selected-plan/premium summary rail.
7. Data sharing agreement and review dialogs.
8. Shared footer and Modify search dialog.

The form should feel like a set of clear tasks. Use collapsible sections to manage length, keeping each traveller's identity and related fields together. Avoid hiding validation errors in an unrelated closed panel.

## Form content

The traveller model includes first/middle/last name, suffix, gender, birth date, email, mobile, ID type/number, address, vaccination acknowledgement, data-sharing consent, optional beneficiary and local file fields. Follow the actual required flags in `applicant-form.blade.php`; middle name and suffix are explicitly optional, while several address fields are currently required in the mockup.

ID type options include Passport, National ID, Driver's licence and Other government ID. Names and ID values are text; retain leading zeros and punctuation. Date inputs use a date type and the preview's date constraints. Do not infer insurer age eligibility from these controls.

The optional beneficiary switch reveals its related fields. Preserve conditional required behavior and meaningful grouping. Front/back identity file controls are preview inputs; use only fictional files and retain the module's local validation/error feedback. This page does not establish a secure document upload service.

Consent opens the named Data sharing agreement dialog. Its copy is marked as draft in the source and requires owner review before live use. The checkbox and adjacent link should be separate operable controls without ambiguous click behavior.

## Add-ons and premiums

The sample add-ons are Adventure activities, Winter sports and Rental-car protection. Each has a price, explanation and limitation note. Display selection clearly and keep exclusions beside each option. Optional means the user can proceed without selecting an add-on.

Retain the shared total formatting and traveller multiplier implemented in `travel-applicant.js`. These numbers are demonstration calculations. Production premiums, taxes, activity eligibility, plan compatibility and rounding must be confirmed server-side against the owning product contract.

## Layout and visual rules

Use the 1280px travel shell. Desktop forms use a flexible column plus a 340px summary rail with 28px gap. Around 900px, stack the layout and use the existing selected-plan ordering. Cards use 8px corners, shared borders and normally 28px padding, reducing at the smallest breakpoint.

Inputs are at least 44px high with a 6px radius. Green focus borders/outlines apply in both themes with zero field outline offset. Card summaries use green headings in light and soft sage in dark. Use sufficient vertical gaps between fields, separate section labels from hints and retain readable long consent copy.

The floating trip summary appears according to the existing intersection observer. It should reinforce context without obscuring form actions or keyboard focus. Do not introduce a second fixed summary with competing totals.

## Interaction and state requirements

| State/action | Expected outcome |
| --- | --- |
| Trip changed | Traveller list synchronizes and outdated review approval is cleared |
| Traveller disclosure | Smooth open/close, keyboard operable, repeated toggles safe |
| Add-on changed | Selection and total agree; qualification remains visible |
| Beneficiary enabled | Fields appear with conditional validation |
| Invalid fields/file | Text feedback; retain entered data and reveal relevant section |
| Review application | Review dialog presents the current entered data |
| Review approved | Existing generation flow can continue to Step 4 |
| Session storage unavailable | Preview remains usable; do not imply permanent saving |

Avoid collecting real personal data during design review. Session continuity is not authenticated storage, and file objects are not a persisted upload. The developer documentation downloads must remain independent of application submission.

## Sources

- `resources/views/mockups/travel-insurance/step-3.blade.php`.
- Partials: `applicant-form`, `selected-plan`, `coverage-benefits`, `application-review`, `quote-form`, `trip-summary`.
- `resources/js/travel-applicant.js`, `travel-plans.js`, `travel-mockup.js`.
- Existing checks: `tests/Unit/TravelApplicant.test.js`; shared CSS in `resources/css/app.css`.

## Acceptance and production gap

Test one and multiple travellers, optional beneficiary on/off, add-on selection, missing required fields, invalid date/contact values, local file errors, consent dialog, review confirmation and next-stage navigation. Verify summary totals and section heading colors in both themes, keyboard focus and reduced motion. Check stacked form layout at 390px and the 900px boundary.

Production requires approved fields, consent wording, insurer eligibility, secure upload handling, authenticated persistence, server validation and proposal creation/idempotency. Do not label the proposal as saved by an insurer merely because the client preview advanced.


