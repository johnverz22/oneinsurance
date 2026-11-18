# OneInsurance Monorepo — Project Context

## Monorepo Overview
This repository contains three independent Next.js applications, managed by npm. Each app has its own package.json and node_modules (no shared workspaces/turborepo).

1. **admin**: Next.js 16 App. Administrator operations (products, commissions, agents, payments, transactions, reports). Port 5000 (`oneinsurance-admin` in PM2). Rebuilt (Nov 2025) on the `agent` architecture — `admin-v1` is the preserved legacy app, do not modify.
2. **agent**: Next.js 16 App. Agent portal (sales, clients, quotations). Port 4000 (`oneinsurance-agent` in PM2). `agent-v1` is the preserved legacy app.
3. **ecommerce**: Next.js 16 App. Client storefront (travel, health, motor insurance). Port 3000 (`oneinsurance` in PM2). Route structure relies heavily on dynamic `/[agent-code]` affiliate routes. `ecommerce-v1` is the preserved legacy app.

## Tech Stack
- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **UI**: Tailwind CSS v4, shadcn/ui (Radix), Lucide React
- **State/Data**: Zustand (client state, persisted), TanStack Query (server state), Axios
- **Auth**: Custom token auth via secured BFF route handlers (NOT NextAuth). Zustand-persisted auth stores (admin: `admin-auth-storage`).
- **Forms**: React Hook Form + Zod

## Architecture & Conventions
- **App Router**: Pages in `src/app/`, grouped as `(auth)` (redirects to /dashboard when logged in) and `(portal)` (requires auth, shared shell).
- **Components**: Reusable UI in `src/components/ui/` (shadcn). Feature components in `src/components/`. Layout shell in `src/components/layout/`.
- **State & API**: Zustand in `src/store/`. All backend calls go through BFF route handlers in `src/app/api/` — never call the upstream API directly from client components.
- **BFF**: Use `proxyApiRequest()` / helpers in `src/lib/api-helpers.ts` (admin). Forwards Authorization header, query string, JSON body; relays upstream status; origin-scoped CORS via `APP_URL` — never `Access-Control-Allow-Origin: *`.
- **Typing**: Strict TypeScript. Zod for form validation schemas.
- **Styling**: Tailwind utility classes. Use `cn()` from `src/lib/utils` for class merging. No inline styles.
- **Data fetching**: `useAuthFetch()` hook (in `src/hooks/`) + TanStack Query for authenticated BFF calls; shows loading skeletons while pending.

## Agent Portal Specifics
- **Shell** (`src/components/layout/`): 1:1 port of the platform-shell mockup at `developers.oneinsurance.shop/mockups/agent/dashboard`. Green sidebar `#006838` (232px, 76px collapsed — both themes), white active pill w/ gold `#b88e28` icon + sage `#d0e3c8` edge bar, edge collapse tab (persisted `oi-agent-sidebar-collapsed`), sticky top bar (mobile hamburger popover + logo / desktop Quick search (dashboard only; other pages show an "Agent portal / <page>" crumb) / theme + mail notification buttons), fixed mobile bottom nav, internally-scrolling content canvas (max-w 1280px). Shell CSS lives in globals.css under "Agent portal shell" using `agent-dashboard__*` class names — keep in sync with the mockup.
- **Quick search** in the top bar binds `usePortalSearchStore` and filters dashboard activity — it renders on `/dashboard` only.
- **Page headers**: `PortalContentHeader` renders in-flow title/breadcrumbs/description/actions only — no sticky bar, theme, bell, or search (the global header owns those).
- **Env**: `BASE_URL`/`NEXT_PUBLIC_BASE_URL` = backend API; theme storage key `oi-ui-theme` (next-themes, `.dark` class).

## Agent Portal Design Tokens (QA-spec, Nov 2026)

> These are the authoritative values. Do not deviate without an explicit approval note.

