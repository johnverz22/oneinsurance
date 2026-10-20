Title: Live Content

Description: Fetched live

Source: https://developers.oneinsurance.shop/downloads/design/policy-issuance

---

# Travel insurance — Policy issuance in progress

Revision: 19 October 2026. Page: `/mockups/travel/policy-issuance`. Download: `/downloads/design/policy-issuance` → `policy-issuance-design.md`.

## Purpose and status

Explain the wait between confirmed payment and ready policy documents. The design gives a clear sequence and reassures the user without asking for another purchase action. The current page is a static progress mockup: its payment confirmation, insurer recording and email messages are sample interface copy, not live events.

Apply the shared UI guide at `/downloads/design/ui-theme`. This screen is a post-payment concept outside the five numbered quote stages. Its timeline should not look like another editable quote form.

## Page anatomy

1. Developer area with current and shared Markdown downloads.
2. Consumer header in proposal/issuance mode.
3. A focused main card headed “Finalizing your policy”.
4. A short instruction to keep the page open while documents are prepared.
5. A vertical progress list showing completed, active and pending states.
6. Email delivery explanation.
7. An explicit “Preview issued policy” link to the separate issued-page mockup.
8. Shared footer.

Keep the content concentrated in one main task region. Avoid plan selection, extra payment buttons or unrelated marketing cards in the waiting state. The manual preview link is a design-review affordance; do not describe it as automatic completion.

## Progress specification

| Stage | Current visual state | Meaning in the design |
| --- | --- | --- |
| Payment confirmed | Completed marker with check | Funds are considered confirmed in this sample story |
| Issuing your policy | Active marker with spinner and `aria-current="step"` | Insurer recording is represented as in progress |
| Preparing Certificate of Coverage and acknowledgement receipt | Pending marker/document icon | Documents are not yet shown as ready |

The active status text is “Recording your policy with the insurer”. Completed and pending meanings are also supplied in accessible text. Do not rely on spinner motion or marker color alone to communicate progress.

The current template does not poll an insurer, start issuance, advance the timeline or send email. Do not attach arbitrary percentage progress or a countdown to this static illustration. A real implementation must derive each state from authoritative server events.

## Visual layout

Use `.travel-results.travel-issuance-main` and `.travel-applicant-card.travel-issuance-card`. The heading uses `text-2xl sm:text-3xl`, semibold and tight tracking. Heading accent is `#006838` light and `#d0e3c8` dark. The explanatory copy uses the shared readable secondary size and generous line height.

The vertical timeline reuses `.travel-journey` marker, connector and panel classes with issuance-specific rules. Connect the markers cleanly; allow the long third-stage heading to wrap naturally. Keep icon columns stable rather than compressing text into a narrow column on mobile.

Use shared border/card surfaces and restrained spacing. The email note pairs a small mail icon with readable copy. It is explanatory content rather than a success badge. The preview link uses a secondary action treatment with at least a 44px target.

## Motion and accessibility

The active spinner is supplementary and stops under reduced-motion CSS. The status remains understandable when it is static. Preserve the ordered list, named progress label, active-step semantics and `role="status"` text.

This timeline is rendered already enhanced in the template; it is distinct from the scroll-revealed marketing timeline. Do not require scrolling to discover whether payment or issuance completed. Avoid continuously repeating screen-reader announcements.

The Developer disclosure uses the same shared 260ms opening/closing implementation as the rest of the app and immediately changes under reduced motion. Its links remain outside the consumer workflow and are hidden in print.

## Delivery copy and production states

The screen says the eCOC and acknowledgement receipt will be sent to the applicant's email address. This is intended communication design. Before production, confirm which system creates each document, which address is used, whether delivery can be retried and how failures are surfaced.

Required production designs still include prolonged pending, insurer rejection, issuance failure after payment, email failure, session interruption and safe refresh/resume. Do not invent a refund policy or a claims contact to fill those gaps. The owning teams must define recovery and support behavior.

Never trigger another charge because issuance is slow. Payment confirmation and policy issuance are distinct state transitions, and duplicate callbacks/retries need idempotent handling in the backend.

## Source map

- `resources/views/mockups/travel-insurance/policy-issuance.blade.php`.
- Shared header with `proposalMode` and `issuanceMode`, and shared footer.
- `.travel-issuance-*` and `.travel-journey*` in `resources/css/app.css`.
- Next concept: `/mockups/travel/policy-issued`, rendered by `IssuedPolicyPreviewController`.

## Acceptance

Check marker alignment, wrapped stage headings and card width at 390px and a small laptop. Inspect dark-mode heading/connector contrast. With reduced motion, confirm the spinner stops but active status is clear. Navigate by keyboard to the issued preview and the Developer downloads. Confirm the link opens the separate fictional issued-page view without implying that a background process actually completed.


