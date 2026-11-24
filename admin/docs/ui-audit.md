# Admin portal UI audit — `admin` vs mockups

Repo: `johnverz22/oneinsurance` (branch `main`, commit `7994ca0`), app: `admin/`
Mockups: `developers.oneinsurance.shop/mockups/admin/*` (dashboard, products, agents, transactions, transaction details, commissions, payments, reports) + login + error pages.
Audit date: 24 Nov 2026

## 0. Method, baseline and confidence

The mockup pages render in an iframe, so computed CSS was **not** readable. The baseline is, in priority order:

1. **`agent/` implementation** (already adapted to its mockup; the only intentional admin variation is sidebar colour).
2. The mockup `design.md` handoffs: `ui-theme` (rev. 20 Nov 2026), `admin-*`, `agent-settings`, `portal-login`, `error-404`, `error-500`.
3. Root `AGENTS.md` "Agent Portal Design Tokens (QA-spec)".

Each finding is tagged:
- **[A]** verified by diffing `admin` against `agent` code.
- **[G]** stated in a mockup `design.md`.
- **[V]** needs a visual check against the live mockup before changing.

Priority: **P0** visibly wrong or broken, **P1** spec deviation, **P2** polish.

### Decisions needed before fixing

| # | Conflict | Recommendation |
|---|---|---|
| D1 | `ui-theme` lists border `#e5e5e5`, supporting text `#707070`, portal canvas `#fcfdfb`. `agent` uses `#dfe7df`, `#5b6e61`, `#f7f7f7`. | Follow `agent`. Re-check against a rendered mockup. |
| D2 | **Two dark card surfaces.** `ui-theme` §11: summary/regular cards (modals, settings, detail cards) use `#262828`; portal page cards and tables use inset `#171919`. `agent` sets `--card` dark to `#171919`. `agent-cases-client.tsx` `SummaryCard` uses `--card`. | Do **not** blindly change `--card` dark to `#171919`. Add `--card-summary: #262828` for summary/regular/modal cards and set `--card` to `#171919` for page cards and tables. |
| D3 | Top-bar icon rest colour: `admin` uses `.ui-action-icon` (green at rest). `agent` uses `agent-dashboard__header-action` (`--text-sub` at rest, green on hover). `ui-theme` §8 says top-bar controls use `.ui-action-icon`. | Keep `admin` as is unless the admin mockup shows grey. [V] |
| D4 | Placeholder colour: `ui-theme` `#878787`; `agent` `--text-muted` `#a9a9a9`; `admin` `ui-classes` `#9bb09f`. | Use `--text-muted`. |

---

## 1. Design tokens

### 1.1 `globals.css` `@theme` / `:root` / `.dark` [A] — [x] DONE

| Token | admin now | Target | Pri | Status |
|---|---|---|---|---|
| `--text-sub` (light) | `#707070` | `#5b6e61` | P1 | [x] Done |
| `--text-main` (dark) | `#ffffff` | `#f4f5f2` | P1 | [x] Done |
| `--text-sub` (dark) | `#c4c7c5` | `#b2b7b4` | P1 | [x] Done |
| `--color-text-*` mirrors of the above in `@theme` | same | same | P1 | [x] Done |
| `--card` (dark) | `#262828` | `#171919` for page cards/tables (see D2) | P1 | [x] Done |
| `--canvas` (dark) | `#1c1e1e` | `#282c29` | P1 | [x] Done |
| `.skeleton` bg | `var(--subtle)` | `#e6ece6` light, `#3d4140` dark | P2 | [x] Done |
| header comment | "One Insurance Agent Portal" | rename to Admin Portal | P2 | [x] Done |

Unchanged and correct: `--primary #006838`, hover `#00552e`, pressed `#004525`, `--portal-canvas #f7f7f7 / #171919`, `--subtle #f1f2f0 / #303232`, `--border #dfe7df / #3d4140`, `--field-border #c7d4c9 / #565c58`, `--text-muted #a9a9a9 / #767776`, `--color-error #dc2626`.

### 1.2 Missing shared classes (exist in `agent/globals.css`, absent in `admin`) [A] — [x] DONE

