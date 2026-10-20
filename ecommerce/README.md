# One Insurance — Ecommerce Redesign (Travel Protection)

A Next.js 16 application designed to provide travel insurance quotation, comparison, proposal review, checkout, and instant electronic policy issuance.

## Overview

This application recreates the client-facing travel insurance ecommerce journey based on the design system and interactive mockups from [One Insurance Developers](https://developers.oneinsurance.shop/ui).

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19, Tailwind CSS v4, Lucide Icons, Radix UI Primitives
- **State Management**: Zustand v5 (Session storage persistence)
- **Data Fetching**: TanStack React Query v5 & Axios
- **Form Validation**: Zod & React Hook Form
- **Theme**: Light & Dark mode via `next-themes`

---

## 7-Stage Travel Insurance Workflow

The application implements the complete 7-stage workflow:

1. **Step 1: Landing Page & Trip Search** (`/[agent-code]/travel-insurance`)
   - Trip Details Form (Single vs. Annual multi-trip, Domestic vs. International, Dates, Traveller counts).
   - Core coverage highlights and FAQ accordion.
2. **Step 2: Choose a Plan** (`/[agent-code]/travel-insurance/plans`)
   - 248px filter rail (Sort by price/medical, provider filtering, Schengen compliance toggle).
   - Side-by-side plan benefit comparison cards with expandable details.
3. **Step 3: Generate Quote & Traveller Info** (`/[agent-code]/travel-insurance/quote`)
   - Lead traveller identity, contact, and ID document fields.
   - Optional adventure & rental car protection add-ons.
   - 340px sticky summary rail with real-time price updates.
4. **Step 4: Review Proposal** (`/[agent-code]/travel-insurance/review`)
   - Read-only locked proposal inspection.
   - Proposal reference number with copy action and QR status indicator.
5. **Step 5: Payment & Checkout** (`/[agent-code]/travel-insurance/payment`)
   - Payment method selection: GCash, Maya, GrabPay, ShopeePay, Visa, Mastercard.
   - Payer and billing address information.
6. **Policy Issuance Status** (`/[agent-code]/travel-insurance/issuance`)
   - Milestone progress timeline (Payment confirmed → Policy recording → Certificate preparation).
7. **Policy Issued & Document Access** (`/[agent-code]/travel-insurance/policy`)
   - Interactive switcher between Certificate of Coverage (eCOC) and Acknowledgement Receipt.
   - Policy identifier tiles with one-click copy buttons.
   - Download PDF triggers and 24/7 emergency hotline details.

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm 10+

### Setup & Run
```bash
# Navigate to redesign directory
cd ecommerce-redesign

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3100](http://localhost:3100) in your browser.

---

## Offline Documentation & Assets

All design system specifications and HTML mockups are saved locally for offline reference:
- `docs/ui-theme-design.md`: Master UI theme specification.
- `docs/design-specs/`: Screen-by-screen Markdown design guides (landing, steps 2–5, issuance, issued).
- `docs/mockups/`: Complete HTML structures from the developers site.
- `docs/ui-reference/`: UI component guidelines (colors, typography, buttons, forms, cards, etc.).
- `public/`: Image assets (One Insurance logos, payment provider badges, travel imagery).
