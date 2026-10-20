# Travel Insurance Redesign — Implementation Plan

> **Scope:** `ecommerce-redesign` `/[agent-code]/travel-insurance/` flow (Steps 1–5 + Policy Issued).
> **Reference:** `ecommerce` (full functionality source) + mockups at `https://developers.oneinsurance.shop/mockups/travel/step-*`.
> **Output:** This document. No code is written yet.

---

## 0. Overview & Guiding Principles

### Route mapping

| Step | Mockup | ecommerce route | redesign route (current) |
|------|--------|-----------------|--------------------------|
| 1 — Trip details | `/mockups/travel/` (landing form) | `products/travel-insurance/` | `travel-insurance/` ✅ |
| 2 — Choose plan | `/mockups/travel/step-2` | `products/travel-insurance/plans` | `travel-insurance/plans` ✅ |
| 3 — Generate quote | `/mockups/travel/step-3` | `products/travel-insurance/avail` (step 2 of avail) | `travel-insurance/quote` ✅ |
| 4 — Review quote | `/mockups/travel/step-4` | `products/travel-insurance/avail` (step 3 of avail) | `travel-insurance/review` ✅ |
| 5 — Payment | `/mockups/travel/step-5` | `products/travel-insurance/avail` (step 4 of avail) | `travel-insurance/payment` ✅ |
| — Policy issuance | `/mockups/travel/policy-issuance` | `products/travel-insurance/avail` (post-payment) | `travel-insurance/issuance` ✅ |
| — Policy issued | `/mockups/travel/policy-issued` | `products/travel-insurance/[provider]` | `travel-insurance/policy` ✅ |

### Design tokens (from mockup)
- **Brand green:** `#006838` / hover `#00552e` / active `#004525`
- **Dark forest:** `#183d2c`
- **Light sage bg:** `#fcfdfb` / `#f1f2f0`
- **Sage border:** `#dfe7df` / `#c7d4c9`
- **Dark bg:** `#1c1e1e` / card `#262828`
- **Body text:** `#333333` / muted `#808080`
- **Accent green light:** `#d0e3c8` / `#e2eddb`

### Non-negotiable requirements
1. **No dummy/hardcoded data** — remove all `CATALOG_PLANS`, `ADDONS_LIST`, mock pricing, etc.
2. **Follow mockup look & feel exactly** — layout, colors, typography, component patterns.
3. **Skeleton loading** matches mockup skeleton states (not spinner-only).
4. **Mobile-first** — bottom sticky bars for mobile, responsive at all breakpoints.
5. **Searchable destination** — combobox/typeahead replaces plain `<select>` for countries.
6. **Modify search** — opens in-place or modal (per mockup pattern), not full page redirect on mobile.
7. **Bottom sticky travel details bar** — persistent across steps 2–4 on mobile.
8. **All ecommerce fields** must be mapped — none dropped silently.

---

## 1. Step 1 — Trip Details Form (Landing Page)

**File:** `src/components/travel-insurance/trip-details-form.tsx`

### Current issues in redesign

| Issue | Detail |
|-------|--------|
| Destination is a plain `<select>` with 22 hardcoded countries | Must use searchable combobox powered by `TravelCoverageMap` (all 150+ countries/regions from ecommerce) |
| No multi-destination support | ecommerce supports selecting multiple destinations; redesign only supports one |
| No `PlaceOfOrgin` (origin) validation | ecommerce validates origin must be a Philippine location; redesign hardcodes "Philippines" as disabled field — OK for now but must send correct code |
| `reviewed` checkbox defaults to `true` | Should default to `false` (user must explicitly check) |
| Missing `agreedToTerms` link to `/travel-insurance-terms` | Ecommerce links to Terms & Conditions page |
| Traveller counter max is 9, ecommerce max is 10 | Align to 10 |
| No form hydration guard | Ecommerce gates form render on `hydrated` state to avoid SSR mismatch |
| Date inputs are native `<input type="date">` | Fine for redesign — but must follow mockup's styled date field look |
| No Zod validation | Ecommerce uses full `travelInsuranceSchema` validation; redesign uses ad-hoc JS checks |
| `country` state defaults to `'Japan'` | Should default to empty/unset requiring selection |
| Annual trip: return date label is "First trip return" | Correct per mockup — keep |
| `setStep(2)` is called in redesign before push | OK — ensures store is in sync |

### Required changes

#### 1.1 Searchable destination combobox

Replace `<select id="trip-country">` with a custom combobox component:

```
Component: <DestinationCombobox>
- Input with search text filtering
- Dropdown list of matching countries from TravelCoverageMap (international mode) or domestic cities (domestic mode)
- Keyboard navigable (arrow keys, Enter to select, Escape to close)
- Shows country flag or region label as hint
- Clears on mode switch (international ↔ domestic)
- Mobile: opens as bottom sheet (matches mockup modal pattern)
```

**Data source:** `getNormalizedTravelCoverages(TravelCoverageMap)` — same as ecommerce.

Filter logic (port from ecommerce):
- **International mode:** exclude `DOMESTIC` area entries, exclude `PHILIPPINES` itself
- **Domestic mode:** only `TravelCoverageMap.DOMESTIC` entries
- **Origin ("Travelling from"):** only Philippine locations (`PHILIPPINES` + `DOMESTIC` entries) — always Philippines for redesign, keep as disabled display field but send `PHILIPPINES` code

#### 1.2 Multi-destination support

Redesign currently only supports a single destination. The ecommerce MultiSelect allows selecting multiple countries and builds a `travelDetailList` array. For the redesign:

- Phase 1 (this sprint): support **single destination** only (combobox, not multi-select) — the `travelDetailList` array will have one entry. This matches the mockup's trip details form.
- The mockup does not explicitly show multi-destination on step 1; defer multi-destination to a follow-up spec.

#### 1.3 Form state alignment

Map redesign fields → ecommerce store fields:

| Redesign field | Ecommerce field | Notes |
|----------------|-----------------|-------|
| `tripType === 'single'/'annual'` | `isAnnualMultiTrip` | ✅ already mapped |
| `coverageType === 'individual'/'family'` | `travelType === 'INDIVIDUAL'/'FAMILY'` | ✅ mapped but auto-detect logic differs |
| `destinationType` | `travelDetailList[0].TravelCoverageArea` | 'DOMESTIC' or resolved area |
| `country` (selected combobox value) | `travelDetailList[0].TravelCountry` (country code) | Need `resolveCountryCode()` |
| `departure` | `departureDate` | ✅ |
| `returnDate` | `returnDate` | ✅ |
| `birthDate` | `dateOfBirth` | ✅ |
| `adults` | `noOfAdults` | ✅ |
| `children` | `noOfChildren` | ✅ |
| `reviewed` | `agreedToTerms` | ✅ |
| *(missing)* | `PlaceOfOrgin` | Always `PHILIPPINES` (send code, not label) |
| *(missing)* | `DisplaySequence` | Always `1` for single destination |

