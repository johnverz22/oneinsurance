Title: Live Content

Description: Fetched live

Source: https://developers.oneinsurance.shop/downloads/design/landing-page

---

# Travel insurance — Landing page and trip details

Revision: 19 October 2026. Page: `/mockups/travel/landing-page`. Download: `/downloads/design/landing-page` → `landing-page-design.md`.

## Purpose and status

Introduce travel insurance, explain the journey and collect only the trip information needed to begin comparison. This is the primary discovery design and the first stage of the five-stage quote flow. The quote form and navigation are interactive previews; product availability, eligibility and insurance cover are not verified by this page.

Read the shared UI theme guide at `/downloads/design/ui-theme` first. Its typography, green field focus, dark palette, target sizes and motion rules apply here. Do not interpret marketing copy, provider names or sample benefits as contractual promises.

## Screen structure and reading order

1. Developer strip: return to the reference, download this guide, expand Developer for all guides.
2. Consumer header: One Insurance logo, Coverage, How it works, FAQs, product dropdown, Get a quote and theme control.
3. Hero: “Enjoy every part of your journey.” Short supporting copy and traveller illustration sit over the abstract timekeeper background and soft green/cream forms.
4. Coverage introduction: four readable benefit areas—medical emergencies, trip disruptions, baggage concerns and personal accident—with conditional language.
5. Trip search: a prominent form that starts comparison rather than requesting full identity information immediately.
6. Supporting explanation and the How it works timeline: a simple progression through quote and purchase concepts.
7. FAQs and preview terms: plain-language answers and limitations.
8. Footer and local help/retrieval dialogs.

Preserve the actual template order when extending this page. Section navigation should lead to the corresponding in-page anchor and leave headings visible below sticky navigation.

## Composition and visual specification

The standard travel shell is 1280px maximum, with responsive gutters. The hero uses `.travel-one-hero` and its child classes in `app.css`; its title scales from 2.75rem to 4.5rem with a 1.08 line height. Keep the intentional short line breaks and generous negative space. The illustration supports the message and must not cover copy, navigation or form controls.

The hero background is `#fcfdfb`, with `#171919` in dark mode and a quieter abstract background. Decorative shapes become muted green/brown in dark mode. Avoid adding dense badges, extra competing CTAs or benefit fine print on top of the hero artwork. Below-fold sections use the shared neutral palette and restrained borders.

Use the existing responsive CSS rather than assigning a fixed hero height. On mobile, retain a readable sequence of copy, art and form. On a small laptop, the purpose and quote action should be immediately discoverable. Large imagery should have explicit dimensions; use the existing assets rather than substituting a different visual style.

## Trip input contract in the preview

The shared `partials/quote-form.blade.php` collects trip type, coverage type, domestic/international destination, dates and traveller information. International travel uses the country choice; domestic travel resolves to Philippines. Single and annual choices are UI options, not a verified provider eligibility contract.

Traveller controls summarize adults and children. At least one adult is required, counts cannot be negative, and the preview allows at most nine travellers. Opening the popover moves focus to an enabled control; closing can return focus to its trigger. Keep the summary text updated when counts change.

Local checks reject a past departure, a return before departure and a birth date that is not before today. The page derives “today” in the browser. These rules are preview feedback, not production underwriting rules. Keep labels, required indicators and the visible terms acknowledgement aligned with the form's actual checks.

`previewTrip()` in `travel-mockup.js` prepares the trip preview and navigates to Step 2. Inspect that module and the quote-form partial before adding inputs; do not create parallel state with different destination or date semantics.

## Interaction states

| Element | Expected treatment |
| --- | --- |
| Quote form | Normal, focus, incomplete and invalid states; entered values remain readable |
| Traveller popover | Open/closed, enabled/disabled count buttons and keyboard focus return |
| Mobile menu/product choice | Clear expanded state and smooth opening/closing |
| FAQs | Native disclosure semantics enhanced by the shared 260ms motion |
| Theme switch | Persists `oi-ui-theme`; Insurance green field focus in both themes |
| Retrieval | Local dialog feedback; do not imply a live proposal lookup |
| How it works | Scroll enhancement is optional; content remains visible with reduced motion |

Avoid screen-reader announcements for every decorative movement. Submission errors should be in text and receive focus using the existing error reference.

## Content and trust requirements

Coverage descriptions explain what a plan may include, then direct users to limits, exclusions and wording. FAQs cover trip types, domestic air travel, COVID-19, pre-existing conditions, activities, cancellation versus interruption, baggage, assistance and retrieving proposals. Retain provider-dependent qualifications beside these statements.

Do not invent claims contact details or imply every plan includes the same benefits. The reference's air-travel statement and nine-traveller cap are mockup copy/rules requiring owner verification before live publication. Do not convert them into an undocumented universal insurance rule.

## Source map

- Page: `resources/views/mockups/travel-insurance/landing-page.blade.php`.
- Shared form/dialogs: `partials/quote-form.blade.php`, `partials/dialogs.blade.php`.
- Header, product dropdown and footer: sibling partials under the same directory.
- State: `resources/js/travel-mockup.js`.
- Timeline: `resources/js/travel-journey.js`; disclosures: `resources/js/travel-faqs.js`.
- Visual rules: `resources/css/app.css`, especially `.travel-one-hero` and journey rules.

## Handoff acceptance

Check light/dark at mobile and small-laptop sizes. Verify section anchors, quote CTA, theme persistence, traveller limits, domestic/international switching, valid and invalid dates, terms feedback and navigation into Step 2. Exercise keyboard-only popover/dialog operation and repeated FAQ toggles, then reduced motion. Confirm the Developer disclosure downloads this guide and the theme guide without affecting form state.

Use fictional data. A completed form is not proof that a quote was stored, a provider was queried, payment was collected or cover exists. Production search responses, rate freshness, server validation and approved product wording remain integration work.


