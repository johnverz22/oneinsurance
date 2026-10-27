# UAT1 — items needing backend input

## FR-038 — Save every entered beneficiary and include the appropriate beneficiaries on the issued policy

Status: frontend collects beneficiaries; backend contract needed.

Findings (2026-10-21):
- The traveller form collects an optional beneficiary per traveller (first/middle/last name, date of birth, relationship).
- `POST /travel/full-quote` (built in `src/utils/mappers/travel-insurance/full-quote.ts`) sends **no** beneficiary data. Neither `travellers[]` nor `CustomField.TravellerLists[]` carries it.
- `POST /travel/issue-quote` does not send beneficiary data either, so the insurer's official policy cannot include it.
- `GET full-quote/{proposalNo}` (retrieve flow) returns no beneficiary, so retrieved proposals come back with `hasBeneficiary: false`.

Questions for backend:
1. What field(s) should carry a beneficiary per traveller in `full-quote`? Proposed: `travellers[].beneficiary { first_name, middle_name, last_name, date_of_birth (YYYY-MM-DD), relationship }`, omitted when none.
2. Does each insurer (e.g. Malayan) accept one beneficiary per traveller, or one per policy? Which should be included on the issued policy when several travellers have one?
3. Will `GET full-quote/{proposalNo}` and `issue-quote` echo beneficiaries back?

Frontend work once confirmed: add the field to `mapToIgwFullQuoteRequest`, restore it in `proposal-loader.ts`, and show it on the policy page.

Frontend fix already made: the proposal PDF now lists every traveller's beneficiary (previously only the policyholder's).
