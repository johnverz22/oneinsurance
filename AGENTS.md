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