- [x] `.portal-metric-value`: 24px/32px below 640px, 30px/36px from 640px. **P1**
- [x] `.portal-data-table`: `thead` uses `--subtle` (dark `#303232`); `th[scope=col]` 14px / 20px, no uppercase, normal tracking. **P1**
- [x] `.agent-dashboard__panel`, `.agent-dashboard__metric*`: dashboard card surfaces. **P1**
- [x] `.agent-dashboard__content` thin scrollbars (thumb `#afc3b3`, dark `#586e5e`, 8px, 2px border) on canvas and sidebar. **P2**
- [x] `.dark .agent-dashboard__action:hover > span:first-child` pale-gold `#f8efd8` icon bg is missing (the light rule exists). `agent` also uses `!important` on hover border/background. **P1**
- [x] `.portal-table-filters__form > details` rule (agent-only). **P2**

### 1.3 Off-palette hex colours (used in `admin`, never in `agent`) [A] — [x] DONE

Keep (admin sidebar variation): `#a67f20`, `#d6bd7d`, `#805c0c`, `#fff8e8`, `#183d2c`.

Replace:

| Hex | Where | Replace with | Status |
|---|---|---|---|
| `#e8f3e9` | `mobile-nav.tsx` active pill | `#d0e3c8` | [x] Done |
| `#b91c1c`, `#eba3a3`, `#fecaca`, `#fca5a5` | error text in `data-table`, profile, detail, providers | Failure red `#991b1b` (light); dark: define one token | [x] Done |
| `bg-red-600/700/800` | `ui-classes` `btnDangerCls`, `modal.tsx` | `#991b1b` family | [x] Done |
| `#262828` | `pill-tabs.tsx` | `--card` / `#171919` | [x] Done |
| `#1e2120` | `modal.tsx` ConfirmDialog | `--card-summary` | [x] Done |
| `#1c1e1e` | `ui-classes` `fieldCls`, `search-input.tsx` dark bg | `--card` (agent top-bar search uses `#303530`) | [x] Done |
| `#9bb09f` | `fieldCls` placeholder | `--text-muted` | [x] Done |
| `#eef4ec`, `#243329` | top-bar avatar, settings avatar | `#eff6ef` / `#38483b` (the pair the dashboard already uses) | [x] Done |
| `#202422`, `#222725`, `#2d4433`, `#f3f6f2`, `#eaf4e9`, `#fbfdfb`, `#151d18`, `#8a6a1c`, `#9fd4ae`, `#bddac0`, `#00441f` | detail, profile, tabs, providers, modal | map to existing `agent` tokens (`#eff6ef`, `#e6f2e8`, `#38483b`, `#3d5242`, `#d0e3c8`, `#006838`) | [x] Done |

---

## 2. Shell (`components/layout/*`)

Both apps share geometry. Verified identical [A]: sidebar 232/76px, top bar `min-h-72px` with 1px border, outer frame `#e9ece9`/`#141716`, nav item min-height 44px, active edge bar 3px (`-left-5` / `-left-3`), edge toggle 44×44 with 18×24 tab, canvas padding on desktop (20 top / 22 H / 30 bottom) and from 640px (28 top / 24 H), max width 1280px, popover `shadow 0 20px 50px rgba(24,61,44,.12)`, bottom-nav border `#dce6dd`.

