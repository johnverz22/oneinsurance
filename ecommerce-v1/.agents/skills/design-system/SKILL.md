---
name: design-system
description: >
  Ecommerce app's unified design system (semantic Tailwind v4 tokens +
  shared primitives). Use this skill whenever styling UI, adding
  components, or working in the insurance funnels — always prefer
  semantic tokens and shared primitives over raw palette classes and
  bespoke markup. Source of truth: docs/ui_audit.md.
---

# design-system

The ecommerce app consolidated its UI onto semantic design tokens and
shared primitives (see `docs/ui_audit.md` for the full audit and the
migration checklist). New or edited UI MUST follow these rules — the
app previously drifted into hardcoded colors and duplicated components,
and raw classes are the regression vector.

## Rules

1. **Never use raw palette utilities** for text/surfaces:
   `text-gray-*`, `bg-gray-*`, `text-slate-*`, `bg-slate-*`,
   `border-gray-*`, `text-red-*`, `text-green-*`, `text-amber-*`,
   `text-yellow-*` are banned in light mode. Use semantic tokens.
   - Body copy → `text-muted-foreground` (never `text-gray-500/600`)
   - Headings/primary text → `text-foreground`
   - Surfaces → `bg-card` / `bg-muted` / `bg-section`
   - Borders → `border-border` / `border-input`
   - Errors → `text-destructive` / `border-destructive`
   - Success (included benefits, paid states) → `text-success` / `bg-success/10`
   - Warnings → `text-warning` / `bg-warning/10`
   - Exception: dark-mode-surface shades (`dark:bg-gray-900`, light text
     on dark hero overlays like `text-slate-200/300`) may stay when no
     semantic equivalent fits — flag in review rather than converting.

2. **Never hardcode hex colors** in `className` or inline styles.
   The previous section backgrounds `#eef2f7`, `#F3F5FC`, `#E8E9F3`,
   `#F8F5EF`, `#B4975A` are all `bg-section`/`bg-muted`/`bg-primary` now.

3. **No inline `style=` / `<style>` blocks** — utility classes + CSS
   variables only.

4. **Typography**: `body` already sets `font-open-sans font-normal
   tracking-tight`. The universal `*` selector must never re-apply
   `font-semibold` — bold is applied per-element (`font-bold`/`font-semibold`
   on headings/titles only).

## Semantic tokens (globals.css `@theme inline`)

| Token | Light value | Utility classes |
|---|---|---|
| `--muted-foreground` | `oklch(0.556 0 0)` — do NOT lighten; was `0.82` (invisible) and is contrast-tuned | `text-muted-foreground` |
| `--success` / `--success-foreground` | `oklch(0.62 0.17 145)` | `text-success`, `bg-success`, `bg-success/10` |
| `--warning` / `--warning-foreground` | `oklch(0.75 0.16 75)` | `text-warning`, `bg-warning/10` |
| `--rating` | `oklch(0.83 0.162 84.6)` amber | `fill-rating`, `text-rating`, `bg-rating` |
| `--section` | `oklch(0.953 0.011 243)` light blue-gray | `bg-section` (tinted full-width page sections: testimonials, FAQ, footer) |

Dark-theme values exist for all of the above in the `.dark` block.

## Shared primitives — always prefer these

`src/components/ui/`:

- **`<Card variant>`** (`card.tsx`) — all card surfaces. Variants:
  `default` (border + shadow-sm), `interactive` (+ hover shadow — plan
  cards), `featured` (border-2 primary/20). Plan cards use
  `gap-0 py-0 sm:flex-row` to keep the 3-column layout.
- **`<StarRating rating>`** (`star-rating.tsx`) — the ONLY way to render
  review stars. Never hand-roll `<Star>` loops or hardcode `#FFA500`.
- **`insurance-shared.tsx`** — funnel primitives:
  `PrimaryActionButton` (all Apply Now / Search CTAs),
  `PlanCardSkeleton` + `PlansLoadingState` (all loading states),
  `NoPlanState` (empty/error states), `PriceDisplay` (`amount`,
  `currency`, `label` — all premium prices), `SortFilterSidebar`
  (provider filtering; travel funnel keeps its advanced collapsible
  sidebar — don't force this on it), `SectionDescription`.
- **`<MetricCard>`** (`metric-card.tsx`) — dashboard/report stat cards.
- **`<Stepper>`** (`stepper.tsx`) — all funnel progress indicators.
- **`<InsuranceBanner>`** (`components/insurance-banner.tsx`) — CTA
  banners; `imageUrl`, `availNowLink`, `availNowLabel` are all optional
  config, never hardcode `href="#avail"`.

## next/image rules

- `width`/`height` props must reflect the image's TRUE intrinsic ratio —
  mismatch triggers the "width or height modified" dev warning.
  `/images/logo.png` is **256×63**, `/images/IFRC.png` is **1290×800**.
- Size via `className="h-N w-auto"` (or `w-N h-auto`), never
  one-sided `style` overrides.
- `<Brand>` (`components/layout/brand.tsx`) is the canonical logo —
  reuse it rather than re-adding `<Image src="/images/logo.png">`.

## Forms

- TanStack Form/Zod validation errors: `text-destructive` on the message,
  `border-destructive` on the field — uniform across all inputs.

## Verify

Style-only refactors still need runtime verification — use the
`next-dev-loop` skill: `/_next/mcp` compile check + `agent-browser`
computed-style checks on the tokens. A hard reload is NOT enough after
`globals.css` changes if the dev server predates them — restart `next dev`
to regenerate the Tailwind theme.
