Title: Live Content

Description: Fetched live

Source: https://developers.oneinsurance.shop/downloads/design/ui-theme

---

# One Insurance — UI theme design specification

Revision: 19 October 2026. Scope: the OI Developers UI reference and travel insurance mockups in this repository.

## 1. How to use this handoff

This is the shared visual and interaction specification. Read it with the design.md for the screen being implemented. The `/ui` reference is the live component reference; `resources/css/app.css`, `resources/views/ui/catalog.php`, `resources/views/ui/typography.php` and `resources/views/ui/palette.blade.php` are the implementation sources. Page guides identify their own templates, partials and state modules.

The documents describe the current mockups and state the expectations for extending them. They are not insurer policy wording, an API contract, a payment certification or evidence of live policy issuance. Benefits, prices, proposal numbers, policy numbers, personal details and PDFs in the previews are samples. Verify product rules and provider mappings with the owning system before production use.

Download: `/downloads/design/ui-theme` returns `ui-theme-design.md`. Each travel page exposes its own guide and all other guides through the Developer disclosure above the consumer header. Files are named by topic when downloaded so that multiple guides can coexist in a team's downloads folder; each source file is named `design.md` in its own directory.

## 2. Design intent

The interface should feel calm, legible and credible. Insurance green anchors navigation and the next action. Quiet neutral surfaces organize dense information without turning every fact into a separate card. Photography and illustration belong mainly to discovery pages; comparison, forms, proposal review and payment prioritize readable information.

Lead each screen with its purpose and one clear next action. Explain insurance in plain language. Keep benefit limits, exclusions and preview qualifications next to the relevant decision. Do not add fabricated reviews, customer counts, credentials, endorsements or urgency. The local insurance reference is `INSURANCE-DESIGN-PRINCIPLES.md`; its design recommendations are not product contracts.

## 3. Runtime and source boundaries

- PHP 8.4 and Laravel 13; installed Laravel at this revision: 13.37.0.
- Blade renders the pages. Tailwind CSS 4 is compiled through Vite 8. Alpine.js 3 supplies local interactive state.
- Initialize Alpine once in `resources/js/app.js`. Register feature state in its existing module; do not start another Alpine instance inside a partial.
- Preserve complete Tailwind utility names in scanned source. Do not add another CSS framework or replace shared controls for one screen.
- Fonts are loaded through `@fonts`; the default sans family is Inter with system fallbacks.
- Public mockup routes use `/mockups/travel/...`; the alternate discovery design is `/mockups/travel-insurance-2`.

## 4. Semantic color tokens

| Role | Light | Dark | Usage |
| --- | --- | --- | --- |
| Primary brand/action | `#006838` | `#006838` | Primary CTA fill; field focus in both themes |
| Primary hover | `#00552e` | `#00552e` | Hovered primary action |
| Primary pressed | `#004525` | `#004525` | Pressed primary action |
| Main text | `#183d2c` | `#f4f5f2` | Headings and primary text |
| Supporting text | `#333333` | `#c4c7c5` | Descriptions and labels |
| Muted text | `#808080` | `#b2b7b4` | Secondary metadata; check contrast at intended size |
| Page canvas | `#fcfdfb` | `#1c1e1e` | Documentation and results background |
| Card surface | `#ffffff` | `#262828` | Reference cards; journey overrides can use dark canvas |
| Subtle surface | `#f1f2f0` | `#303232` | Secondary sections, selections and nested content |
| Header/inset | `#ffffff` | `#171919` | Consumer header and inset surrounds |
| Divider/card border | `#dfe7df` | `#3d4140` | Structural boundaries |
| Field border | `#c7d4c9` | `#565c58` | Visible control outlines |
| Secondary button outline | `#006838` | `#707873` | Outlined action boundary |
| Collapsible heading | `#006838` | `#d0e3c8` | Plan, add-on and traveller summaries |
| Error | `#dc2626` | `#dc2626` | Invalid field border/outline |

Decorative palette: Leaf green `#559e45`, soft sage `#d0e3c8`, pale green `#e2eddb` and cream `#f7eee3`. Leaf green is not approved as a background for small white body text. Do not treat the swatch list as approval for every foreground/background pairing.