| # | Finding | File | Target | Pri | Status |
|---|---|---|---|---|---|
| S1 | Shell uses hardcoded Tailwind hex instead of the shared `agent-dashboard__*` classes (`shell`, `sidebar`, `nav-item`, `header`, `content`, `popover`, `bottom-item`). `AGENTS.md` says shell CSS should stay in sync with the mockup. | `portal-layout/sidebar/top-bar/mobile-nav` | Port the agent classes to `admin/globals.css`; keep admin colours as overrides (`.portal-sidebar--admin`). | P1 | |
| S2 | Phone canvas padding: bottom `pb-7` (28px); phone spec is 24 top / 16 H / 24 bottom. | `portal-layout.tsx` | `pb-6` on phone | P2 | |
| S3 | Sidebar nav icons use default stroke (2). Spec: 20px outline, `strokeWidth=1.5`. | `portal-sidebar.tsx` | add `strokeWidth={1.5}` | P2 [V] | |
| S4 | Mobile nav shows icons only (label is `sr-only`). Agent shows a visible label (`text-xs sm:text-sm font-semibold`) with 18px/20px icon, stroke 1.5. | `mobile-nav.tsx` | Visible label; admin mockup nav set [V] | P1 | [x] Done |
| S5 | Mobile nav active pill `#e8f3e9` + `--text-sub`; dark active text `#d0e3c8`. Target: light `#d0e3c8` bg + `#006838` text; dark `#006838` bg + white text. Inactive light `#526858`, dark `#808482`. | `mobile-nav.tsx` | per `.agent-dashboard__bottom-item` | P1 | [x] Done |
| S6 | Top-bar horizontal padding `px-5 sm:px-6 lg:pl-11`; agent CSS is `padding-inline: 10px`, `lg: padding-left: 44px`. | `portal-top-bar.tsx` | verify `px-5/6` is intended | P2 [V] | |
| S7 | Notifications popover body `text-sm leading-5`; agent uses `text-base leading-6`. | `portal-top-bar.tsx` | 16px / 24px | P2 | [x] Done |
| S8 | Mobile menu popover item colours/typography are inline hex. | `portal-top-bar.tsx` | shared popover/nav classes | P2 | |
| S9 | Logo asset path split: sidebar uses `/images/logo-unosure-dark.png`; auth layout uses `/storage/img/logo-unosure-dark.png`. | see §6 | | **P0** | [x] Done |

---

## 3. Page header (`portal-content-header.tsx`) [A]

| Property | admin | agent (target) | Pri |
|---|---|---|---|
| Row alignment/gap | `items-start gap-4` | `items-end justify-between gap-5` | P1 |
| Title + subtitle grouping | separate blocks | both inside `<div class="min-w-0">` | P1 |
| Subtitle | `text-sm leading-6 text-[--text-muted] sm:text-base`, `max-w-2xl`, wrapper `mt-2 mb-6` | `mt-2 text-sm leading-6 text-[--text-sub] sm:text-base` (16px desktop, 8px under title), no `max-w` | P1 |
| Breadcrumbs | below title in subtitle block | above title, `mb-2` | P1 |
| `searchSlot` prop | present | not in agent; top bar owns search | P2 |

Title is correct: `mt-2 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl`.

Also remove the redundant `<div className="mx-auto w-full max-w-7xl">` wrapper inside every page client (dashboard, agents, products, transactions, detail, coming-soon). `PortalLayout` already centres at 1280px. **P2**

---

## 4. Shared components

### 4.1 Tables (`lib/ui-classes.ts`, `ui/data-table.tsx`)

| # | Finding | Target | Pri | Status |
|---|---|---|---|---|
| T1 | `tableWrapCls` and the mobile `<ul>` set **no background**. Rows inherit the `#f7f7f7` canvas. [G] says the table is its own surface, white in light and inset in dark. | `bg-white dark:bg-[--card]` on wrapper, tbody and mobile list | **P0** [V] | [x] Done |
| T2 | `thCls` / `theadCls` are `text-xs` (12px) with colour `#333`. | 14px, `font-semibold`, `--text-main`; use `.portal-data-table` | P1 | [x] Done |
| T3 | Body `text-sm` (14px). Agent table body is `text-base` (16px). | 16px [V] | P1 | |
| T4 | Cell padding `px-4 py-4` / `py-3` for actions | matches agent | ok | |
| T5 | Error text `#b91c1c` / dark `#eba3a3`. | Failure red token | P1 | [x] Done |
| T6 | Table container `rounded-lg` (8px) + 1px `--border` | matches | ok | |
| T7 | Secondary line in cells uses `text-xs` (policy no., created time, product slug). | 14px secondary (agent keeps `text-xs` only for sub-lines of dense cells — [V]) | P2 | |

### 4.2 Table header (`ui/table-header.tsx`)

- Default title `text-lg`; every consumer overrides with `titleClassName="text-xl"`. Make the default `text-xl font-semibold tracking-tight` and drop the overrides. **P1**
- Count line `mt-1 text-sm --text-sub` matches agent. Copy "N transactions found" — confirm in mockup. [V]