| Token / Use | Light | Dark |
|---|---|---|
| Outer frame (`agent-dashboard__shell` bg) | `#e9ece9` | `#141716` |
| Shell sidebar + top bar surface | `#fcfdfb` | sidebar `#282c29` / top bar `#171919` |
| Inset page canvas (`--portal-canvas`) | `#f7f7f7` | `#171919` |
| Page card + table body (`--card`) | `#ffffff` | `#171919` ← **flat, same as canvas per spec** |
| Subtle surface / table thead (`--subtle`) | `#f1f2f0` | `#303232` |
| Structural border (`--border`) | `#dfe7df` | `#3d4140` |
| Primary text (`--text-main`) | `#0c0d0d` | `#f4f5f2` |
| Supporting text (`--text-sub`) | `#5b6e61` | `#b2b7b4` |
| Muted text (`--text-muted`) | `#a9a9a9` | `#767776` |
| Brand green (`--primary`) | `#006838` | `#006838` |
| Gold accent | `#b88e28` | `#b88e28` |
| Soft sage | `#d0e3c8` | `#d0e3c8` |
| Pale gold (icon hover bg) | `#f8efd8` | `#f8efd8` |

**Key layout spec (rendered mockup geometry — use these, not the written spec):**
- Sidebar: **232px** expanded / **76px** collapsed (both themes)
- Top bar: **72px** min-height, 1px bottom border
- Canvas padding: **20px top / 22px H / 30px bottom** desktop; **24px top / 16px H / 24px bottom** phone; **28px top / 24px H** from 640px
- Dashboard grid: `grid-template-columns: minmax(0, 1.8fr) minmax(280px, .8fr)` with **14px row / 18px column** gaps
- **Upper row:** Premium trend (wide/left) + Quick actions (narrow/right)
- **Lower row:** Pipeline/Referral card (wide/left) + Recent activity (narrow/right)

**Shared CSS classes (globals.css):**
- `agent-dashboard__*` — all shell, sidebar, nav, header, content classes
- `agent-dashboard__header-action` — 44×44px top-bar icon buttons; pale-gold hover in both themes
- `agent-dashboard__metric` — dashboard KPI cards; phone grid (icon top-right → value → label; helper hidden)
- `agent-dashboard__panel` — bordered card surface (border + bg: var(--card) + 8px radius)
- `agent-dashboard__action` — clickable action cards with 1px green border hover + 2% lift
- `portal-metric-value` — 24px mobile / 30px ≥640px, semibold, tight tracking
- `portal-page-card` — standard page card (8px radius, 1px border, 24px padding)
- `portal-data-table` — table; thead uses `--subtle` bg; `th[scope=col]` sentence-case
- `portal-table-filters` / `portal-table-filters__*` — filter bar layout
- `ui-form-field` — 44px min-height, 6px radius, green focus ring, red on aria-invalid
- `btn-primary` / `btn-secondary` / `btn-tertiary` — button variants
- `ui-status-badge` / `ui-status-badge--success/pending/failure/info` — inline pill badges
- `ui-action-icon` — 44×44px icon button; pale-gold hover, green focus

**Agent Portal Typography & Content Spec (Mockup Parity):**
- **Page Titles & Subtitles (`PortalContentHeader`):**
  - Always nested together inside `<div className="min-w-0">`.
  - Title: `<h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl text-[var(--text-main)]">` (24px phone / 30px desktop, -0.75px tracking).
  - Subtitle: `<p className="mt-2 text-sm leading-6 text-[var(--text-sub)] sm:text-base">` (16px desktop, exactly `mt-2` / 8px below title).
  - Actions/badges: right-aligned in `<div className="flex items-center gap-2">` using `items-end justify-between`.