#### 1.4 Validation

Add Zod-based validation mirroring `travelInsuranceSchema`:
- Departure date ≥ today
- Return date ≥ departure date
- Annual trip: return = departure + 1 year (auto-set, disabled)
- Lead traveller DOB: must be ≥ 18 years old
- Destination: required (not empty)
- `agreedToTerms`: must be `true`

Show inline field errors below each input on submit attempt.

#### 1.5 Skeleton loading

On initial page load (before hydration), show the same skeleton pattern from ecommerce:
- Three skeleton pill rows (matching the form field layout)
- Use `Skeleton` component (already exists in redesign? — check; add if missing)

#### 1.6 "Modify search" behavior (for later steps)

The trip details form must also function as a **modal** (opened from steps 2–4 via "Modify search"). This means:
- Extract form fields into a `<TripDetailsFormFields>` subcomponent
- Wrap in a `<dialog>` / sheet on mobile, inline panel on desktop when in "modify" context
- On submit from modify context: re-run compare, navigate back to `/plans`

---

## 2. Step 2 — Choose a Plan (`/plans`)

**File:** `src/app/[agent-code]/travel-insurance/plans/page.tsx`

### Current issues in redesign

| Issue | Detail |
|-------|--------|
| `CATALOG_PLANS` fallback with hardcoded dummy data | Must be removed; show empty/no-results state when API returns nothing |
| Provider filter uses hardcoded `['ALL','FPG','LIBERTY','PIONEER','ETIQA']` | Must derive providers dynamically from API response |
| Premium calculation `plan.grossPremium * totalTravellers` | Incorrect — use `plan.DuePremium` (already per-group from API), not multiply |
| `schengenApproved` is hardcoded `true` on all mapped plans | Must map from actual plan data or remove filter |
| `medicalLimit`, `baggageLimit`, `flightDelayLimit` are hardcoded fallbacks | Must map accurately from `plan.MainBenefits` |
| No skeleton loading state | Must show skeleton cards during `status === 'loading'` (not just a spinner) |
| No "Edit search" that opens modify modal | "Modify Search" link goes to landing page (full redirect); should open modal |
| Trip summary strip missing return date and trip type | Mockup shows destination, date range (departure → return), traveller count |
| Mobile: no sticky bottom travel details bar | Mockup has sticky bottom bar on mobile |
| Compare mode not implemented | Mockup shows List/Compare toggle; implement compare drawer |
| No reset to search if no `TravelCountry` in store | Ecommerce redirects; redesign doesn't guard |

### Required changes

#### 2.1 Real data only, no fallback dummy catalogue

```
if (status === 'loading') → show <PlanCardSkeleton> × 3
if (status === 'error') → show error state with retry
if (status === 'ready' && cards.data.length === 0) → show NoPlanState
if (status === 'ready' && cards.data.length > 0) → show plan cards from API
```

Remove `CATALOG_PLANS` entirely.

#### 2.2 Skeleton loading (mockup-accurate)

Per mockup, skeleton cards show:
- Placeholder for provider logo + name (gray rect, ~120×32)
- Two lines for plan name (wider + narrower rect)
- 2×2 benefit grid placeholders
- Price placeholder (right-aligned)
- Button placeholder

Use `<Skeleton>` component (animate-pulse rects) — same as ecommerce's `<PlanCardSkeleton>`.

#### 2.3 Benefit mapping from API

Map `plan.MainBenefits[]` to display labels:

```typescript
const getKeyBenefits = (plan: InsurancePlan) => ({
  medical: findBenefit(plan, ['medical', 'hospitalization']),
  evacuation: findBenefit(plan, ['evacuation', 'repatriation']),
  baggage: findBenefit(plan, ['baggage', 'luggage']),
  flightDelay: findBenefit(plan, ['flight delay', 'delay']),
})

// findBenefit: searches BenefitDesc for keyword match, returns Limit.Label or formatted Amount
```

If a benefit is not found: show `—` not a hardcoded value.

#### 2.4 Premium display

- Use `plan.DuePremium` (or `plan.GrossPremium`) from API — already accounts for group
- Display: `PHP X,XXX` with locale formatting (`en-PH`)
- Label: "Total premium" (not "Total for N travellers × price")
- Show VAT note: "Inclusive of taxes and fees" (per mockup)

#### 2.5 Provider filter — dynamic

Build provider list from returned plan data:
```typescript
const providers = useMemo(() => {
  const seen = new Set<string>()
  return [{ code: 'ALL', name: 'All Providers' }, 
    ...allPlans.filter(p => {
      if (seen.has(p.carrierCode)) return false
      seen.add(p.carrierCode)
      return true
    }).map(p => ({ code: p.carrierCode, name: p.carrierName }))
  ]
}, [allPlans])
```

#### 2.6 Trip summary strip

Expand current strip to match mockup:
```
[MapPin] Philippines → {destination}   |   [Calendar] {departureDate} – {returnDate} · {N} days   |   [Users] {N adults} · {N children}   [Modify search →]
```

"Modify search" opens `<ModifySearchSheet>` (bottom sheet mobile, dialog desktop) — contains the `<TripDetailsFormFields>` from Step 1.

#### 2.7 Mobile sticky bottom bar

On mobile (< lg), show sticky bottom bar:
```
[MapPin destination]   [dates]   [users]   [Modify ↑]
```
Same data as the desktop trip summary strip, compressed for mobile.

On scroll, this bar should remain fixed at bottom (z-30, border-t).

#### 2.8 Compare mode (mockup feature)

Implement List/Compare toggle:
- **List mode** (default): current card layout
- **Compare mode**: side-by-side table up to 3 plans
  - User clicks "Add to compare" checkbox on each card
  - Compare drawer/table shows when ≥2 plans selected
  - "Remove" per column, clear all button
  - Mobile: horizontal scroll

This requires:
- `selectedForCompare: string[]` local state (max 3)
- `<CompareTable>` component: columns = selected plans, rows = benefit names from union of all benefits

#### 2.9 Session guard

