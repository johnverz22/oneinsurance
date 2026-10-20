Title: Live Content

Description: Fetched live

Source: https://developers.oneinsurance.shop/downloads/design/step-4

---

# Travel insurance — Step 4: Review quote

Revision: 19 October 2026. Page: `/mockups/travel/step-4`. Download: `/downloads/design/step-4` → `step-4-design.md`.

## Purpose and status

Present a generated proposal for deliberate review before payment. Users need to identify the reference, verify travel/coverage/traveller details, understand the total and either continue or cancel. This is a generated proposal preview using sample/local state, not proof of a proposal in an insurer system.

Use `/downloads/design/ui-theme` for visual foundations. This stage is read-only: the screen explains that generated proposals cannot be edited and directs changes through Cancel and a new quote. Preserve that rule in navigation, cards, header actions and browser return behavior.

## Screen hierarchy

1. Developer downloads and proposal-mode consumer header.
2. Progress showing Review quote as stage four.
3. Trip summary and “Review your proposal” title.
4. “Need to change something?” notice explaining the locked proposal.
5. Proposal reference card with QR, selectable number and Copy number action.
6. Collapsible travel details, coverage/benefits and selected add-ons.
7. Traveller review cards.
8. Summary rail with premium and progression/cancellation actions as rendered by the partials.
9. Footer and cancellation/retrieval interactions.

Keep the locking notice near the top so that the user understands why fields are read-only. Do not style facts like editable inputs. Make cancellation available without making it the dominant action.

## Proposal and QR presentation

The reference area separates number, status and QR. Long proposal identifiers wrap without truncation, and copy feedback appears in a status region. The QR uses the existing generator and loading state; do not replace it with a random decorative code.

The QR state has loading, available and unavailable outcomes. Keep a readable number when the QR is unavailable. A locally generated QR is not a server-backed retrieval service. Do not encode personal details in a new QR payload or imply that scanning it grants policy access.

## Detail sections

Travel details show Philippines as origin, destination, dates, duration and traveller count. Coverage uses the shared benefit partial and provider/plan identity. Selected add-ons show name, limitation, amount and traveller basis. If none are selected, use the explicit “No add-ons selected” state.

Traveller cards display readable review facts. Keep labels aligned, long names and addresses wrapped, and sensitive examples fictional. Preserve the distinction between applicant, other travellers and beneficiaries where the source provides it.

Do not hide exclusion notes to shorten the page. A compact review is useful only if the user can still inspect the details that affect the decision.

## Layout and typography

Use `.travel-applicant-layout.travel-review-layout` and its existing responsive rules. Desktop pairs the detail column with the summary rail. Small layouts stack according to the shared CSS. The reference card must accommodate QR and actions without making the proposal number unreadably small.

Use shared 8px card corners, border tokens and appropriate charcoal dark surfaces. Summary headings use Insurance green in light and soft sage in dark. Numbers, premiums and references are visually stronger than labels; supporting text stays at the project's readable secondary size.

The floating trip summary is controlled by the existing observer. Ensure it does not obscure the page title, cancellation dialog or payment action. Use the same summary data as the main proposal.

## Actions and state behavior

| Action/state | Expected behavior |
| --- | --- |
| Copy number | Copies the current reference, reports success/failure in text |
| QR loading/failure | Placeholder or unavailable text; reference remains available |
| Disclosure toggle | Shared 260ms animation, both directions and reduced-motion support |
| Continue | Navigates to the existing Payment stage |
| Cancel | Opens the existing cancellation flow; confirm only through that flow |
| Print | Existing print preparation expands/restores relevant disclosures |
| Browser return | Existing proposal lock/expiry handling remains authoritative for this preview |

`travelApplicant` is reused with `data-review-page`. It may restore a valid saved session or populate fictional defaults on direct entry. A direct route visit is therefore a review demonstration, not evidence of a completed form submission.

## Print and responsive acceptance

Print uses the shared print rules and `preparePrint()`/`finishPrint()`. Keep key proposal data readable, remove developer controls and avoid printing transient overlays or duplicate floating bars. Restore screen disclosure state after printing.

Test long references, unavailable clipboard permission, QR loading/fallback, no add-ons, multiple travellers, cancellation and return to a locked proposal. Test print preview, mobile stacking and both themes. Check that the Developer current-guide download stays separate from the proposal document/print actions.

## Source map

- Page: `resources/views/mockups/travel-insurance/step-4.blade.php`.
- Review content: `partials/review-quote.blade.php`.
- Shared details: `coverage-benefits`, `selected-plan`, `trip-summary`, `cancel-proposal`.
- State: `resources/js/travel-applicant.js`; QR: `resources/js/proposal-qr.js`.
- Existing tests: `tests/Unit/TravelApplicant.test.js`, `ProposalQr.test.js`.

## Production decisions still required

Verify reference generation, quote validity and expiry, cancellation semantics, server-side immutability, authenticated retrieval, QR destination/access controls, premium breakdown and payment handoff. Session storage and client redirects are demonstration state management; a production lock must be enforced by the owning backend.


