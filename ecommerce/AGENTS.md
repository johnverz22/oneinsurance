<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Design System (this app only)

This app uses a unified design system — semantic Tailwind v4 tokens (`text-muted-foreground`, `bg-section`, `text-success`, `text-warning`, `fill-rating`) plus shared primitives (`Card` variants, `StarRating`, `PriceDisplay`, `PrimaryActionButton`, `PlanCardSkeleton`, `NoPlanState`, `SortFilterSidebar`, `Stepper`, `MetricCard`, `InsuranceBanner`). Never use raw palette classes (`text-gray-*`, `bg-slate-*`, `text-green-*`) or hardcoded hex — see `.agents/skills/design-system/SKILL.md` and `docs/ui_audit.md` for the full rules.
