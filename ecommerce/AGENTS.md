# One Insurance Ecommerce Redesign — AI Agent Operating Manual

Welcome to the **One Insurance Ecommerce Redesign** project. This document equips AI assistants, pair programmers, and engineers with everything needed to build, refactor, and maintain this application.

---

## 1. Project Context & Scope

This repository is a redesign of the client-facing ecommerce application of One Insurance, rebuilt on **Next.js 16 (App Router)** with **React 19**, **TypeScript**, **Tailwind CSS v4**, **Lucide React**, **Zustand**, and **TanStack Query**.

The current focus is the **Travel Insurance Product Suite**, modeled directly from the official UI specifications and interactive mockups hosted at:
- **Reference UI Documentation**: [developers.oneinsurance.shop/ui](https://developers.oneinsurance.shop/ui)
- **Downloaded Specifications**: Located locally under `docs/design-specs/` and `docs/ui-theme-design.md`
- **Visual Mockups**: Located locally under `docs/mockups/`

---

## 2. Complete Travel Insurance Flow (7 Screens)

The redesign implements the 7 distinct stages of the travel insurance flow:

| Stage | Route Pattern | Specification File | Mockup File | Key Purpose |
|---|---|---|---|---|
| **1. Landing & Search** | `/[agent-code]/travel-insurance` | `docs/design-specs/landing-page-design.md` | `travel-landing-page.html` | Discovery hero, trip search form (Single/Annual, Domestic/International, Dates, Travellers), key coverages, FAQs. |
| **2. Choose Plan** | `/[agent-code]/travel-insurance/plans` | `docs/design-specs/step-2-choose-plan-design.md` | `travel-step-2.html` | 248px filter rail (provider, sorting, Schengen compliance), side-by-side plan cards, expandable benefits drawer. |
| **3. Generate Quote** | `/[agent-code]/travel-insurance/quote` | `docs/design-specs/step-3-generate-quote-design.md` | `travel-step-3.html` | Traveller identity & contact forms, optional add-ons, 340px summary rail, proposal generation. |
| **4. Review Quote** | `/[agent-code]/travel-insurance/review` | `docs/design-specs/step-4-review-quote-design.md` | `travel-step-4.html` | Read-only locked proposal inspection, proposal reference with copy action, QR status, pricing confirmation. |
| **5. Payment** | `/[agent-code]/travel-insurance/payment` | `docs/design-specs/step-5-payment-design.md` | `travel-step-5.html` | Payment channels (GCash, Maya, GrabPay, ShopeePay, Visa, Mastercard), billing address fields, checkout submission. |
| **6. Policy Issuance** | `/[agent-code]/travel-insurance/issuance` | `docs/design-specs/policy-issuance-design.md` | `travel-policy-issuance.html` | Focused waiting state, vertical milestone progress timeline, underwriter recording status. |
| **7. Policy Issued** | `/[agent-code]/travel-insurance/policy` | `docs/design-specs/policy-issued-design.md` | `travel-policy-issued.html` | Certificate of Coverage (eCOC), Electronic Receipt switcher, PDF download triggers, 24/7 emergency hotlines. |

---

## 3. Design System & Tokens

Follow the official **One Insurance UI Theme Specification** (`docs/ui-theme-design.md`):

### Color Tokens

```css
/* Brand colors */
Primary CTA Fill:       #006838 (Insurance Green)
Primary Hover:          #00552e
Primary Pressed:        #004525
Leaf Green Accent:      #559e45
Soft Sage:              #d0e3c8
Pale Green:             #e2eddb

/* Surfaces */
Page Canvas:            Light: #fcfdfb | Dark: #1c1e1e
Card Surface:           Light: #ffffff | Dark: #262828
Subtle Surface:         Light: #f1f2f0 | Dark: #303232
Header / Inset:         Light: #ffffff | Dark: #171919

/* Text */
Main Text:              Light: #183d2c | Dark: #f4f5f2
Supporting Text:        Light: #333333 | Dark: #c4c7c5
Muted Text:             Light: #808080 | Dark: #b2b7b4

/* Borders & Form Controls */
Card Divider/Border:    Light: #dfe7df | Dark: #3d4140
Field Border:           Light: #c7d4c9 | Dark: #565c58
Field Focus:            #006838 (2px outline, 0 offset in BOTH light & dark modes)
Error:                  #dc2626
```

### Form Fields & Inputs
- Use the `.ui-form-field` class for all shared form controls.
- Minimum touch target: 44px.
- Corner radius: 6px (`rounded-md`).
- Focus state: `outline: 2px solid #006838; outline-offset: 0;`

---

## 4. Backend Integration Architecture

The application communicates with the One Insurance Backend through Next.js App Router Route Handlers (BFF layer):

1. **Compare Quotes API**:
   - `src/app/api/travel-insurance/init-compare/route.ts`: Initiates asynchronous quote calculation.
   - `src/app/api/travel-insurance/compare-quote/route.ts`: Polls for results or handles fallback responses.
2. **Full Quote API**:
   - `src/app/api/travel-insurance/full-quote/route.ts`: Sends proposal data as multipart/form-data to generate proposal numbers.
3. **Issue Quote API**:
   - `src/app/api/travel-insurance/issue-quote/route.ts`: Finalizes policy creation with the underwriter.
4. **Payment Gateway**:
   - `src/app/api/payment/`: Routes for payment token generation, status verification, and checkout redirect.

### Client-side Data Flow
- **Zustand Store**: `src/store/travel-insurance-store.ts` holds active booking state (dates, destinations, traveller profiles, selected plan, proposal reference) and persists to `sessionStorage`.
- **TanStack Query Mutations**:
  - `useFullQuoteRequest`: Handles proposal generation.
  - `useIssueQuoteRequest`: Handles policy issuance.

---

## 5. Development Guidelines

1. **App Router Conventions**: Routes belong in `src/app/[agent-code]/travel-insurance/`.
2. **Affiliate Route Support**: The `[agent-code]` parameter supports affiliate attribution. Default to `DIRECT` when not provided.
3. **Class Names**: Use Tailwind CSS utility classes and `cn()` from `@/lib/utils`.
4. **No Arbitrary Colors**: Stick to the CSS custom properties and color tokens defined in `src/app/globals.css`.
5. **Strict TypeScript**: Never use `any` unless required by legacy third-party payloads. Define schemas with `zod`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