- **Mockup Typography Scale (16px base):**
  - The mockup maps `--text-secondary: 1rem` (16px). Secondary text elements (metric descriptions, quick action subtitles, activity titles and details, focus card paragraph and button) compute to **16px** (not standard 14px):
    - Metric descriptions (`Across your portfolio`, etc.): 16px (`1rem`), leading 20px (`1.25rem`), opacity 0.75.
    - Quick action subtitles (`Share product journeys`, etc.): 16px (`text-base leading-5 text-[var(--text-sub)]`).
    - Recent activity rows: title 16px semibold/bold (`leading-6`), detail 16px (`leading-6`), amount 16px semibold (`leading-6`), status 12px (`text-[11px] sm:text-xs`).
- **Dashboard Pipeline Focus Card (`Keep your pipeline moving.`):**
  - Surface: `bg-[#075b38]` (`bg-leaf-57`, darker emerald than brand green `#006838`), 8px radius, padding 24px phone / 28px desktop (`p-6 sm:p-7`).
  - H2: `max-w-64 text-[24px] font-semibold leading-[30px] tracking-[-0.04em]` (wraps into 2 lines: "Keep your / pipeline moving.").
  - P: `mt-3 max-w-72 text-[16px] leading-[24px] text-[#d7ecdb]`.
  - Button: `mt-8 inline-flex min-h-11 items-center gap-2 rounded-md bg-white px-5 text-[16px] font-semibold text-[#006838] hover:bg-[#e2eddb]` with 16px (`size-4`) `ArrowUpRight` icon.
  - Height & flow: do NOT apply `flex flex-col justify-between`; card content flows naturally with `mt-8` button spacing (~276px total height).
- **Dashboard Canonical Labels:**
  - Metrics: `Total cases` (Across your portfolio), `Total premium` (Illustrative value), `Net commissions` (Illustrative earnings), `Products` (In your catalogue).
  - Quick actions: `Referral links` (Share product journeys), `Sales` (Review performance), `Policies` (Browse your portfolio), `Commissions` (Track earnings).
  - Recent activity: limited to **3 items only** with 3 skeleton placeholders when loading.

**Icons (Lucide, 20px outline, strokeWidth=1.5 in nav):**
- Total cases / Policies quick action: `FileText`
- Total premium / Net commissions / Commissions quick action: `CreditCard`
- Products metric: `LayoutList` (catalogue/search glyph)
- Referral links quick action: `ArrowUpRight`
- Sales quick action: `ClipboardList`
- Decorative SVGs next to labelled text: always `aria-hidden="true"`

**Mobile bottom nav (page-aware, one shared component):**
- Dashboard route: Home (`LayoutGrid`) / Sales (`FileText`) / Policies (`Shield`) / Activity (`Activity`)
- Settings route: Home / Sales / Policies / Settings (`UserRound`) in 4th slot
- Active pill: `bg-[#d0e3c8] text-[#006838]` light / `bg-[#006838] text-white` dark; min-height 56px; `aria-current="page"` on active item

## Admin Portal Specifics
- **Theme**: Gold sidebar/top bar — `#b88e28` bg, `#a67f20` border, `#d6bd7d` accent, `#006838` active-icon green, `#183d2c` dark text on white active pills.
- **Responsive shell** (`src/components/layout/`): desktop `portal-sidebar.tsx` (lg+), `mobile-top-bar.tsx` (< lg, hamburger popover), `mobile-nav.tsx` (fixed bottom nav). Nav items defined once in `ADMIN_NAV_ITEMS` in portal-sidebar.tsx.
- **Page header**: `PortalContentHeader` (portal-content-header.tsx) — sticky title row + optional description/breadcrumbs/search/actions. Breadcrumbs are for ≥2nd-level pages only; first-level nav pages omit them.
- **Unimplemented sections** use `ComingSoon` (components/layout/coming-soon.tsx).
- **Env**: `APP_URL` = admin deployment origin (stage-admin.oneinsurance.shop); `BASE_URL`/`NEXT_PUBLIC_BASE_URL` = backend API.
- **Known issue**: `npm run lint` fails (`FlatConfig` import in eslint config) — pre-existing in `agent` too.

## Common Commands
Use npm commands (e.g. `cd admin && npm run dev`).
Deploy is via GitHub Actions -> SSH -> PM2 restart.
