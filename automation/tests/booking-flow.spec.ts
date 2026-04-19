import { expect, test } from "@playwright/test";
import { BookingFlowPage } from "../pages/booking-flow.page";
import { lookupFixtures, manualAddress } from "../support/test-data";

test.describe("booking flow", () => {
  test("completes a general waste booking with a price review and confirmation lock", async ({
    page,
  }) => {
    const booking = new BookingFlowPage(page);

    await test.step("complete postcode lookup and address selection", async () => {
      await booking.goto();
      const response = await booking.lookupPostcode(lookupFixtures.populated.postcode);

      expect(response.ok()).toBeTruthy();
      await booking.expectLookupSuccess(
        lookupFixtures.populated.postcode,
        lookupFixtures.populated.addressCount,
      );
      await booking.selectAddress(1);
      await booking.continueFromStepOne();
    });

    await test.step("choose general waste and load skip options", async () => {
      await booking.selectWasteType("general");
      await booking.continueFromStepTwo();
      await booking.selectSkip(6);
      await booking.continueFromStepThree();
    });

    await test.step("review pricing and confirm once", async () => {
      await expect(page.getByText("Heavy waste surcharge")).toBeVisible();
      await expect(page.getByText("Plasterboard handling", { exact: true })).toBeVisible();
      await expect(page.getByText("VAT")).toBeVisible();
      await booking.confirmBooking();
      await booking.expectBookingReference();
      await booking.expectConfirmDisabledAfterSuccess();
    });
  });

  test("shows the empty-address fixture and blocks progression", async ({ page }) => {
    const booking = new BookingFlowPage(page);

    await booking.goto();
    const response = await booking.lookupPostcode(lookupFixtures.empty.postcode);

    expect(response.ok()).toBeTruthy();
    await booking.expectLookupEmpty(lookupFixtures.empty.postcode);
    await expect(booking.continueStepOneButton).toBeDisabled();
  });

  test("shows a loading state for the delayed postcode fixture", async ({ page }) => {
    const booking = new BookingFlowPage(page);

    await booking.goto();

    const responsePromise = booking.lookupPostcode(lookupFixtures.delayed.postcode);
    await booking.expectLoadingState();
    const response = await responsePromise;

    expect(response.ok()).toBeTruthy();
    await booking.expectLookupSuccess(
      lookupFixtures.delayed.postcode,
      lookupFixtures.delayed.addressCount,
    );
  });

  test("recovers from a temporary postcode failure and applies heavy waste restrictions", async ({
    page,
  }) => {
    const booking = new BookingFlowPage(page);

    await booking.goto();

    const firstResponse = await booking.lookupPostcode(lookupFixtures.retryableFailure.postcode);
    expect(firstResponse.status()).toBe(500);
    await booking.expectLookupError(lookupFixtures.retryableFailure.errorMessage);

    const secondResponse = await booking.retryLookup();
    expect(secondResponse.ok()).toBeTruthy();
    await booking.expectLookupSuccess(
      lookupFixtures.retryableFailure.postcode,
      lookupFixtures.retryableFailure.addressCount,
    );

    await booking.selectAddress(1);
    await booking.continueFromStepOne();
    await booking.selectWasteType("heavy");
    await booking.continueFromStepTwo();

    await booking.expectSkipUnavailableForHeavyWaste(10);
    await booking.expectSkipUnavailableForHeavyWaste(12);

    await booking.selectSkip(8);
    await booking.continueFromStepThree();
    await booking.confirmBooking();
  });

  test("supports manual address entry with the plasterboard branch", async ({ page }) => {
    const booking = new BookingFlowPage(page);

    await booking.goto();
    const response = await booking.lookupPostcode(lookupFixtures.unsupported.postcode);

    expect(response.status()).toBe(404);
    await booking.expectLookupError(lookupFixtures.unsupported.errorMessage);

    await booking.enterManualAddress(manualAddress.line1, manualAddress.city);
    await booking.continueFromStepOne();

    await booking.selectWasteType("plasterboard");
    await booking.selectPlasterboardOption("sheeted");
    await booking.continueFromStepTwo();

    await booking.selectSkip(6);
    await booking.continueFromStepThree();

    await expect(page.getByText("Handling option")).toBeVisible();
    await expect(page.getByText("Sheeted stacks", { exact: true })).toBeVisible();

    await booking.confirmBooking();
  });
});