Journey pages set `--plan-surface`, `--plan-background`, `--plan-subtle`, `--plan-border`, `--plan-muted` and `--plan-accent` on `.travel-step-page`. Reuse these for journey-specific rules. Some surfaces vary by context; inspect the existing component rather than replacing every dark surface with one token.

## 5. Theme behavior

Dark mode uses the `.dark` class on the document element. Resolve saved `oi-ui-theme` before rendering the main interface, falling back to `prefers-color-scheme`. Theme controls update the document and stored preference. Storage failure must still allow an in-memory theme change.

Use `scheme-light dark:scheme-dark` to coordinate native controls. Supply the appropriate logo: `storage/img/logo-oi-light.png` on light surfaces and `logo-oi-dark.png` on dark/green surfaces. Keep the logo's intrinsic aspect ratio and meaningful alternative text.

Dark theme uses neutral charcoal layers; it is not a blanket green tint or CSS inversion. Primary actions keep Insurance green and white text. Collapsible headings become soft sage. Form focus remains Insurance green even where existing button focus treatments use white on dark surfaces.

## 6. Typography

Inter is the baseline. The `/ui` font selector can preview alternative families; that preference is a documentation experiment and does not redefine the production brand font. It is stored separately under `oi-developers-font-family-v2`.

Important: `app.css` aliases Tailwind's `text-sm` and `text-xs` to `--text-secondary: 1rem` with a 1.5 line height. These utility names therefore render as 16px at the normal root size, not Tailwind's usual 14px/12px. Explicit arbitrary sizes and custom CSS may differ. Do not reduce labels simply because a utility is named “xs.”

| Use | Current pattern | Guidance |
| --- | --- | --- |
| Discovery hero | Fluid 2.75–4.5rem; 1.08 line height | Keep intended short line breaks; balance against art |
| Page title | `text-3xl sm:text-4xl`, semibold, tight tracking | One main heading per screen |
| Major section | `text-xl` to `text-3xl`, semibold/bold | Match the sibling section hierarchy |
| Card heading | `text-lg` / `text-xl`, semibold | Clear separation from labels |
| Body | `text-base leading-7` or `leading-8` | Comfortable reading measure |
| Supporting copy | Secondary 1rem, `leading-6` / `leading-7` | Maintain readability and wrapping |
| Codes/references | Mono where appropriate, selectable | Wrap long references without truncating identifiers |

Use sentence case. Reserve uppercase tracking for short eyebrow labels. Avoid dense all-caps paragraphs. Amounts should keep currency and value understandable together, with a clear total label and a separate explanation of the traveller basis.

## 7. Layout, spacing and responsive behavior

Reference spacing increments are 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64 and 80px. Use component-specific values already present before introducing new spacing. Card corners are usually 6–8px. Cards use modest borders; decorative landing imagery can have softer shapes.

- Documentation shell: maximum 1600px; navigation sidebar 240px, then 256px at xl; optional 200px contents rail. Main reading column is constrained within the central area.
- Standard travel shell: `max-w-7xl` (1280px). Alternate discovery shell: `max-w-6xl` (1152px).
- Horizontal page padding commonly starts at 20px and becomes 32px at sm. Results use 48px top and 80px bottom padding at desktop, with smaller-screen overrides.
- Plan selection: a 248px filter rail, a flexible result column and 32px gap at desktop. The filter behavior changes around 900px.
- Applicant/review layout: flexible content and 340px summary rail, with 28px gap; collapse to one column around 900px. The selected plan moves ahead of forms on small layouts.
- Typical applicant cards use 28px padding and 8px radius, reducing to 20px on the smallest layouts.
- Tailwind breakpoints remain sm 640, md 768, lg 1024, xl 1280 and 2xl 1536px. Existing custom journey rules also use 540, 900 and 1100px; do not assume all transitions occur at Tailwind breakpoints.

Use flexible widths, `min-width: 0`, wrapping reference strings and logical reading order. Comparison grids may need a local scroll area; never make the whole page scroll sideways. Test at 390px mobile and a 1366×768 laptop, with nearby breakpoint widths when changing responsive rules.