If `travelDetails.travelDetailList?.[0]?.TravelCountry` is empty, redirect to `/[agent-code]/travel-insurance` (same as ecommerce).

---

## 3. Step 3 — Generate Quote (`/quote`)

**File:** `src/app/[agent-code]/travel-insurance/quote/page.tsx`

### Current issues in redesign

| Issue | Detail |
|-------|--------|
| Only Traveller 1 form; no multi-traveller tabs | Ecommerce handles N travellers with tabs; redesign ignores travellers 2–N |
| Missing fields: suffix, address (province/city/zip/line1/line2) | Required by API (`personalInfoSchema`) |
| `ADDONS_LIST` is hardcoded dummy data | Must use `plan.AddonBenefits` from selected plan's API response |
| Add-on prices are hardcoded (250, 320, 450 PHP) | Must use actual `AddonBenefit.DuePremium` or `GrossPremium` |
| `basePlanPrice = 1450` hardcoded | Must use `coverageOption.selectedPlan.DuePremium` |
| `grandTotal = totalPerPerson * totalTravellers` | Wrong — plan premium is already total; use `DuePremium` directly (or use apiResponse once generated) |
| No ID upload (OCR) | Ecommerce has `<IdUploadWithOcr>` (Paddle OCR); redesign has no upload |
| No COVID vaccination checkbox | Required by ecommerce schema (`isCovidVaccinated`) |
| No data sharing consent per-traveller | Required (`is_data_sharing_consent` must be `true`) |
| `hasBeneficiary` simplification | Redesign uses single `beneficiaryName` text field; ecommerce uses firstName/middleName/lastName/DOB/relationship |
| Mobile number field missing `+63` prefix UI | Ecommerce shows "+63" prefix inline |
| Gender field is `<select>` | Ecommerce uses pill toggle (Male/Female) — matches mockup |
| No `suffix` field | Required field in ecommerce schema |
| Province/City are plain text inputs | Ecommerce uses cascading selects from `provinces`/`citiesMunicipalities` data; ZIP auto-fills |
| No `idFrontUploaded`/`idBackUploaded` validation | Ecommerce requires ID photo upload |
| `consentChecked` sends to dummy `dummyProposalNo` | Must call real `useFullQuoteRequest()` API |
| No per-traveller validation with tab error indicators | Ecommerce highlights tabs with errors |
| Summary sidebar prices are hardcoded | Use real plan data |

### Required changes

#### 3.1 Multi-traveller tabs (port from ecommerce)

```
<TravelerTabs>
  - One tab per traveller (noOfAdults + noOfChildren)
  - Tab label: "Traveller 1 (Adult)", "Traveller 2 (Child)", etc.
  - Error indicator on tab if that traveller has validation errors
  - Navigation: Previous traveller / Next traveller buttons
  - Last traveller tab shows "Generate Quote" button
```

Use TanStack Form + `travelersFormSchema` (same as ecommerce).

#### 3.2 Field mapping (all travellers)

Each traveller card must contain:

**Identity**
- ID Type (Select — all PH_ID_TYPES, 14 options)
- ID Number (text, with format hint from `getIdFormatDescription()`)
- ID Front Upload + ID Back Upload (optional but encouraged — use `<IdUploadWithOcr>` dynamic import)

**Name**
- First Name *
- Middle Name (optional)
- Last Name *
- Suffix (select: JR/SR/II/III/IV/V/VI/VII/ETAL./No Suffix)

**Personal**
- Gender (Male/Female pill toggle)
- Date of Birth * (age-gated: adults ≥18, children < 18)
- Email Address * (for policy delivery)
- Mobile Number * (with +63 prefix, 10 digits starting with 9)

**Address** (port cascading selects)
- Province * (Select from `provinces` list, ~82 entries)
- City/Municipality * (Select filtered by selected province from `citiesMunicipalities`)
- ZIP Code * (auto-populated when city selected via `getZipCodeByCityCode()`)
- Address Line 1 * (max 45 chars)
- Address Line 2 * (max 45 chars)

**Declarations**
- ☐ I am fully vaccinated against COVID-19
- ☑ I agree to the Data Sharing Consent Agreement * (required)

**Beneficiary (optional per traveller)**
- ☐ I have a beneficiary (toggle)
- If toggled: First Name, Middle Name, Last Name, Date of Birth, Relationship

#### 3.3 Add-ons from real API

