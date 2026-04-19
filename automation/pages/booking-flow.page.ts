import { expect, type Locator, type Page, type APIResponse } from "@playwright/test";

export class BookingFlowPage {
  readonly page: Page;
  readonly postcodeInput: Locator;
  readonly searchPostcodeButton: Locator;
  readonly enterManuallyButton: Locator;
  readonly continueStepOneButton: Locator;
  readonly continueStepTwoButton: Locator;
  readonly continueStepThreeButton: Locator;
  readonly confirmBookingButton: Locator;
  readonly bookingSuccessAlert: Locator;
  readonly bookingStateCard: Locator;
  readonly estimateCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.postcodeInput = page.getByTestId("postcode-input");
    this.searchPostcodeButton = page.getByTestId("postcode-search");
    this.enterManuallyButton = page.getByTestId("manual-entry-toggle");
    this.continueStepOneButton = page.getByTestId("continue-step-1");
    this.continueStepTwoButton = page.getByTestId("continue-step-2");
    this.continueStepThreeButton = page.getByTestId("continue-step-3");
    this.confirmBookingButton = page.getByTestId("confirm-booking");
    this.bookingSuccessAlert = page.getByTestId("booking-success");
    this.bookingStateCard = page.getByText("Your booking").locator("..");
    this.estimateCard = page.getByText("Estimated total").locator("..");
  }

  async goto() {
    await this.page.goto("/");
    await expect(this.postcodeInput).toBeVisible();
    await expect(this.searchPostcodeButton).toBeVisible();
  }

  async lookupPostcode(postcode: string) {
    await this.postcodeInput.fill(postcode);

    return this.waitForLookupResponse(async () => {
      await this.searchPostcodeButton.click();
    });
  }

  async retryLookup() {
    return this.waitForLookupResponse(async () => {
      await this.page.getByTestId("retry-search").click();
    });
  }

  async expectLookupSuccess(postcode: string, addressCount: number) {
    await expect(
      this.page.getByText(
        `${addressCount} address${addressCount === 1 ? "" : "es"} found for ${postcode}.`,
      ),
    ).toBeVisible();
  }

  async expectLookupEmpty(postcode: string) {
    await expect(
      this.page.getByText(
        `No addresses were found for ${postcode}. You can enter the address manually.`,
      ),
    ).toBeVisible();
  }

  async expectLookupError(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  async expectLoadingState() {
    await expect(this.page.getByTestId("lookup-loading")).toBeVisible();
  }

  addressOption(index: number) {
    return this.page.getByTestId(`address-option-${index}`);
  }

  async selectAddress(index: number) {
    await this.addressOption(index).click();
  }

  async continueFromStepOne() {
    await this.continueStepOneButton.click();
    await expect(this.page.getByTestId("waste-card-general")).toBeVisible();
  }

  wasteCard(type: "general" | "heavy" | "plasterboard") {
    return this.page.getByTestId(`waste-card-${type}`);
  }

  async selectWasteType(type: "general" | "heavy" | "plasterboard") {
    await this.wasteCard(type).click();
  }

  plasterboardOption(type: "bagged" | "sheeted" | "sealed") {
    return this.page.getByTestId(`plasterboard-option-${type}`);
  }

  async selectPlasterboardOption(type: "bagged" | "sheeted" | "sealed") {
    await this.plasterboardOption(type).click();
  }

  async continueFromStepTwo() {
    const responsePromise = this.page.waitForResponse((response) => {
      const url = response.url();
      return (
        response.request().method() === "GET" &&
        url.includes("/api/skips") &&
        url.includes("postcode=")
      );
    });

    await this.continueStepTwoButton.click();
    await responsePromise;
    await expect(this.page.getByText("Available for booking")).toBeVisible();
  }

  skipCard(size: number) {
    return this.page.getByTestId(`skip-card-${size}`);
  }

  async selectSkip(size: number) {
    await this.skipCard(size).click();
  }

  async expectSkipUnavailableForHeavyWaste(size: number) {
    const card = this.skipCard(size);
    await expect(card).toHaveAttribute("aria-disabled", "true");
    await expect(card.getByText("Unavailable for heavy waste")).toBeVisible();
  }

  async continueFromStepThree() {
    await this.continueStepThreeButton.click();
    await expect(this.page.getByRole("heading", { name: "Booking summary" })).toBeVisible();
    await expect(this.page.getByRole("heading", { name: "Price breakdown" })).toBeVisible();
  }

  async enterManualAddress(line1: string, city: string) {
    await this.enterManuallyButton.click();
    await this.page.getByTestId("manual-address-line1").fill(line1);
    await this.page.getByTestId("manual-address-city").fill(city);
  }

  async confirmBooking() {
    const responsePromise = this.page.waitForResponse((response) => {
      return (
        response.request().method() === "POST" &&
        response.url().includes("/api/booking/confirm")
      );
    });

    await this.confirmBookingButton.click();
    await responsePromise;
    await expect(this.bookingSuccessAlert).toBeVisible();
  }

  async expectBookingReference() {
    await expect(this.page.getByText(/Reference BK-/)).toBeVisible();
  }

  async expectConfirmDisabledAfterSuccess() {
    await expect(this.confirmBookingButton).toHaveCount(0);
  }

  async expectSidebarValue(label: string, value: string | RegExp) {
    const section = this.page
      .locator("div")
      .filter({ has: this.page.getByText(label, { exact: true }) })
      .first();
    await expect(section).toContainText(value);
  }

  private async waitForLookupResponse(action: () => Promise<void>) {
    const responsePromise = this.page.waitForResponse((response) => {
      return (
        response.request().method() === "POST" &&
        response.url().includes("/api/postcode/lookup")
      );
    });

    await action();
    return responsePromise;
  }
}
