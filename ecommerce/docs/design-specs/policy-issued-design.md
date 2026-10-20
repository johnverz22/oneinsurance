Title: Live Content

Description: Fetched live

Source: https://developers.oneinsurance.shop/downloads/design/policy-issued

---

# Travel insurance — Policy issued and document access

Revision: 19 October 2026. Page: `/mockups/travel/policy-issued`. Download: `/downloads/design/policy-issued` → `policy-issued-design.md`.

## Purpose and status

Give a traveller one readable place to find the policy/payment references, inspect coverage, switch to the acknowledgement receipt and save sample documents. The page uses a fictional JSON policy and two real downloadable sample PDF assets. It does not prove payment, insurer issuance or email delivery.

Use `/downloads/design/ui-theme` for common typography, surfaces, focus and motion. Keep the explicit fictional-policy and sample-PDF qualifications. This screen is the terminal visual concept after issuance, not a numbered form stage.

## Information architecture

1. Developer strip and proposal/issuance-mode header.
2. Confirmation region: document/check icon, “Payment complete · Policy issued”, “Your journey is covered.” and explanatory copy.
3. Email note showing the fictional applicant address.
4. Three reference blocks: policy number, proposal number and payment reference, each with Copy.
5. Main document card with document switch and coverage/receipt content.
6. Sidebar with trip route, dates, duration, travellers, insurer and paid total.
7. Before you travel guidance and Buy new travel insurance link.
8. Footer.

Make document access the main task. Reference blocks should be easy to select/copy, with long codes wrapped instead of ellipsized. The next-purchase link is secondary to saving and understanding the existing documents.

## Document switch

The grouped buttons are “Coverage & benefits” and “Acknowledgement receipt”. The selected button exposes `aria-pressed`; both point to their controlled section. `travelIssued` owns the document state and copy feedback. Coverage is the initial view.

Use the existing 240ms opacity transitions with shared reduced-motion behavior. Only the relevant section should be presented as active; headings remain semantic. Do not replace these buttons with navigation links that reload and lose page context unless a separately approved route design requires it.

## Coverage view

The coverage section presents plan/provider/travel type, recipient, coverage period, destination and traveller summary. Benefits are grouped in open disclosures. Each row pairs a readable benefit name with its limit and any note. State that amounts use Philippine pesos unless stated otherwise and that conditions/exclusions apply.

Keep long notes beneath their associated benefit rather than in a detached footnote. Group headings must follow the shared green light/soft sage dark rule. Benefits come from the JSON fixture and are not verified insurer mappings.

The action downloads a coverage summary PDF. The interface explicitly says that the official eCOC is delivered by email; the downloadable summary must not be relabelled as an official eCOC. The insurer's official wording governs cover, as the on-page note explains.

## Receipt view

The receipt shows its sample receipt number, Paid label, payer, date, method, payment reference, policy number and currency. A premium line and total amount received create a conventional receipt hierarchy. Keep currency, amount and premium description together and wrap long references safely.

The acknowledgement records payment in the visual story; it does not replace an insurer invoice or eCOC. Retain the explicit note that no payment has been collected in this preview. Do not imply tax-invoice status or invent tax breakdowns.

## Downloads and copy behavior

| Action | Route/behavior |
| --- | --- |
| Coverage PDF | `/mockups/travel/policy-issued/documents/coverage-summary` |
| Receipt PDF | `/mockups/travel/policy-issued/documents/acknowledgement-receipt` |
| Copy reference | Copies the chosen reference with labelled success/failure feedback |
| Current design guide | `/downloads/design/policy-issued` |
| New insurance | Existing primary landing-page route |

`IssuedPolicyPreviewController` allowlists the two PDF identifiers and returns attachment responses. The design guide is served by a separate allowlisted Markdown controller. Keep these developer handoff files visibly separate from customer policy documents.

Clipboard access can be unavailable. Report failure in the existing polite status region and keep the reference selectable so the user can copy manually. Do not show a success message before the clipboard operation resolves.

## Layout and visual specification

Use `.issued-confirmation`, `.issued-references`, `.issued-layout`, `.issued-documents` and `.issued-sidebar` rather than rebuilding the screen with generic nested cards. The confirmation title is `text-3xl sm:text-4xl`, semibold. The document switch has a clear selected state and readable labels at narrow widths.

The main document column carries detailed facts and benefits. The sidebar summarizes the trip and paid premium without duplicating every benefit. Mobile stacks these regions and wraps route/reference content; no action should disappear beyond the viewport. Use the current CSS breakpoints and inspect nearby widths before changing them.

Dark mode uses neutral charcoal layers, shared borders and soft-white text. Keep badges distinct from buttons. The main PDF download uses Insurance green and a full-width target where currently specified. Secondary purchase navigation should not compete with it.

## Data and source map

- Page: `resources/views/mockups/travel-insurance/policy-issued.blade.php`.
- Fixture: `resources/views/mockups/travel-insurance/issued-policy.json`.
- PDFs: `resources/views/mockups/travel-insurance/documents/coverage-summary.pdf` and `acknowledgement-receipt.pdf`.
- Controller: `app/Http/Controllers/IssuedPolicyPreviewController.php`.
- Local interaction: `resources/js/travel-issued.js`.
- Existing checks: `tests/Feature/IssuedPolicyPreviewTest.php`, `tests/Unit/TravelIssued.test.js`.

The fixture is independent from the preceding applicant form. Do not promise that submitted applicant details become the issued JSON policy. That continuity needs a real policy retrieval contract.

## Acceptance and production gaps

Verify both document views, every benefit group, repeated disclosure toggles, copy success/failure, long references, both PDF attachments and return to the landing page. Inspect mobile/dark/reduced-motion behavior and confirm sample qualifications remain visible beside downloads.

Production needs authenticated policy ownership, verified issuance/payment data, secure document retrieval, retention/access rules and confirmed email/support behavior. The current public fixture and public sample PDFs are suitable for a mockup; they must not become a pattern for exposing real policyholder records.