## 8. Buttons and links

Three levels establish action hierarchy:

1. Primary: Insurance green fill, white semibold text, 6px radius; hover `#00552e`, pressed `#004525`.
2. Secondary: green border/text on light; readable neutral outline and soft white text on dark. Subtle fill on hover.
3. Tertiary: borderless, green text on light and readable light text on dark; subtle hover/pressed fill.

All sizes keep at least a 44px target. Default horizontal padding is 20px, compact 12px and large 24px; large actions can use 48px minimum height. Action groups use 12px gaps and stack full-width on mobile before sitting in a row at sm. Use links for navigation/downloads and buttons for local actions. Disabled controls show reduced opacity and a not-allowed cursor; use actual disabled semantics.

Focus must remain visible. The UI catalog demonstrates 2px outlines with appropriate offsets for actions. Do not remove an outline without a replacement. New developer download links follow the same 44px target and green focus treatment.

## 9. Fields and validation

The `.ui-form-field` class is required for shared text, date, select and similar fields. Use a 44px minimum height, full available width, 6px corner radius, 12px horizontal padding and 8px vertical padding. Place labels above, normally with an 8px label-to-control gap. Light fields use white fill; dark fields use the appropriate charcoal surface.

Normal borders are `#c7d4c9` light and `#565c58` dark. Placeholder text is `#808080` light and `#b2b7b4` dark. Focus applies a `#006838` border and 2px `#006838` outline with zero offset in both themes. Do not override this with white or browser-default field focus, and do not apply a page-level offset to text fields.

`aria-invalid="true"` changes both border and focus outline to `#dc2626`. Describe the problem in text; do not rely on red alone. Associate messages with the field where possible, retain entered values and focus the relevant error or error summary after an unsuccessful action. Required/optional labels must match actual validation.

Use native input types and autocomplete attributes where appropriate. Group related choices in fieldsets with legends. Checkbox and radio accents use Insurance green. Preview validation is local feedback; production endpoints must validate and authorize independently. Do not infer provider eligibility from a front-end date rule.

## 10. Navigation and progress

The developer strip is outside the consumer header. It links back to `/ui`, provides the current Markdown download, and includes a Developer disclosure containing theme and journey guides. It is excluded from print. Keep it visibly separate from product purchase navigation.

Consumer headers use a responsive logo, descriptive section navigation, product selector, quote action and theme control. Sticky behavior and proposal-mode variants are supplied by the existing header partial. Small-screen menus must expose expanded state and preserve keyboard use.

Quote progress has five named stages: Trip details → Choose a plan → Generate quote → Review quote → Payment. Current stages use `aria-current="step"`; completed markers use checks. A completed stage should only act as an edit shortcut where the current flow permits editing. Generated proposals are locked in the preview and require cancellation to restart.

## 11. Cards, disclosures and motion

Use a card to group a coherent task, not every individual label. Plan cards separate product identity, key benefits, total premium and the selection action. Applicant cards group each traveller's related details. Summary rails retain context without competing with the main task.

Collapsible headings use Insurance green in light and soft sage in dark. Reuse the shared heading treatments for plan details, add-ons and travellers. Prefer semantic `details`/`summary` for disclosures. `initializeCollapsibles()` in `resources/js/travel-faqs.js` enhances all details, including newly inserted ones, with 260ms height animation using `cubic-bezier(0.2, 0, 0, 1)`.

Both opening and closing animate. Repeated toggles cancel the previous animation and resolve to the requested state. With `prefers-reduced-motion: reduce`, native immediate changes apply. New disclosures, including Developer, must reuse this implementation. Conditional Alpine panels generally use the existing 240ms transition conventions and shared reduced-motion CSS.

Decorative hero movement and the scroll-driven journey timeline are supplementary. The timeline uses `travel-journey.js`; reduced motion reveals content without requiring scrolling animation. Content and controls must remain understandable without animation.

## 12. Dialogs, loading and feedback