### 4.3 Pagination (`ui/pagination-bar.tsx`)

- "Showing x–y of z" is `text-xs`; target `text-sm tabular-nums --text-sub`. **P1**
- Button border `#c7d4c9` and text `--text-main`; agent uses `--border` / `--text-sub`, dark `#565c58`. Active page should be `font-semibold`. **P2**
- Transactions page shows a rows selector + page bar; Agents/Referral/Applicants show the bar only. Mockup: "The rows selector and pagination operate on filtered results." Add the rows selector to all table tabs. **P1**

### 4.4 Tabs (`ui/pill-tabs.tsx`)

- Container dark bg `#262828`; page canvas/table surfaces are `#171919`. Use `--card`. **P2** [x] Done
- Tabs sit directly on the canvas [G]. Confirm container border/pill treatment against the mockup. [V]

### 4.5 Buttons and fields (`lib/ui-classes.ts`)

`globals.css` already defines `.btn-primary/secondary/tertiary` and `.ui-form-field` identically to `agent`. The `ui-classes.ts` strings **bypass** them:

| # | Finding | Target | Pri | Status |
|---|---|---|---|---|
| B1 | `btnSecondaryCls`: neutral `#c7d4c9` border, `#183d2c` text. [G] §8: secondary is green border/text on light, `#707873` outline on dark. | use `.btn-secondary` | P1 | [x] Done |
| B2 | `btnDangerCls`: `bg-red-600`. | Failure red `#991b1b` (`#7f1717` hover) | P1 | [x] Done |
| B3 | `fieldCls`: `focus-visible:outline-offset-2`; [G] §9: 2px `#006838` outline, **zero offset**, no page-level offset on text fields. | remove offset | P1 | [x] Done |
| B4 | `fieldCls`: text `#183d2c`, dark bg `#1c1e1e`, placeholder `#9bb09f`. | `--text-main`, `--card`, `--text-muted` | P1 | [x] Done |
| B5 | Fields are `text-sm`; [G]: mobile text inputs stay 16px. | `text-base` below `sm`, or per `.ui-form-field` | P1 | [x] Done |
| B6 | Compact controls under 44px: `min-h-9` (date range Apply/Clear), `min-h-10` (export menu items, profile buttons), `min-h-9` (retry). | `min-h-11` | P1 | |
| B7 | Login inputs `min-h-12` (48px) with label gap `mt-1` on password. | 44px min, label gap 8px | P2 | |

### 4.6 Modals (`ui/modal.tsx`)

[G] `x-modal-card`: wraps `x-regular-card`; header is title only (no description, no icon) with a 44px X at far right; footer through `x-card-actions` (right-aligned, secondary before primary); backdrop/Escape/X close.

| # | Finding | Target | Pri | Status |
|---|---|---|---|---|
| M1 | `ConfirmDialog` is a different component: `rounded-2xl`, `text-2xl font-extrabold`, `rounded-xl` buttons, `border-2 border-[#183d2c]`, `font-bold`, `bg-[#1e2120]`, no X. | Rebuild on `Modal`: 8px radius, 20px green/sage title, 6px buttons, X close | **P0** | [x] Done |
| M2 | `Modal` has an optional description line and a header divider. | Remove description (title only); confirm dividers [V] | P1 | |
| M3 | Dark surface `#171919`; summary/regular/modal cards use `#262828` (D2). | `--card-summary` | P1 | [x] Done |
| M4 | `ConfirmModal` buttons use `text-sm font-semibold` with inline hex. | `.btn-secondary` / `.btn-primary` / failure | P1 | [x] Done |

### 4.7 Status badge, tags, action icons

- `.ui-status-badge` and variants are identical to `agent`; `.ui-action-icon` and hint badge match [G]. No change. [A]
- Ad-hoc chips: LoB tag `rounded-md bg-#eef4ee text-xs` (transactions), `rounded-full … text-[11px]` badges in profile. Replace with `<StatusPill>` or the count-badge variant (no icon). **P2**
- Table "Clear" buttons use `hover:bg-#e6f2e8`; use `.btn-tertiary`. **P2**

