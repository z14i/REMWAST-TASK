import { expect, test } from "@playwright/test";
import { BookingApiClient } from "../support/booking-api.client";
import { lookupFixtures, manualAddress } from "../support/test-data";

test.describe("booking api", () => {
  test("returns deterministic addresses for a populated postcode fixture", async ({
    request,
  }) => {
    const api = new BookingApiClient(request);

    const response = await api.lookupPostcode(lookupFixtures.populated.postcode);
    const payload = await api.parseLookup(response);

    expect(response.ok()).toBeTruthy();
    expect(payload.postcode).toBe(lookupFixtures.populated.postcode);
    expect(payload.addresses).toHaveLength(lookupFixtures.populated.addressCount);
    expect(payload.addresses[0]).toMatchObject({
      id: "addr_1",
      line1: "1 Buckingham Gate",
      city: "London",
    });
  });

  test("returns a heavy-waste skip catalogue with disabled large sizes", async ({
    request,
  }) => {
    const api = new BookingApiClient(request);

    const response = await api.getSkips("SW1A1AA", true);
    const payload = await api.parseSkips(response);

    expect(response.ok()).toBeTruthy();
    expect(payload.skips).toHaveLength(8);
    expect(payload.skips.find((skip) => skip.size === "10-yard")).toMatchObject({
      size: "10-yard",
      disabled: true,
    });
    expect(payload.skips.find((skip) => skip.size === "12-yard")).toMatchObject({
      size: "12-yard",
      disabled: true,
    });
    expect(payload.skips.find((skip) => skip.size === "8-yard")).toMatchObject({
      size: "8-yard",
      disabled: false,
    });
  });

  test("returns a retryable error for BS1 4DJ and succeeds on retry", async ({
    request,
  }) => {
    const api = new BookingApiClient(request);

    const firstResponse = await api.lookupPostcode(lookupFixtures.retryableFailure.postcode);
    const firstPayload = await api.parseJson<{ message: string }>(firstResponse);

    expect(firstResponse.status()).toBe(500);
    expect(firstPayload.message).toBe(lookupFixtures.retryableFailure.errorMessage);

    const secondResponse = await api.retryLookupPostcode(
      lookupFixtures.retryableFailure.postcode,
    );
    const secondPayload = await api.parseLookup(secondResponse);

    expect(secondResponse.ok()).toBeTruthy();
    expect(secondPayload.postcode).toBe(lookupFixtures.retryableFailure.postcode);
    expect(secondPayload.addresses).toHaveLength(
      lookupFixtures.retryableFailure.addressCount,
    );
  });

  test("rejects plasterboard persistence when the required handling option is missing", async ({
    request,
  }) => {
    const api = new BookingApiClient(request);

    const response = await api.saveWasteType({
      heavyWaste: false,
      plasterboard: true,
      plasterboardOption: null,
    });
    const payload = await api.parseJson<{ message: string }>(response);

    expect(response.status()).toBe(400);
    expect(payload.message).toBe("Select one plasterboard handling option.");
  });

  test("confirms a valid manual-entry booking and returns a booking reference", async ({
    request,
  }) => {
    const api = new BookingApiClient(request);

    const response = await api.confirmBooking({
      postcode: lookupFixtures.unsupported.postcode,
      addressId: "manual-entry",
      heavyWaste: false,
      plasterboard: false,
      plasterboardOption: null,
      skipSize: "6-yard",
      price: 170,
      manualAddressLine1: manualAddress.line1,
      manualAddressCity: manualAddress.city,
    });
    const payload = await api.parseBookingConfirmation(response);

    expect(response.ok()).toBeTruthy();
    expect(payload.status).toBe("success");
    expect(payload.bookingId).toMatch(/^BK-\d{5}$/);
  });
});
