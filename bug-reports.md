# Bug Reports
<hr>

## BR-01: Confirmed booking can be mutated from the confirmation page by running a new postcode search

- Severity: High
- Area: Confirmation page / state integrity
- Environment: Staging

### Summary

After a booking is confirmed, the postcode search controls remain active on the left side of the confirmation page. Running another postcode search updates the confirmed booking summary with the new postcode and clears the address, while the page still shows the existing booking reference as confirmed.

### Steps to Reproduce

1. Open `https://rme-wast-task.vercel.app/`.
2. Complete a booking using `SW1A 1AA`, choose an address, select `General waste`, choose `6-yard`, and place the booking.
3. On the confirmation page, change the postcode input to `M1 1AE`.
4. Click `Search postcode`.

### Actual Result

The page still shows `Booking confirmed` and keeps the confirmed reference visible, but the booking details mutate to the new postcode. The address becomes empty again and the confirmation page now represents a mixed state that was never actually booked.

### Expected Result

Once a booking is confirmed, the journey should be locked or reset explicitly. Search controls should not be able to alter an already confirmed booking summary.

### Screenshot

- 

<hr>
<hr>

## BR-02: Confirmation is not presented as a dedicated final page

- Severity: Medium
- Area: Confirmation page / layout and user flow
- Environment: Staging

### Summary

After placing a booking, the user stays inside the same split booking layout instead of landing on a dedicated confirmation destination. The hero copy, postcode search controls, and journey card remain visible beside the success message, which makes the end state feel unfinished and still editable.

### Steps to Reproduce

1. Open `https://rme-wast-task.vercel.app/`.
2. Complete any valid booking flow.
3. Observe the screen after `Place booking`.

### Actual Result

The success content is rendered only inside the right-hand content panel. The left side still shows the booking hero, postcode search, search success message, and journey card.

### Expected Result

The user should land on a dedicated confirmation page or a centered confirmation state that clearly ends the flow and removes editing controls from view.

### Screenshot

- 

<hr>
<hr>

## BR-03: Homepage hero is still trapped inside a large bordered shell with excessive empty space

- Severity: Medium
- Area: Landing page / desktop layout
- Environment: Staging

### Summary

The initial landing page content is wrapped inside a very large rounded container. The title, search bar, and service-area helper content occupy only a small portion of that box, leaving a noticeable amount of empty space and making the page feel like a prototype panel rather than a real homepage.

### Steps to Reproduce

1. Open `https://rme-wast-task.vercel.app/` on desktop.
2. Observe the initial page before interacting with the search field.

### Actual Result

The full experience sits inside a large bordered shell, with the hero content visually constrained and surrounded by unused whitespace.

### Expected Result

The homepage hero should sit directly on the page and feel centered and intentional, without relying on a large outer frame.

### Screenshot

- 

<hr>
<hr>

## BR-04: Review and confirmation views remain visually crowded because journey status competes with primary content

- Severity: Low
- Area: Review and confirmation pages / information hierarchy
- Environment: Staging

### Summary

On the later stages of the journey, especially review and confirmation, the left-hand journey card and the top booking summary strip compete with the main content panel. The result is a page that feels crowded and makes the most important action or message less prominent than it should be.

### Steps to Reproduce

1. Open `https://rme-wast-task.vercel.app/`.
2. Complete step 1, step 2, and step 3.
3. Stop on the review page, then place the booking and observe the confirmation screen.

### Actual Result

The review and confirmation content shares space with multiple supporting summary elements at the same time, which reduces clarity and weakens the visual hierarchy of the primary page state.

### Expected Result

The review page should prioritize review content, and the confirmation page should prioritize the success state, with supporting status information simplified or moved out of the way.

### Screenshot


