# Manual Test Plan

## Objective

Validate the booking flow against the assessment requirements with a repeatable manual QA checklist that covers:

- four-step happy paths
- deterministic postcode fixtures
- branching logic
- error, loading, and retry states
- review and confirmation behavior
- layout and accessibility sanity checks

## Test Environment

- Application URL: `http://localhost:3000`
- Browser coverage: latest Chrome or Edge for primary execution
- Responsive spot check: mobile-width viewport around `390px`
- Data model: deterministic fixtures backed by local mock APIs

## Deterministic Fixtures

| Fixture | Expected Behaviour |
| --- | --- |
| `SW1A 1AA` | Returns 12 addresses |
| `EC1A 1BB` | Returns 0 addresses |
| `M1 1AE` | Returns addresses after a visible delay |
| `BS1 4DJ` | Returns a temporary error on first lookup, then succeeds on retry |
| `W1A 0AX` | Valid postcode format but outside fixture dataset, so manual entry path should be available |

## Execution Notes

- Reset the flow between scenarios unless the test explicitly depends on prior state.
- Capture screenshots for failed scenarios and for at least one happy path completion.
- Log any mismatch between UI copy and expected result as either a documentation issue or a product bug.

## Test Matrix

### A. Smoke, Layout, and Navigation

| ID | Priority | Scenario | Steps | Expected Result |
| --- | --- | --- | --- | --- |
| MT-01 | High | Desktop smoke load | Open the homepage on desktop. | Hero card, progress card, current step card, and sidebar cards render with no visible breakage. |
| MT-02 | Medium | Mobile layout sanity | Open the homepage on a narrow mobile viewport. | Cards stack vertically, actions remain reachable, and no critical text or controls are clipped. |
| MT-03 | High | Initial step state | Load the page fresh. | Step 1 is active, steps 2 to 4 are muted, and the current step section is `Postcode and address`. |
| MT-04 | Medium | Sidebar default state | Load the page fresh. | Booking state items show pending status, estimate shows `GBP 0.00`, and no completed badges appear yet. |
| MT-05 | Medium | Fixture guidance visibility | Load the page fresh. | The supported postcode fixture alert is visible and lists the expected demo postcodes. |

### B. Step 1: Postcode Lookup and Address Selection

| ID | Priority | Scenario | Steps | Expected Result |
| --- | --- | --- | --- | --- |
| MT-06 | High | Empty postcode submission | Click `Search postcode` with the field empty. | A validation error appears and the user remains on step 1. |
| MT-07 | High | Invalid postcode format | Enter an invalid value such as `123` and search. | A validation error indicates a valid UK postcode is required. |
| MT-08 | Medium | Lowercase postcode normalization | Enter `sw1a 1aa` and search. | The lookup succeeds and behaves the same as `SW1A 1AA`. |
| MT-09 | Medium | Whitespace normalization | Enter `SW1A   1AA` and search. | The postcode is normalized and the populated fixture still resolves. |
| MT-10 | High | Populated fixture success | Search `SW1A 1AA`. | A success message shows 12 addresses found and the address list renders. |
| MT-11 | High | Empty fixture success | Search `EC1A 1BB`. | A no-address result message appears and no lookup address options are shown. |
| MT-12 | High | Delayed fixture loading state | Search `M1 1AE`. | A loading state is visible before the results appear. |
| MT-13 | High | Retryable fixture error | Search `BS1 4DJ` for the first time. | A retryable lookup error is shown with a retry action. |
| MT-14 | High | Retry recovery path | After MT-13, click retry. | The second attempt succeeds and four addresses are displayed. |
| MT-15 | High | Unsupported but valid postcode | Search `W1A 0AX`. | A prototype-data error appears explaining no fixture data is available and manual entry can be used. |
| MT-16 | High | Continue blocked without address | Search `SW1A 1AA` and do not select an address. | `Continue to waste type` remains disabled. |
| MT-17 | Medium | Address reselection | Search `SW1A 1AA`, select address 1, then select address 2. | Only the second address remains selected. |
| MT-18 | High | Manual entry toggle | Click `Enter manually`. | Manual address fields appear and lookup selection is no longer required. |
| MT-19 | High | Manual entry validation | Enter only `Address line 1` and leave city blank. | Step 1 continue remains disabled. |
| MT-20 | High | Manual entry progression | Enter both manual address fields and proceed. | The user can move to step 2 without selecting a lookup address. |

