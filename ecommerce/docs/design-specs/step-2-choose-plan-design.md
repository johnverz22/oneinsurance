Title: Live Content

Description: Fetched live

Source: https://developers.oneinsurance.shop/downloads/design/step-2

---

# Travel insurance — Step 2: Choose a plan

Revision: 19 October 2026. Page: `/mockups/travel/step-2`. Download: `/downloads/design/step-2` → `step-2-design.md`.

## Goal and preview boundary

Help the traveller compare a manageable set of plans, inspect benefits and choose a plan for the next stage. The page renders a sample catalogue, not live provider quotes. Provider names, logos, prices, benefit limits and displayed matching counts are demonstration data.

Read `/downloads/design/ui-theme` for all common tokens and interaction rules. This guide specifies comparison architecture and state behavior. A chosen plan becomes input to Generate quote; selection itself neither creates a policy nor guarantees availability.

## Entry and exit

Entry comes from either discovery form or directly from this route. `travelMockup` owns shared trip state and `travelPlans` owns the results interaction. The Choose this plan action sends the chosen plan and trip preview to Step 3 through the existing URL handoff. Use `choosePlan()` rather than rebuilding that serialization in the template.

The progress navigation marks Trip details complete and Choose a plan current. The completed trip control opens Modify search. Keep the five labels identical across all numbered stages.

## Information hierarchy

1. Developer area, then consumer header and quote progress.
2. Loading skeleton with an accessible loading message.
3. Eyebrow, “Find the cover for your journey.”, supporting copy and sample match count.
4. Trip summary with modification action.
5. Desktop filter rail and flexible results column.
6. Search and List/Compare controls.
7. Optional comparison view and the plan list.
8. Empty result feedback, plan details and relevant dialogs.

Plan information should be comparable at a glance: provider, plan name, key benefit amounts, premium, traveller basis and selection action. Keep qualifying text close to the fact it qualifies.

## Layout and styling

The results container is 1280px maximum. At desktop, `.travel-results__layout` uses a 248px filter rail and a flexible result column with 32px gap. Around 900px, use the existing filter toggle and responsive rules. Do not force the entire comparison table into a tiny mobile width by reducing text.

Plan cards use coherent summary regions rather than nested cards for every benefit. Keep provider logos proportional. Premium is stronger than secondary labels; use the same currency formatting consistently. The sample list's “Total for 1 traveller” wording is part of the mockup and requires reconciliation with real group pricing before production.

The current progress marker uses green fill and white text, completed markers use checks and the shared subtle surface. Expandable plan headings follow green light/soft sage dark styling. Fields, search and buttons must match `/ui` focus, border and target rules.

## Filters and comparison

| Control | Preview behavior |
| --- | --- |
| Sort | Best match, Lowest price, Highest medical coverage |
| Provider | Single selected provider from the sample list |
| Coverages | Multiple coverage criteria |
| Search | Filters the displayed plans with a readable empty outcome |
| Reset | Restores filter defaults |
| List/Compare | Pressed state communicates the active view |
| Compare selection | Up to three plans; removal updates the count and grid |
| Plan detail | Expand/collapse benefits without losing the selection action |

Use real labels and fieldsets. Search must not require understanding an icon alone. Changes should keep count feedback consistent with the visible results. Avoid adding simulated remote latency to filtering; the initial loading state is already a local preview.

## Critical states

- Initial loading: preserve the results layout with the existing skeleton and status text.
- Loaded list: sample count and visible cards agree.
- No matches: provide a useful reset path rather than an empty area.
- Compare empty: explain how to select plans.
- Compare populated: up to three plans, remove actions labelled by plan.
- Expanded benefits: closing and repeated toggles finish cleanly; content is not clipped.
- Modify search: shared quote form opens in the dialog and updates trip context coherently.
- Plan selection: selected identifier and trip are passed to the existing Step 3 route.

The Pacific Cross secure-site note is sample UI wording. Do not treat it as proof that an external provider redirect is implemented. Check the actual `choosePlan()` behavior and provider integration contract before changing navigation.

## Accessibility and responsive acceptance

Keep filter labels operable, current-step semantics explicit and List/Compare expressed through `aria-pressed`. Comparison order should match selected plans. Long benefit names and currency values must remain readable. Use local overflow for wide comparison content when required.

Test keyboard search and filtering, selecting/removing three comparisons, reset, zero matches, details toggling and Modify search. Repeat in dark mode, reduced motion and at widths around the filter breakpoint. Confirm the Developer links work in both loading and loaded states.

## Source map and production handoff

- Page: `resources/views/mockups/travel-insurance/step-2.blade.php`.
- State and sample catalogue: `resources/js/travel-plans.js`.
- Shared trip behavior: `resources/js/travel-mockup.js`.
- Partials: `trip-summary`, `quote-form`, `plans-skeleton`, header and footer.
- CSS: `.travel-results`, `.travel-filters`, `.travel-plan-*` and comparison rules in `app.css`.
- Existing interaction tests: `tests/Unit/TravelPlans.test.js` and `TravelMockup.test.js`.

Production needs verified product identifiers, benefit mapping, eligibility, rate validity, currency/rounding, total basis and external-provider navigation. Do not extend sample filter strings into an assumed provider API contract.