Render add-ons from `coverageOption.selectedPlan?.AddonBenefits` (port from ecommerce `<TravelAddonsSection>`):
- If `AddonBenefits` is empty/undefined: hide add-ons section (don't show dummy items)
- Each add-on: BenefitDesc, description (if available), price (DuePremium or formatted limit)
- Toggle on/off → update `coverageOption.selectedAddonBenefits`

#### 3.4 Real API submission

On submit (last traveller's "Generate Quote" button):
1. Validate all travellers with `travelersFormSchema`
2. Call `useFullQuoteRequest()` → `mapToIgwFullQuoteRequest()`
3. On success: `setApiResponse()` → `nextStep()` → navigate to `/review`
4. On error: show `<AlertDialog>` with error details (port from ecommerce)

#### 3.5 Summary sidebar — real data

- Destination: from `travelDetails.travelDetailList[0].TravelCountry` (titleCase)
- Plan: `coverageOption.selectedPlan.CarrierPlanDesc`
- Travellers: `noOfAdults + noOfChildren`
- Add-ons: list selected add-on names
- Total Payable: `coverageOption.selectedPlan.DuePremium` (formatted)
- Note: "Inclusive of 12% VAT, doc stamps & local taxes"
- **After API call succeeds:** use `apiResponse.data.DuePremium`

#### 3.6 Mobile sticky bar

During Step 3, show mobile bottom bar:
```
[Back]   [Total: PHP X,XXX]   [Next traveller / Generate Quote]
```
- "Back" → previous traveller or back to `/plans`
- Center: total premium (from plan)
- Right: context action

---

## 4. Step 4 — Review Quote (`/review`)

**File:** `src/app/[agent-code]/travel-insurance/review/page.tsx`

### Current issues in redesign

| Issue | Detail |
|-------|--------|
| Traveller details only show Traveller 1 | Must show all travellers in expandable sections |
| Missing: address, suffix, COVID status, ID details | Review must show all submitted data |
| Premium hardcoded `1450 * totalTravellers` | Must use `apiResponse.data.DuePremium` |
| Missing: add-ons breakdown in review | Selected add-ons should be listed |
| Missing: benefit schedule section | Ecommerce shows selected plan's benefits table |
| `refCode` may be null | Must handle case where step 3 API hasn't been called |
| No real proposal number | `apiResponse.data.ProposalNo` must be used |
| "Guaranteed price valid for 48 hours" is dummy text | Replace with actual expiry from API if available |

### Required changes

#### 4.1 Full proposal data from store

Use `apiResponse.data` (from `useFullQuoteResponseStore`) for all display:

```typescript
const proposalNo = apiResponse?.data?.ProposalNo || refCode
const duePremium = apiResponse?.data?.DuePremium
```

If `apiResponse` is null (user navigated directly), redirect to `/quote`.

#### 4.2 All travellers review

Show each traveller in collapsible `<details>` sections:
```
▼ Traveller 1 (Lead / Adult)
  Name: Juan Santos Dela Cruz Jr.
  DOB: May 15, 1990 (Age 36)
  Gender: Male
  Email: juan@example.com
  Mobile: +63 917 123 4567
  ID: Passport — P1234567A
  Address: 123 Rizal St., Brgy. San Antonio, Makati City, NCR, 1209
  COVID Vaccinated: Yes
  Beneficiary: Maria Dela Cruz (Spouse)

▼ Traveller 2 (Child)
  ...
```

#### 4.3 Plan & benefit summary

Show selected plan's benefits in a compact table (ecommerce `<ReviewCoverage>` equivalent):
- Plan name, carrier, sum insured
- Key benefits table (2-column: benefit name / limit)
- Selected add-ons list

#### 4.4 Pricing breakdown

```
Base Plan Premium:     PHP X,XXX
Add-ons (if any):      PHP XXX
VAT (12%):             PHP XXX
Documentary Stamp:     PHP XX
LGT:                   PHP XX
────────────────────────────────
Total Due:             PHP X,XXX
```

Use `apiResponse.data.GrossPremium`, `VatAmount`, `LGTAmount`, `StampDuty` fields.

#### 4.5 Mobile sticky bar

```
[Back]   [Proposal: OI-PRP-XXXXX]   [Proceed to Payment →]
```

#### 4.6 "Need to change something?" notice

Keep the locked-proposal notice. Add link to regenerate (back to trip details) or back to quote form.

---

## 5. Step 5 — Payment (`/payment`)

**File:** `src/app/[agent-code]/travel-insurance/payment/page.tsx`

### Current issues in redesign

| Issue | Detail |
|-------|--------|
| Payment methods are hardcoded logos/brands | Must integrate with actual DLT/payment gateway from ecommerce |
| Billing payer fields are extra forms not in ecommerce | Ecommerce's payment component (`<TravelInsurancePayment>`) uses `usePaymentPhaseStore` and DLT redirect |
| `grandTotal` hardcoded | Must use `apiResponse.data.DuePremium` |
| No idle-session timeout | Ecommerce uses `useIdleService('travel-insurance-form', 15, handleIdle)` |
| No payment phase states | Ecommerce has `paymentPhase`: idle → processing → success/error |
| Routes to `/issuance` on success | Ecommerce goes to `policy-display` via `PolicyDisplay` component |

### Required changes

#### 5.1 Port ecommerce payment component

The payment step is complex — it uses the DLT payment gateway with redirect flow:

1. Extract `<TravelInsurancePayment>` logic from ecommerce into redesign
2. Use `usePaymentPhaseStore` for phase management
3. DLT redirect: the payment page redirects to payment provider; on return, URL contains `?status=success|failure&txn=...` or `?reference_id=...`
4. Handle return URL params to update phase
5. Show payment method logos from API/config (not hardcoded)

Payment states:
```
idle → [user selects method + clicks Pay]
  → processing (show spinner, disable UI)
  → redirect (DLT opens payment window)
  → [return from DLT]
  → success → navigate to /issuance
  → error → show error + retry
```

#### 5.2 Real premium display

```
Proposal: {apiResponse.data.ProposalNo}
Plan: {coverageOption.selectedPlan.CarrierPlanDesc}
Premium: PHP {apiResponse.data.DuePremium}
[Pay PHP X,XXX & Issue Policy →]
```

#### 5.3 Idle session timeout

Port `useIdleService('travel-insurance-form', 15, handleIdle)` — 15-minute idle timeout shows alert.

#### 5.4 Mobile sticky bar

```
[Back to Review]   [Total: PHP X,XXX]   [Pay & Issue Policy →]
```

---

## 6. Policy Issuance Page (`/issuance`)

**File:** `src/app/[agent-code]/travel-insurance/issuance/page.tsx`

### Current issues

| Issue | Detail |
|-------|--------|
| `setTimeout(2500)` simulates issuance — not real | Must call real `issue-quote` API (`useIssueQuote` or equivalent) |
| `setPolicyNo(dummyNumber)` | Must use real policy number from API response |
| Auto-redirects immediately to `/policy` | Should wait for real issuance before showing link |

### Required changes

#### 6.1 Real issuance API call

Port from ecommerce's post-payment issuance flow:
```typescript
// Call issue-quote API with proposal number
const issueResponse = await fetch('/api/travel-insurance/issue-quote', {
  method: 'POST',
  body: JSON.stringify({ ProposalNo: proposalNo })
})

if (issueResponse.ok) {
  setPolicyNo(issueResponse.data.PolicyNo)
  // Show success state, enable "View Policy" button
} else {
  // Show error with support contact
}
```

#### 6.2 Progress timeline states

Animate timeline steps based on real API progress:
1. ✅ Payment confirmed (always green on entry)
2. ⟳ Issuing policy... → ✅ when API responds
3. ⟳ Preparing certificate... → ✅ when policy PDF ready

#### 6.3 Email notification

Show: "Your policy and receipt will be sent to {email}." (from `travelersInfo[0].email`)

---

## 7. Policy Issued Page (`/policy`)

**File:** `src/app/[agent-code]/travel-insurance/policy/page.tsx`

### Current state
This page exists but needs to be verified against the mockup at `/mockups/travel/policy-issued`.

### Required changes

#### 7.1 Display real policy data

Use `policyNo` from store and `apiResponse.data` to show:
- Policy/Certificate number (large, copyable)
- Insurer name and plan name
- Coverage period (effective date → expiry date)
- Insured travellers (names)
- Key benefit summary

#### 7.2 Download certificate

- "Download Certificate of Cover" button → triggers PDF generation or links to issued document URL
- Ecommerce uses `<TravelPolicyPdf>` component for PDF rendering
- Port or link to same PDF generator

#### 7.3 Email re-send

"Resend to email" button → call API to resend

#### 7.4 "Start a new quote" action

Clear all store state and navigate to `/[agent-code]/travel-insurance`.

---

## 8. Shared Components to Build / Port

### 8.1 `<DestinationCombobox>` (new)

A searchable input for selecting travel destinations. Required for Step 1.

```
Props: {
  options: Array<{ value: string; label: string; area: string }>
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  mode: 'international' | 'domestic'
}
Behavior:
  - Type to filter
  - Show region group headers (APAC, SCHENGEN, WORLD, DOMESTIC)
  - Click or keyboard-select to choose
  - On mobile: triggers bottom sheet
  - "Clear" button when value is set
```

### 8.2 `<PlanCardSkeleton>` (port from ecommerce)

Already exists in ecommerce as `NoPlanState` and `PlanCardSkeleton` in `@/components/ui/insurance-shared`. Port to redesign.

### 8.3 `<ModifySearchSheet>` (new)

Bottom sheet (mobile) / dialog (desktop) that contains `<TripDetailsFormFields>`. Triggered from "Modify search" links on Steps 2–4.

```
Props: {
  open: boolean
  onClose: () => void
  onSearch: () => void  // re-runs compare API
}
```

### 8.4 `<TravelStickyBar>` (adapt from ecommerce `<TripStickyBar>`)

Mobile-only sticky bottom summary bar shown on Steps 2–4.

Ecommerce has `<TripStickyBar>` — port to redesign with mockup styling.

```
Props: {
  step: 2 | 3 | 4 | 5
  premium: number
  onBack: () => void
  onNext: () => void
  nextLabel: string
  backLabel: string
}
```

### 8.5 `<TravelerTabs>` (adapt from ecommerce)

Multi-traveller tab navigation for Step 3. See §3.1.

### 8.6 Skeleton components

```typescript
// Shared skeleton shapes
<PlanCardSkeleton />   // for step 2 loading
<TravelerFormSkeleton />  // for step 3 hydration
```

---

## 9. Store Changes

The redesign uses the same `useTravelInsuranceStore` (already ported from ecommerce). Verify these fields are present and typed correctly:

| Field | Status |
|-------|--------|
| `travelDetails` | ✅ present |
| `travelersInfo` | ✅ present |
| `coverageOption.selectedAddonBenefits` | ✅ present |
| `refCode` | ✅ present |
| `policyNo` | ✅ present |
| `setRefCode` | ✅ present |
| `setPolicyNo` | ✅ present |
| `step` / `setStep` | ✅ present |
| `isLoadingProposal` | ❓ — verify if present in redesign store |
| `resetForm` | ❓ — verify if present |
| `clearProposalNumber` (util) | ❓ — check `payment-storage` util |

**Action:** Audit redesign's `src/store/travel-insurance-store.ts` vs ecommerce's to ensure full parity. Add any missing actions.

---

## 10. API Routes

Both projects share identical API routes under `src/app/api/travel-insurance/`. The redesign has all routes already ported:

| Route | Status |
|-------|--------|
| `compare-quote` | ✅ present |
| `full-quote` | ✅ present |
| `init-compare` | ✅ present |
| `issue-quote` | ✅ present |
| `load-quote-by-cache` | ✅ present |
| `load-quote` | ✅ present |

**Action:** Verify route implementations match ecommerce (especially `issue-quote` which the issuance page currently doesn't call).

---

## 11. UI Quirks to Fix

### 11.1 Step 1 form
- `country` state defaults to `'Japan'` → must default to `''` (empty, force user to select)
- `reviewed` defaults to `true` → should default to `false`
- Date inputs use native browser date picker → OK, but ensure consistent styling with `ui-form-field` class
- The "Travelling from" select has no icon alignment — ensure SVG icon left-aligns with field height
- On mobile, the form section (right column) stacks below the aside, but should display form prominently on mobile

### 11.2 Step 2 plan cards
- Benefit labels "Medical Evacuation" and "Baggage Loss" are swapped relative to mockup column order
- "PHP X × N travellers" pricing formula is wrong; just show `plan.DuePremium` as-is
- `<Plane>` icon import is unused in plans page
- `schengenApproved` is hardcoded `true` for all API-mapped plans

### 11.3 Step 3 quote form
- `idType` state initialization uses `as any` cast — use proper `PhilippineIdType` type
- `dateOfBirth` defaults to hardcoded `'1995-05-15'` → should pull from `travelDetails.dateOfBirth`
- `dummyProposalNo` must be replaced with real API call
- `setRefCode` is called before API responds — remove dummy proposal generation

### 11.4 Step 4 review
- `1450 * totalTravellers` hardcoded pricing → remove entirely
- Fallback display values like `'maria.delacruz@example.com'` and `'P1234567A'` → use store or show empty state
- `refCode || 'OI-PRP-512938'` → never fallback to hardcoded proposal numbers

### 11.5 Step 5 payment
- Billing payer form (name, address, zip) is not in ecommerce — review whether DLT gateway requires this or if it can be dropped/simplified
- `grandTotal` calculation is hardcoded → use `apiResponse.data.DuePremium`

### 11.6 Issuance
- `setTimeout(2500)` fake delay → replace with real API call
- `setPolicyNo('POL-TRV-' + timestamp)` fake number → use API response

---

## 12. Mobile Optimization Checklist

| Requirement | Step | Action |
|-------------|------|--------|
| Trip details form stacks cleanly | 1 | Verify 1-col on mobile; form inputs full width |
| Destination combobox opens bottom sheet | 1 | Implement `<DestinationCombobox>` with sheet |
| Traveller popover fits mobile screen | 1 | Already OK — verify width |
| Plan cards readable on 375px | 2 | Reduce 12-col grid; 1-col on mobile |
| Filter sidebar collapses to filter button | 2 | Filter drawer / bottom sheet on mobile |
| Sticky trip summary bar | 2–4 | `<TravelStickyBar>` fixed bottom |
| Tab scroll on step 3 (many travellers) | 3 | `overflow-x-auto` tabs, gradient fade edges |
| Address selects: large tap targets | 3 | min-h-11 on all selects |
| Review sections scrollable | 4 | No horizontal overflow |
| Payment method grid: 2 cols on mobile | 5 | `grid-cols-2` on mobile, 3 on sm+ |
| All CTAs min-h-11 (44px) | All | Audit all `<button>` elements |
| Focus ring visible | All | `focus-visible:outline-2 outline-[#006838]` |

---

## 13. Implementation Order (Recommended)

1. **Store audit** — ensure redesign store matches ecommerce fields (§9)
2. **Step 1: Searchable combobox** — highest impact UX fix; unblocks correct API data (§1.1)
3. **Step 2: Remove dummy data + skeleton** — stops shipping hardcoded plans (§2.1, §2.2)
4. **Step 2: Real benefit/price mapping** (§2.3, §2.4)
5. **Step 2: Trip summary strip + modify search modal** (§2.6, §8.3)
6. **Step 2: Mobile sticky bar** (§2.7, §8.4)
7. **Step 3: Multi-traveller form + all fields** — largest component work (§3.1, §3.2)
8. **Step 3: Real add-ons + API submission** (§3.3, §3.4)
9. **Step 4: Full review from real data** (§4.1–§4.4)
10. **Step 5: Port DLT payment component** (§5.1)
11. **Issuance: Real issue-quote API** (§6.1)
12. **Policy: Real data display + PDF** (§7.1–§7.2)
13. **Cross-step mobile sticky bar** (§8.4)
14. **Accessibility + responsive audit** (§12)

---

## 14. Field Cross-Reference: ecommerce → redesign

### Step 1 — Trip Details Form

| ecommerce field | ecommerce component | redesign current | Gap |
|-----------------|--------------------|--------------------|-----|
| `isAnnualMultiTrip` | Toggle (Single/Annual pill) | ✅ toggle present | None |
| `travelType` (INDIVIDUAL/FAMILY) | Coverage type select + "travelling as family" checkbox | ✅ radio group | None |
| `travelDetailList[0].TravelCountry` | MultiSelect combobox | ❌ plain `<select>` with 22 entries | **Replace with searchable combobox** |
| `travelDetailList[0].PlaceOfOrgin` | ComboBox (Philippines only) | ✅ disabled Philippines | Send `PHILIPPINES` code not label |
| `travelDetailList[0].TravelCoverageArea` | Derived from selected country | ✅ derived via `resolveCoverageArea()` | None |
| `departureDate` | DateTimePicker | ✅ native date input | None |
| `returnDate` | DateTimePicker (disabled for annual) | ✅ | None |
| `dateOfBirth` | DateTimePicker | ✅ | None |
| `noOfAdults` | Popover counter (1–10) | ✅ popover counter | Fix max: 9→10 |
| `noOfChildren` | Popover counter (0–10) | ✅ | Fix max: 9→10 |
| `agreedToTerms` | Checkbox + T&C link | ✅ checkbox present | Default false; add T&C link |
| Multi-destination | MultiSelect (multiple countries) | ❌ single only | **Defer to later sprint** |

### Step 3 — Traveller Info Form

| ecommerce field | ecommerce component | redesign current | Gap |
|-----------------|--------------------|--------------------|-----|
| `firstName` | Input | ✅ | None |
| `middleName` | Input (optional) | ✅ | None |
| `lastName` | Input | ✅ | None |
| `suffix` | Select (JR/SR/etc.) | ❌ missing | **Add suffix select** |
| `gender` | Male/Female pill toggle | ❌ `<select>` | **Replace with pill toggle** |
| `dateOfBirth` | DateTimePicker (age-gated) | ✅ date input | Add age-gate validation |
| `email` | Input | ✅ | None |
| `mobileNumber` | Input with +63 prefix | ❌ plain input `+63 prefix` | **Add +63 prefix UI** |
| `idType` | Select (14 PH ID types) | ⚠️ 4 types only | **Expand to all 14** |
| `idNumber` | Input + format hint | ⚠️ no format hint | **Add `getIdFormatDescription()`** |
| `idFrontUploaded` + `idBackUploaded` | IdUploadWithOcr | ❌ missing | **Add ID upload** (optional flag) |
| `address.province` | Select from provinces list | ❌ missing | **Add cascading province select** |
| `address.city` | Select filtered by province | ❌ missing | **Add cascading city select** |
| `address.zipCode` | Auto-filled from city | ❌ missing | **Add ZIP auto-fill** |
| `address.line1` | Input (max 45 chars) | ❌ missing | **Add address line 1** |
| `address.line2` | Input (max 45 chars) | ❌ missing | **Add address line 2** |
| `isCovidVaccinated` | Checkbox | ❌ missing | **Add COVID checkbox** |
| `is_data_sharing_consent` | Checkbox * (required) | ⚠️ one global consent | **Make per-traveller** |
| `hasBeneficiary` | Checkbox toggle | ✅ checkbox | None |
| `beneficiary.firstName` | Input | ❌ single name field | **Split into first/middle/last** |
| `beneficiary.middleName` | Input | ❌ | **Add** |
| `beneficiary.lastName` | Input | ❌ | **Add** |
| `beneficiary.dateOfBirth` | DateTimePicker | ❌ missing | **Add** |
| `beneficiary.relationship` | Input | ⚠️ `<select>` with 5 options | ecommerce uses free-text input; align |

### Travellers 2–N

| ecommerce | redesign current | Gap |
|-----------|-----------------|-----|
| Tab per traveller (N = noOfAdults + noOfChildren) | ❌ only Traveller 1 | **Port tab system** |
| Tab error indicators | ❌ | **Add** |
| "Previous traveller" / "Next traveller" navigation | ❌ | **Add** |

---

## 15. Notes

- **TanStack Form vs plain state:** Redesign Steps 3–4 use plain `useState`; ecommerce uses TanStack Form with Zod. For full validation fidelity, Steps 3 in redesign should migrate to TanStack Form + `travelersFormSchema`.
- **OCR ID upload:** `<IdUploadWithOcr>` uses Paddle OCR (WASM). It's a dynamic import with `ssr: false`. It's optional — users can skip photo upload and type manually. Include the upload component but make it non-blocking for form submission.
- **Province/City data:** `provinces` and `citiesMunicipalities` constants exist in ecommerce at `src/constants/phil-prov` and `src/constants/phil-city-mun`. Copy to redesign if not present.
- **`getZipCodeByCityCode` util:** exists in ecommerce at `src/utils/address-util`. Copy to redesign.
- **Proposal retrieval:** The redesign's "Retrieve a proposal" modal currently shows a dummy failure message. Port the real `load-quote` flow from ecommerce's avail page (the `loadProposal` async function).
- **Session idle timeout:** Port `useIdleService` hook from ecommerce to redesign for Step 3 and Step 5.

---

## 16. Mockup Markup & CSS Architecture Specifications

The redesign must strictly adopt the exact classes, DOM structure, and CSS transitions from the mockup HTML templates (`ecommerce-redesign/docs/mockups/`):

### 16.1 Step 2 Skeleton Loading Component (`<PlanCatalogSkeleton>`)

From `travel-step-2.html`:
```html
<div aria-hidden="true" class="travel-skeleton">
  <div class="travel-skeleton__block mb-3 h-4 w-48"></div>
  <div class="travel-skeleton__block h-10 w-full max-w-xl sm:h-12"></div>
  <div class="travel-skeleton__block mt-3 h-6 w-full max-w-2xl"></div>
  <div class="travel-skeleton__block mt-2 h-4 w-56"></div>

  <!-- Summary Skeleton Bar -->
  <div class="travel-trip-summary">
    <div><span class="travel-skeleton__block size-5 shrink-0"></span><div><div class="travel-skeleton__block mb-2 h-4 w-24"></div><div class="travel-skeleton__block h-5 w-48"></div></div></div>
    <div><span class="travel-skeleton__block size-5 shrink-0"></span><div><div class="travel-skeleton__block mb-2 h-4 w-24"></div><div class="travel-skeleton__block h-5 w-56"></div></div></div>
    <div><span class="travel-skeleton__block size-5 shrink-0"></span><div><div class="travel-skeleton__block mb-2 h-4 w-24"></div><div class="travel-skeleton__block h-5 w-32"></div></div></div>
    <div class="travel-skeleton__block ml-auto h-11 w-44"></div>
  </div>

  <!-- 248px Rail + Cards Skeleton Grid -->
  <div class="travel-results__layout">
    <aside class="travel-filters">
      <div class="flex justify-between border-b border-[#edf0ed] pb-4 dark:border-[#3d4140]">
        <div class="travel-skeleton__block h-4 w-16"></div>
        <div class="travel-skeleton__block h-4 w-10"></div>
      </div>
      <div class="mt-7">
        <div class="travel-skeleton__block mb-3 h-4 w-24"></div>
        <div class="flex min-h-11 items-center gap-3 px-2"><div class="travel-skeleton__block size-4 shrink-0 rounded-full"></div><div class="travel-skeleton__block h-4 w-36"></div></div>
        <div class="flex min-h-11 items-center gap-3 px-2"><div class="travel-skeleton__block size-4 shrink-0 rounded-full"></div><div class="travel-skeleton__block h-4 w-28"></div></div>
      </div>
    </aside>

    <div class="min-w-0">
      <div class="travel-plan-toolbar">
        <div class="travel-skeleton__block h-14 min-w-0 flex-1"></div>
        <div class="travel-skeleton__block h-12 w-44"></div>
      </div>
      <div class="travel-plan-list">
        <!-- 3x Card Skeletons -->
        <div class="travel-plan-card">
          <div class="travel-plan-card__summary">
            <div class="travel-plan-card__info">
              <div class="travel-skeleton__block mb-3 h-4 w-40"></div>
              <div class="travel-skeleton__block h-7 w-4/5"></div>
              <div class="travel-plan-benefits">
                <div class="travel-plan-benefit"><div class="travel-skeleton__block size-5 shrink-0"></div><div class="min-w-0 flex-1"><div class="travel-skeleton__block h-4 w-28"></div><div class="travel-skeleton__block mt-2 h-4 w-3/4"></div></div></div>
                <div class="travel-plan-benefit"><div class="travel-skeleton__block size-5 shrink-0"></div><div class="min-w-0 flex-1"><div class="travel-skeleton__block h-4 w-28"></div><div class="travel-skeleton__block mt-2 h-4 w-3/4"></div></div></div>
              </div>
            </div>
            <div class="travel-plan-price">
              <div class="travel-insurer-logo"><div class="travel-skeleton__block h-12 w-36"></div></div>
              <div class="travel-skeleton__block h-8 w-36"></div>
              <div class="travel-skeleton__block mt-5 h-12 w-full"></div>
            </div>
          </div>
          <div class="travel-benefits-toggle"><div class="travel-skeleton__block mx-auto h-4 w-36"></div></div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### 16.2 In-Place & Modal Modify Search (`<ModifySearchDialog>`)

From `travel-step-2.html`:
```html
<dialog
  ref={dialogRef}
  aria-labelledby="modify-search-title"
  class="travel-plan-dialog travel-search-dialog"
  onClick={(e) => e.target === e.currentTarget && onClose()}
>
  <section id="trip-search" aria-labelledby="modify-search-title">
    <div class="min-w-0 rounded-b-xl bg-white p-5 dark:bg-[#262828] sm:p-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 id="modify-search-title" class="text-2xl font-semibold tracking-tight">Your trip details</h3>
          <p class="mt-2 text-base text-[#333] dark:text-[#c4c7c5]">A few details to get started.</p>
        </div>
        <!-- Single vs Annual Toggle -->
      </div>
      <!-- Re-usable <TripDetailsFormFields /> -->
      <div class="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-[#dfe7df] pt-5">
        <div class="flex w-full items-center justify-end gap-3 sm:w-auto">
          <button type="button" onClick={onClose} class="inline-flex min-h-11 items-center justify-center rounded-md border border-[#006838] px-4 py-2 text-sm font-semibold text-[#006838] hover:bg-[#f1f2f0]">Close</button>
          <button type="submit" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#006838] px-5 py-3 text-base font-semibold text-white hover:bg-[#00552e]">Update search →</button>
        </div>
      </div>
    </div>
  </section>
</dialog>
```

### 16.3 Floating Bottom Sticky Travel Details Bar (`.travel-trip-summary--floating`)

Fixed bottom bar activated upon scroll past the header summary bar:
```html
<aside
  class="travel-trip-summary travel-trip-summary--floating"
  aria-label="Your trip summary"
  role="region"
>
  <div>
    <MapPinIcon class="size-5 shrink-0 text-[#006838] dark:text-[#d0e3c8]" />
    <span>
      <span class="travel-trip-label">Destination</span>
      Philippines <span class="px-1">→</span> {destination}
    </span>
  </div>
  <div>
    <CalendarIcon class="size-5 shrink-0 text-[#006838] dark:text-[#d0e3c8]" />
    <span>
      <span class="travel-trip-label">Travel dates</span>
      {departureDateFormatted} – {returnDateFormatted}
    </span>
  </div>
  <div>
    <UsersIcon class="size-5 shrink-0 text-[#006838] dark:text-[#d0e3c8]" />
    <span>
      <span class="travel-trip-label">Travellers</span>
      {travellersCountLabel}
    </span>
  </div>
  <button
    type="button"
    onClick={openModifySearch}
    aria-haspopup="dialog"
    class="travel-modify"
  >
    <AdjustmentsIcon class="size-4" />
    Modify search
  </button>
</aside>
```
**Responsive behavior:**
- **Desktop:** flex row, aligned with container max-width (`1280px`), padding `16px max(24px, calc((100vw - 1280px) / 2))`.
- **Mobile (< 640px):** transforms automatically via `.travel-trip-summary--floating` CSS into a 2-column grid (`grid-template-columns: 1fr 1fr; gap: 12px 16px; padding-inline: 20px; font-size: 12px`).

### 16.4 Multi-Applicant KYC Disclosure Accordions (Step 3)

From `travel-step-3.html`:
```html
<details class="travel-applicant-card travel-kyc-disclosure" open={index === 0}>
  <summary class="flex min-h-11 cursor-pointer items-center justify-between gap-4">
    <h3 class="text-lg font-semibold">Traveller {index + 1} · {applicantType}</h3>
    <ChevronDownIcon class="size-5 shrink-0" />
  </summary>
  
  <div class="pt-6">
    <!-- Valid ID Upload Dropzone (Front + Optional Back) -->
    <section class="rounded-lg border border-[#dfe7df] p-5 dark:border-[#3d4140]">
      <h4 class="font-semibold">Upload valid ID <span class="text-red-600">*</span></h4>
      <p class="mt-2 text-xs text-[#808080] dark:text-[#c4c7c5]">Add a clear image of the front of your ID. The back is optional.</p>
      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <label class="text-sm font-medium">
          Front of ID <span class="text-red-600">*</span>
          <span class="travel-id-dropzone mt-2">
            <span aria-hidden="true" class="text-3xl">↥</span>
            <span>Drop an image here or select a file</span>
            <span class="text-xs font-normal">JPEG, PNG, WebP · Max 5 MB</span>
            <input type="file" accept="image/*" class="..." />
          </span>
        </label>
        <label class="text-sm font-medium">
          Back of ID (optional)
          <span class="travel-id-dropzone mt-2">...</span>
        </label>
      </div>
    </section>

    <!-- Names Grid: First, Middle, Last -->
    <!-- Details Grid: Suffix, Gender, DOB, Email, Mobile, ID Type (14 types), ID Number -->
    <!-- Address Grid: Province, City, Zip, Address 1, Address 2 -->
    <!-- Vaccinated Checkbox + Data Sharing Checkbox & View Agreement Modal -->
    <!-- Beneficiary Sub-section -->
  </div>
</details>
```

### 16.5 Proposal Review & Reference Card (Step 4)

From `travel-step-4.html`:
```html
<section class="travel-applicant-card travel-review-reference" aria-labelledby="proposal-title">
  <div class="travel-review-reference__qr">
    <img src={proposalQrDataUrl} alt={`QR code for proposal ${proposalNumber}`} width="108" height="108" />
  </div>
  <div class="travel-review-reference__number min-w-0">
    <p id="proposal-title" class="text-sm text-[#808080] dark:text-[#c4c7c5]">Proposal number</p>
    <p class="mt-2 break-all text-xl font-semibold sm:text-2xl">{proposalNumber}</p>
    <p class="mt-2 text-sm text-[#808080] dark:text-[#c4c7c5]">Generated proposal · Awaiting payment</p>
  </div>
  <button type="button" onClick={copyProposalNumber} class="...">Copy number</button>
</section>

<!-- Route Card -->
<div class="travel-review-trip__route">
  <dl>
    <dt>Departure</dt>
    <dd>{originAirportOrCity}</dd>
  </dl>
  <div class="travel-review-trip__flight">
    <span></span>
    <PlaneIcon class="size-6 shrink-0" />
    <span></span>
  </div>
  <dl>
    <dt>Destination</dt>
    <dd>{destinationCountryOrCity}</dd>
  </dl>
</div>
```

### 16.6 Payment Channels Grid (Step 5)

From `travel-step-5.html`:
```html
<div class="travel-payment-brands">
  {paymentChannels.map((brand) => (
    <label key={brand.id} class="travel-payment-brand">
      <input type="radio" name="payment_method" value={brand.id} checked={selectedBrand === brand.id} onChange={() => setSelectedBrand(brand.id)} class="sr-only" />
      <span>
        <img src={brand.logoUrl} alt={brand.name} width="80" height="50" />
        <span class="travel-payment-brand__check" aria-hidden="true">✓</span>
      </span>
    </label>
  ))}
</div>
```

### 16.7 Policy Issuance Timeline Progress (`/issuance`)

From `travel-policy-issuance.html`:
```html
<ol class="travel-journey is-enhanced travel-issuance-steps" aria-label="Policy issuance progress">
  <li class="travel-journey__step is-active" style="--journey-progress: 1">
    <span class="travel-journey__marker" aria-hidden="true">✓</span>
    <div class="travel-journey__panel">
      <h2 class="travel-journey__title text-lg font-semibold sm:text-xl">Payment confirmed</h2>
      <p class="mt-2 text-base text-[#333] dark:text-[#c4c7c5]">Your payment has been received.</p>
    </div>
  </li>
  <li class={`travel-journey__step ${issuanceState >= 'issuing' ? 'is-active' : ''}`} aria-current={issuanceState === 'issuing' ? 'step' : undefined}>
    <span class="travel-journey__marker" aria-hidden="true">
      {issuanceState === 'issuing' ? <span class="travel-issuance-spinner is-spinning"></span> : '✓'}
    </span>
    <div class="travel-journey__panel">
      <h2 class="travel-journey__title text-lg font-semibold sm:text-xl">Issuing your policy</h2>
      <p class="mt-2 text-base text-[#333] dark:text-[#c4c7c5]">Generating your policy with the underwriter.</p>
    </div>
  </li>
  <li class={`travel-journey__step ${issuanceState >= 'complete' ? 'is-active' : ''}`}>
    <span class="travel-journey__marker" aria-hidden="true">
      {issuanceState === 'complete' ? '✓' : '3'}
    </span>
    <div class="travel-journey__panel">
      <h2 class="travel-journey__title text-lg font-semibold sm:text-xl">Preparing Certificate of Coverage</h2>
      <p class="mt-2 text-base text-[#333] dark:text-[#c4c7c5]">eCOC and official receipt are ready.</p>
    </div>
  </li>
</ol>
```