---

## 5. Screens

### 5.1 Dashboard (`dashboard-client.tsx`) — `admin-dashboard`

Guide: four metric cards (sales, commissions, active agents), quick actions leading to the admin mockups, canonical shell. [G]

| # | Finding | Target | Pri |
|---|---|---|---|
| DB1 | Metric value `text-2xl sm:text-3xl` inline | `.portal-metric-value` | P1 |
| DB2 | Metric card `p-4 sm:p-5`, `min-h-[174px]`, label `text-sm font-medium` | `agent-dashboard__metric` / `__panel`: `p-5 sm:p-6`, label 16px medium, helper 16px `--text-sub` at `mt-2` (hidden on phone) | P1 |
| DB3 | Grid gaps `gap-3 sm:gap-4` | 14px row / 18px column | P2 |
| DB4 | Quick-action subtitle `text-sm` | 16px (`text-base leading-5 --text-sub`) | P1 |
| DB5 | **Other admin areas** row: title `text-sm`, subtitle `text-base`. Inverted. | title 16px semibold `leading-6`, subtitle 16px `--text-sub` | P1 |
| DB6 | Card paddings `p-5 sm:p-6`, sections `mt-5` | agent panel spec | P2 |
| DB7 | Action meta `text-[11px]` | 12px | P2 |
| DB8 | Section heading "Overview" has no counterpart in the guide. | remove or keep as sr-only [V] | P2 |
| DB9 | Dark action border `#475049`, area row bg `#222725` / `#fbfcfa` | `--border`, transparent | P2 |
| DB10 | Hover state: pale-gold icon wrapper in dark missing (see 1.2). | | P1 |

### 5.2 Products & lines of business — `admin-products`

Conforms structurally: h1 "Product catalog" with the guide's description, tabs above tables, `TableHeader` with count, inline plus `ActionIcon` before Export, add-product disabled with no active lines of business, edit/delete icons with hints. [G][A]

Remaining: shared fixes in §4 (table bg/headers, buttons, modals, pagination, 44px targets). Empty-state card in `products-tab.tsx` (`rounded-full bg-#e6f2e8 size-14`, `text-xl`) — confirm [V]. Helper `text-xs` hints at 571 and the `#f3f6f2` note at 588 → tokens. **P2**

### 5.3 Agents & applicants — `admin-agents`

Structure matches (Agents / Referral partners / Applicants tabs, `TableHeader`, export, search).

- Pagination shows only the bar; add rows selector (4.3). **P1**
- `applicants-tab.tsx` `dt` labels `text-xs` (lines 195–217): detail labels are 14px. **P1**
- `ConfirmDialog` usage (delete, activate, approve, reject) → fixed via M1. **P0**
- Empty/search copy "No agents match your search." — confirm [V]. **P2**
- Documents dialog should state that no verification/bank documents are supplied; profile must not show bank account data. [G] Check `agent-profile-client.tsx` payment section (line 748+) — it renders payment accounts. **P1** [V]

### 5.4 Agent profile & cases (`agent-profile-client.tsx`, `agent-cases-client.tsx`)

No dedicated admin mockup; guided by `admin-agents` ("local profile/case views") and the summary-card pattern.

- `agent-cases-client.tsx` already contains a `SummaryCard` that matches the mockup (45px green icon tile, 20px green/sage title, 14px `#878787` description, 14px labels, 16px values, 12px uppercase gold group headings). **Extract it to `components/ui/summary-card.tsx`** and reuse it for transaction details, profile and settings. **P1**
- `agent-profile-client.tsx`: h2 `text-lg` (518); buttons `min-h-10` / `min-h-9 text-xs` (997, 1249, 1319); badges `text-[11px]`; error text `#b91c1c`; `uppercase font-bold tracking-wider` heading (1263); local `panelTitleCls` card with `rounded-lg` + `#171919`. Convert to the shared summary card, 44px buttons, Failure red token. **P1**
- Cases client uses `text-xs uppercase` for group headings (728, 1228) — correct per [G] (12px, uppercase, accent gold, sage in dark). Keep.
- `bg-red-50 / text-red-700` alert (1070) → Failure red surface `#f8d9d6` / `#991b1b`. **P2**