### C. Step 2: Waste Type and Branching Logic

| ID | Priority | Scenario | Steps | Expected Result |
| --- | --- | --- | --- | --- |
| MT-21 | High | Step 2 entry | Complete step 1 successfully and continue. | Step 2 opens and the progress indicator updates to the waste-type phase. |
| MT-22 | High | Waste type required | On step 2, click continue without selecting a waste type. | A validation message appears and the flow stays on step 2. |
| MT-23 | High | General waste selection | Select `General waste`. | The card becomes selected and no extra branching section appears. |
| MT-24 | High | Heavy waste selection | Select `Heavy waste`. | The card becomes selected and the flow can continue to step 3. |
| MT-25 | High | Plasterboard branch visibility | Select `Plasterboard`. | A handling section appears with exactly three options. |
| MT-26 | High | Plasterboard option required | Select `Plasterboard` and continue without choosing a handling option. | A validation message appears and the user remains on step 2. |
| MT-27 | Medium | Plasterboard option selection | Select `Plasterboard`, then choose `Sheeted stacks`. | The chosen handling option is visibly selected. |
| MT-28 | Medium | Back preserves step 1 state | From step 2, click `Back`. | The previously selected lookup address or manual address remains intact on step 1. |

### D. Step 3: Skip Catalogue and Restrictions

| ID | Priority | Scenario | Steps | Expected Result |
| --- | --- | --- | --- | --- |
| MT-29 | High | General waste skip load | Use the general waste path and continue to step 3. | Available and disabled/unavailable skip sections render successfully. |
| MT-30 | High | Heavy waste restrictions | Use the heavy waste path and continue to step 3. | At least the `10-yard` and `12-yard` options are shown as unavailable for heavy waste. |
| MT-31 | High | Disabled skip visibility | Review a disabled heavy-waste skip card. | The card stays visible, shows an unavailable status, and cannot be selected. |
| MT-32 | High | Continue blocked without skip | Reach step 3 and do not select any available skip. | `Continue to review` remains disabled. |
| MT-33 | Medium | Limited stock selection | Choose a limited-but-available option such as `10-yard` on a compatible path. | The limited stock badge is visible and the option can still be selected when not disabled. |
| MT-34 | Medium | Change waste type resets skip | Select a skip, go back to step 2, change the waste type, and return to step 3. | The previous skip selection is cleared and must be chosen again. |
| MT-35 | High | Sidebar estimate update | Select a valid skip on step 3. | The sidebar estimate changes from `GBP 0.00` to a non-zero total and the skip state becomes complete. |

### E. Step 4: Review, Pricing, and Confirmation

| ID | Priority | Scenario | Steps | Expected Result |
| --- | --- | --- | --- | --- |
| MT-36 | High | Review step rendering | Complete steps 1 to 3 and continue to review. | Booking summary and price breakdown are both visible. |
| MT-37 | High | General waste pricing | Reach review with `General waste`. | Heavy waste surcharge is `GBP 0.00`, plasterboard handling is `GBP 0.00`, VAT is shown, and a total is calculated. |
| MT-38 | High | Heavy waste pricing | Reach review with `Heavy waste`. | Heavy waste surcharge is non-zero and included in the total. |
| MT-39 | High | Plasterboard pricing | Reach review with `Plasterboard` and `Sheeted stacks`. | The handling option is listed and the plasterboard handling line is non-zero. |
| MT-40 | High | Confirmation success | Click `Confirm booking` once on a valid booking. | A success message appears with a generated booking reference. |
| MT-41 | High | Double-submit protection | After a successful booking, attempt to click confirm again. | The confirm button is disabled and a second booking cannot be submitted. |
| MT-42 | Medium | Review back navigation | From step 4 before confirming, click `Back`. | The user returns to step 3 and the prior selections are preserved. |
| MT-43 | Medium | Full reset flow | After a successful booking, click `Start a new booking`. | The flow resets to step 1 and sidebar states return to pending. |
