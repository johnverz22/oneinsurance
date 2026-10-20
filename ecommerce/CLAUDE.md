# One Insurance Ecommerce Redesign — Claude Context

This file configures Claude Code and other Anthropic AI assistants for working on the `ecommerce-redesign` monorepo application.

## Key Directives
- **Primary Product**: Travel Insurance protection flow.
- **Tech Stack**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Zustand v5, TanStack Query v5, Lucide React.
- **Visual Reference**: Strictly adhere to `docs/ui-theme-design.md` and the 7 screen specifications in `docs/design-specs/`.
- **Primary Color**: Insurance Green `#006838` (hover: `#00552e`, active: `#004525`).
- **Focus Rings**: Form inputs MUST use `#006838` with 0 offset across both light and dark modes.

## Local Documentation Map
- Design System: `docs/ui-theme-design.md`
- Step 1 Landing: `docs/design-specs/landing-page-design.md` & `docs/mockups/travel-landing-page.html`
- Step 2 Choose Plan: `docs/design-specs/step-2-choose-plan-design.md` & `docs/mockups/travel-step-2.html`
- Step 3 Generate Quote: `docs/design-specs/step-3-generate-quote-design.md` & `docs/mockups/travel-step-3.html`
- Step 4 Review Quote: `docs/design-specs/step-4-review-quote-design.md` & `docs/mockups/travel-step-4.html`
- Step 5 Payment: `docs/design-specs/step-5-payment-design.md` & `docs/mockups/travel-step-5.html`
- Policy Issuance: `docs/design-specs/policy-issuance-design.md` & `docs/mockups/travel-policy-issuance.html`
- Policy Issued: `docs/design-specs/policy-issued-design.md` & `docs/mockups/travel-policy-issued.html`

## Useful Commands
- `npm run dev`: Starts Next.js development server on port 3100
- `npm run build`: Production build with TypeScript validation
- `npm run lint`: ESLint check