### 5.5 Transactions list — `admin-transactions`

Matches: table name + live count at left, search/date filters right, Export, table as only card, pagination below, empty state with headers kept, row action icon "View details". [G][A]

Fix: shared table items (T1–T3), policy no. and time `text-xs` (T7), LoB chip, rows selector already present. Copy: mockup search matches policy, certificate, holder, product, plan, payment, status, agent — admin placeholder reads "Policy, holder, product, insurer, agent..."; align wording. **P2** [V]

### 5.6 Transaction details — `admin-transaction-details` (largest structural gap, **P0**)

| Aspect | Mockup [G] | admin now |
|---|---|---|
| Page header | Title = policy number (or `Not available`), description **Transaction details**; status badge and CSV/PDF download control in the action cluster; "Back to transactions" link | Title = payment reference, description = plan · product, breadcrumbs |
| Layout | One vertical stack of five full-width summary cards | 2-column grid `1.7fr / 1fr`, five different cards |
| Cards | 1 Policy overview (grouped policy + trip, copy controls) · 2 Payment & commission (payment record + net commission groups) · 3 Travellers (5-column table, count badge) · 4 Coverage summary (count-badged closed disclosures) · 5 Add-ons with Additional benefits group | Policy overview · Policy holder · Travel details · Payment summary · Commission |
| Card chrome | Header icon, 20px green/sage title, 14px muted description | `panelTitleCls` `text-xl`, no icon/description |
| Fields | Labels 14px muted, values 16px regular; empty = em dash; long identifiers wrap | `dt` 14px `--text-sub`, `dd font-medium`; mono + `text-xs` for numbers |
| Loading | Skeleton mirrors five cards; header stays | 2-column skeleton |
| Export | CSV/PDF of flattened record | none |

Fix: rebuild the body from the shared summary card (5.4), add the download control, adopt the header rules. Check which of coverage/add-ons/travellers the API actually returns before building those sections (`details.PolicyCustomerList` is read today). The `.travel-faq` disclosure CSS exists in `agent` but not `admin`; port it. **P0**

### 5.7 Commissions, Payments, Generate report — placeholders

[G]: canonical shell, a **Coming soon** card, and a **return link**; no live-workflow claim.

- No return link (e.g. "Back to dashboard"). **P1**
- Extra paragraph "Design placeholder only. No live admin workflow…" below the card isn't in the guide. Confirm [V]. **P2**
- Card uses inline hex; `h2` `text-2xl sm:text-3xl`. Use `agent-dashboard__panel`. **P2**
- Page titles: guide names the third "Generate report"; nav label matches. ok.

### 5.8 User settings (`settings-client.tsx`) — based on `agent-settings`

- Cards use `portal-page-card` with `h2 text-xl --text-main` and description `--text-muted`/`--text-sub` (inconsistent between the two cards). [G]: `x-regular-card` — 20px/24px green (sage dark) title, 14px muted description, `py-5` body, header icon action, footer through `x-card-actions` (Cancel before Save). **P1**
- Profile detail keys `text-sm` with `--text-muted`; values should be `text-base`. **P1**
- Buttons `btn-primary text-sm` / `btn-secondary text-sm`: confirm 44px and card-actions alignment. **P2**
- Hardcoded `#59645d`, `#eef4ec`, `#243329`, `#b88e28`. → tokens. **P2**
- Skeleton: [G] keeps real page header visible and skeletons only API-dependent sections. Matches. ok.

---

## 6. Authentication and error pages

### 6.1 Login (`auth-layout.tsx`, `login-form.tsx`) — `portal-login`