Use the native dialog patterns already present: a named heading, meaningful close button, initial focus, Escape support and appropriate return focus. Use existing modal styling rather than stacking arbitrary high z-index layers. Keep long dialog content scrollable on small screens.

Skeletons preserve the target layout and reserve the space of meaningful content. Pair them with an accessible loading status and `aria-busy` where used. Skeletons are not evidence of a network integration. Payment preview uses a local three-second skeleton timer. Preserve error, empty and unavailable states instead of leaving an indefinite spinner.

Use polite status regions for copy feedback and nonurgent updates. Errors must be visible and actionable. A success icon does not replace explicit text. A preview saying “paid” must remain qualified as sample data until a verified backend event exists.

## 13. Imagery, icons and logos

Reuse the current One Insurance logo assets, shared icon components and travel assets under `public/images/mockups/travel-insurance`. Maintain image aspect ratios, declared dimensions and suitable object-fit. The standard hero uses `storage/img/abstract-timekeeper.svg` behind the traveller art and soft organic forms; the alternate hero uses a green field and airplane-window traveller image.

Decorative icons have empty alternative text or are hidden from assistive technology. Meaningful images describe their purpose. Do not place essential text only inside artwork. Keep provider/payment logos proportional and label their choices accessibly. Displaying a provider logo in a sample is not proof of an integration or endorsement.

Use lazy loading below the fold and appropriate priority for the hero. Do not stretch hero images, substitute generic emoji for the established icon family, or invert photographs for dark mode.

## 14. Data, copy and production handoff

Use fictional data and `example.com` addresses for walkthroughs. Do not enter real IDs or upload real identity documents into the mockups. Applicant state can be kept in session storage for preview continuity; production privacy, retention, authentication and encrypted storage need a separate design.

Keep money presentation consistent with the PHP examples shown. Sample amounts do not constitute prices offered by insurers. Production totals, taxes, currency, add-on multiplication, rounding and availability must come from the owning contract and server-side calculation.

Review consent and policy wording with the owning team. Do not promote draft agreement copy to approved legal text. Real payment confirmation, proposal expiry/cancellation, insurer issuance, email delivery, claims support and document access require verified server behavior; front-end state changes alone must never grant cover.

## 15. Acceptance and QA

- Compare modified fields, buttons and state treatments against `/ui`, in light and dark themes.
- Confirm semantic headings, skip link, labels, meaningful link text, keyboard traversal and visible focus.
- Check 44px targets, long labels, long references, zoom and readable error messages.
- Check 390px mobile, a small laptop and relevant breakpoint boundaries; sticky/floating bars must not cover actions.
- Toggle every changed disclosure repeatedly, using keyboard and pointer. Check closing as well as opening and repeat with reduced motion.
- Exercise loading, empty, failure and success states relevant to the change; do not use a skeleton to hide an unavailable integration.
- Download the theme and the screen guide from Developer. Confirm Markdown attachment content, a descriptive filename and a working response. Unknown download identifiers must return 404.
- Run relevant Laravel feature tests with PHP 8.4, Pint checks and `npm.cmd run build` after frontend changes. Use existing JS unit tests for changed interaction modules.

This checklist is the team's acceptance guidance. It does not claim every screen or state has been visually verified on every browser.

## 16. Maintenance map

| Concern | Source |
| --- | --- |
| Palette and examples | `resources/views/ui/palette.blade.php`, `catalog.php`, `typography.php` |
| Shared CSS, tokens and responsive rules | `resources/css/app.css` |
| Registration, docs behavior and theme | `resources/js/app.js` |
| Shared disclosure motion | `resources/js/travel-faqs.js` |
| Consumer header/footer | `resources/views/mockups/travel-insurance/partials/header.blade.php`, `footer.blade.php` |
| Download UI | `resources/views/components/design-downloads.blade.php` |
| Allowlisted Markdown downloads | `app/Http/Controllers/DesignDocumentController.php`, `routes/web.php` |
| Page guides | `resources/views/mockups/travel-insurance/documents/<page>/design.md` |

Update the affected guide when layout, validation, interaction or product status changes. Recheck the owning system before marking any sample behavior as implemented production functionality.


