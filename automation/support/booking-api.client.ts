import { expect, type APIRequestContext, type APIResponse } from "@playwright/test";

type LookupResponse = {
  postcode: string;
  addresses: Array<{
    id: string;
    line1: string;
    city: string;
  }>;
};

type SkipResponse = {
  skips: Array<{
    size: string;
    price: number;
    disabled: boolean;
  }>;
};

type BookingConfirmationResponse = {
  status: "success";
  bookingId: string;
};

export class BookingApiClient {
  constructor(private readonly request: APIRequestContext) {}

  lookupPostcode(postcode: string) {
    return this.request.post("/api/postcode/lookup", {
      data: { postcode },
    });
  }

  retryLookupPostcode(postcode: string) {
    return this.request.post("/api/postcode/lookup", {
      headers: {
        "x-postcode-lookup-mode": "retry",
      },
      data: { postcode },
    });
  }

  getSkips(postcode: string, heavyWaste: boolean) {
    return this.request.get("/api/skips", {
      params: {
        postcode,
        heavyWaste: String(heavyWaste),
      },
    });
  }

  saveWasteType(input: {
    heavyWaste: boolean;
    plasterboard: boolean;
    plasterboardOption?: "bagged" | "sheeted" | "sealed" | null;
  }) {
    return this.request.post("/api/waste-types", {
      data: {
        heavyWaste: input.heavyWaste,
        plasterboard: input.plasterboard,
        plasterboardOption: input.plasterboardOption ?? null,
      },
    });
  }

  confirmBooking(input: {
    postcode: string;
    addressId: string;
    heavyWaste: boolean;
    plasterboard: boolean;
    plasterboardOption?: "bagged" | "sheeted" | "sealed" | null;
    skipSize: string;
    price: number;
    manualAddressLine1?: string;
    manualAddressCity?: string;
  }) {
    return this.request.post("/api/booking/confirm", {
      data: {
        postcode: input.postcode,
        addressId: input.addressId,
        heavyWaste: input.heavyWaste,
        plasterboard: input.plasterboard,
        plasterboardOption: input.plasterboardOption ?? null,
        skipSize: input.skipSize,
        price: input.price,
        manualAddressLine1: input.manualAddressLine1,
        manualAddressCity: input.manualAddressCity,
      },
    });
  }

  async parseJson<T>(response: APIResponse): Promise<T> {
    expect(response.headers()["content-type"]).toContain("application/json");
    return (await response.json()) as T;
  }

  async parseLookup(response: APIResponse) {
    return this.parseJson<LookupResponse>(response);
  }

  async parseSkips(response: APIResponse) {
    return this.parseJson<SkipResponse>(response);
  }

  async parseBookingConfirmation(response: APIResponse) {
    return this.parseJson<BookingConfirmationResponse>(response);
  }
}