- **P0:** `auth-layout.tsx` loads `/storage/img/logo-unosure-dark.png` in two places. `admin/public/storage/img/` contains only `abstract-timekeeper.svg` and `icon-unosure-dark.png`, so the logo 404s. Use `/images/logo-unosure-dark.png` (exists).
- Layout (30/70 grid, curved 58px bottom-left corner, gold overlay `rgba(184,142,40,.68)` + `rgba(31,28,12,.38)`, `admin-login-consultation-v2.png`) matches the guide. [A]
- Heading `clamp(2.2rem,4vw,3.25rem)` / `tracking-[-.055em]` — confirm against mockup. [V]
- Missing screens in `admin`: **OTP verification** (6-digit numeric, one-time-code autofill, resend/back) and **reset password**. **P1** (feature gap) - DEFERRED
- Portal switch (agent/admin) — N/A for the admin app. - DISREGARD
- Footer copy "© year One Insurance" vs brand "UnoSure" in aside; confirm brand text. **P2**

### 6.2 404 and 500 (`not-found.tsx`, `error.tsx`) — `error-404`, `error-500` **P1**

[G]: open layout, **no enclosing card, no alarm colours**, large code `clamp(6rem,16vw,10rem)` semibold tight tracking `#006838` (sage `#d0e3c8` dark), one H1 `text-3xl sm:text-4xl`, explanation `max-w-md` 16px relaxed, `max-w-2xl` content, padding 64px (mobile) / 80px (sm+), actions **Back to home** (primary) + **Get in touch** (secondary) stacked on mobile, plus an email help link. Canvas `#fcfdfb` / `#1c1e1e`.

| Item | admin now | Target |
|---|---|---|
| Container | `portal-page-card` | none |
| Icon | red circle / amber circle | none (code is the visual) |
| Heading | "404 - Page Not Found" `text-2xl font-bold` / "Something went wrong" `text-xl font-bold` | "Looks like a wrong turn." / "Something went wrong on our side." at `text-3xl sm:text-4xl` |
| Body | `text-sm --text-muted` | "We can't find the page you're looking for. It may have moved, or the link may be out of date." / "We couldn't complete this request. Please try again later, or contact our team if you need help." at 16px |
| Actions | single primary | Back to home + Get in touch + help link |
| Retry | "Try again" button | none per guide (no automatic retry); keep only if product wants it |

Other codes (400/401/403/405/408/410/413/419/422/429/502/503/504) have mockups; only 404/500 exist in `admin`.

---

## 7. Fix order

1. **P0:** login logo path; transaction details rebuild (+ extract `SummaryCard`); `ConfirmDialog`; table backgrounds (verify visually first).
2. **Tokens + shared CSS:** §1.1, §1.2, decision D2 (`--card-summary`). Everything else inherits.
3. **Shared components:** `ui-classes.ts` → `.btn-*`/`.ui-form-field`, `TableHeader`, `PaginationBar`, `data-table`, `pill-tabs`, `modal`, 44px targets.
4. **Shell:** port `agent-dashboard__*` classes; mobile nav; header.
5. **Dashboard**, then **settings**, **profile/cases**, **placeholders**, **404/500**.
6. **Missing screens:** OTP, reset password.

## 8. Not audited / caveats

- Computed values from the rendered mockups (all [V] items). Screenshots or `getComputedStyle` dumps would close them.
- Not verified at runtime: contrast, focus outlines, reduced-motion, 390px layouts, dark mode of each screen.
- `select-field.tsx`, `export-menu.tsx` and `skeleton.tsx` were skimmed only (export-menu items `min-h-10`; skeleton card surface duplicated inline).
- Admin-specific sidebar values from `AGENTS.md` (`#b88e28` bg, `#a67f20` border, `#d6bd7d` accent, `#006838` active icon, `#183d2c` active text) were treated as correct; `ui-theme` only specifies sidebar `#b88e28` with dark text.

## 9. Acceptance checklist

- [ ] Light and dark: every screen, canvas `#f7f7f7`/`#171919`, tables white/inset.
- [ ] 390px, 1366×768, 1280px content cap.
- [ ] All interactive targets ≥ 44px; focus outline 2px `#006838`, zero offset on fields.
- [ ] Text: titles 24/30px, table headers 14px, secondary 16px where agent uses 16px.
- [ ] Radii: cards/tables 8px, controls 6px, badges full pill.
- [x] No hex outside `agent` palette + admin sidebar variation (`grep` check).
- [ ] Transaction details shows five stacked cards, download works.
- [ ] 404/500 match copy and layout; [x] login logo renders.