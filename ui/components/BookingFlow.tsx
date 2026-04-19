"use client";

import { FormEvent, useMemo, useState } from "react";
import { StepIndicator } from "@/components/StepIndicator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Address,
  PlasterboardOption,
  SkipContract,
  UiSkipOption,
  WasteType,
  calculateCharges,
  compactPostcode,
  formatAddress,
  getPlasterboardHandlingDetails,
  getSkipDefinition,
  isValidUkPostcode,
  normalisePostcode,
  plasterboardHandlingOptions,
  wasteTypeOptions,
} from "@/lib/booking-data";
import { cn } from "@/lib/utils";

type LookupResponse = {
  postcode: string;
  addresses: Address[];
};

type SkipResponse = {
  skips: SkipContract[];
};

type BookingConfirmation = {
  status: "success";
  bookingId: string;
};

const money = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 2,
});

const steps = [
  {
    step: 1,
    label: "Delivery address",
    detail: "Enter your postcode and choose where your skip should be delivered.",
  },
  {
    step: 2,
    label: "Waste details",
    detail: "Tell us what you are disposing of so we can show the right options.",
  },
  {
    step: 3,
    label: "Choose your skip",
    detail: "Compare sizes, prices, and availability before you continue.",
  },
  {
    step: 4,
    label: "Review & book",
    detail: "Check your summary, review the total, and place your booking.",
  },
];

async function readJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const payload = (await response.json().catch(() => ({}))) as {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(payload.message ?? "Something went wrong. Please try again.");
  }

  return payload as T;
}

function getWasteLabel(
  wasteType: WasteType | "",
  plasterboardOption: PlasterboardOption | null,
) {
  const wasteOption = wasteTypeOptions.find((item) => item.id === wasteType);

  if (!wasteOption) {
    return "Not selected yet.";
  }

  if (wasteType !== "plasterboard") {
    return wasteOption.title;
  }

  const handlingOption = getPlasterboardHandlingDetails(plasterboardOption);
  return handlingOption
    ? `${wasteOption.title} - ${handlingOption.title}`
    : wasteOption.title;
}

function canContinueFromStepOne(input: {
  postcode: string;
  addressMode: "lookup" | "manual";
  selectedAddress: Address | null;
  manualAddressLine1: string;
  manualAddressCity: string;
}) {
  if (!isValidUkPostcode(input.postcode)) {
    return false;
  }

  if (input.addressMode === "manual") {
    return Boolean(input.manualAddressLine1.trim() && input.manualAddressCity.trim());
  }

  return Boolean(input.selectedAddress);
}

export function BookingFlow() {
  const [step, setStep] = useState(1);
  const [postcode, setPostcode] = useState("");
  const [searchedPostcode, setSearchedPostcode] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [addressMode, setAddressMode] = useState<"lookup" | "manual">("lookup");
  const [manualAddressLine1, setManualAddressLine1] = useState("");
  const [manualAddressCity, setManualAddressCity] = useState("");
  const [wasteType, setWasteType] = useState<WasteType | "">("");
  const [plasterboardOption, setPlasterboardOption] =
    useState<PlasterboardOption | null>(null);
  const [skips, setSkips] = useState<UiSkipOption[]>([]);
  const [selectedSkipSize, setSelectedSkipSize] = useState("");
  const [lookupState, setLookupState] = useState<"idle" | "loading" | "loaded" | "error">(
    "idle",
  );
  const [lookupMessage, setLookupMessage] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [wasteError, setWasteError] = useState("");
  const [skipError, setSkipError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [isSavingWaste, setIsSavingWaste] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingConfirmation | null>(null);

  const normalisedPostcode = normalisePostcode(postcode);
  const activePostcode = searchedPostcode || normalisedPostcode;
  const selectedAddress =
    addressMode === "manual"
      ? {
          id: "manual-entry",
          line1: manualAddressLine1.trim(),
          city: manualAddressCity.trim(),
        }
      : addresses.find((address) => address.id === selectedAddressId) ?? null;
  const selectedSkip = skips.find((skip) => skip.size === selectedSkipSize) ?? null;
  const heavyWaste = wasteType === "heavy";
  const plasterboard = wasteType === "plasterboard";
  const canContinueStepOne = canContinueFromStepOne({
    postcode: activePostcode || normalisedPostcode,
    addressMode,
    selectedAddress,
    manualAddressLine1,
    manualAddressCity,
  });

  const charges = useMemo(() => {
    if (!selectedSkip) {
      return null;
    }

    return calculateCharges({
      skipPrice: selectedSkip.price,
      heavyWaste,
      plasterboard,
      plasterboardOption,
    });
  }, [heavyWaste, plasterboard, plasterboardOption, selectedSkip]);

  const availableSkips = skips.filter((skip) => !skip.disabled);
  const unavailableSkips = skips.filter((skip) => skip.disabled);
  const plasterboardHandling = getPlasterboardHandlingDetails(plasterboardOption);
  const currentStepConfig = steps.find((item) => item.step === step);
  const hasLookupSuccess = lookupState === "loaded" && !lookupError;
  const isJourneyActive = step > 1 || addressMode === "manual" || hasLookupSuccess;
  const progressStep = bookingResult ? steps.length + 1 : step;
  const estimatedTotal = charges ? money.format(charges.total) : money.format(0);

  async function handlePostcodeLookup(
    postcodeValue = postcode,
    mode: "search" | "retry" = "search",
  ) {
    const cleanedPostcode = normalisePostcode(postcodeValue);

    setLookupMessage("");
    setLookupError("");
    setLookupState("idle");

    if (!cleanedPostcode || !isValidUkPostcode(cleanedPostcode)) {
      setLookupState("error");
      setLookupError("Enter a valid UK postcode before searching.");
      setAddresses([]);
      setSelectedAddressId("");
      return;
    }

    setLookupState("loading");
    setAddresses([]);
    setSelectedAddressId("");
    setSearchedPostcode(cleanedPostcode);

    try {
      const payload = await readJson<LookupResponse>("/api/postcode/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-postcode-lookup-mode": mode,
        },
        body: JSON.stringify({ postcode: cleanedPostcode }),
      });

      setLookupState("loaded");
      setAddresses(payload.addresses);
      setLookupMessage(
        payload.addresses.length > 0
          ? `${payload.addresses.length} address${payload.addresses.length === 1 ? "" : "es"} found for ${payload.postcode}.`
          : `No addresses were found for ${payload.postcode}. You can enter the address manually.`,
      );
    } catch (error) {
      setLookupState("error");
      setLookupError(
        error instanceof Error ? error.message : "We could not complete the postcode search.",
      );
    }
  }

  async function handlePostcodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await handlePostcodeLookup(postcode, "search");
  }

  async function continueToSkipSelection() {
    if (!wasteType) {
      setWasteError("Choose a waste type before continuing.");
      return;
    }

    if (plasterboard && !plasterboardOption) {
      setWasteError("Select one plasterboard handling option before continuing.");
      return;
    }

    setWasteError("");
    setSkipError("");
    setSelectedSkipSize("");
    setBookingResult(null);
    setIsSavingWaste(true);

    try {
      await readJson("/api/waste-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          heavyWaste,
          plasterboard,
          plasterboardOption: plasterboard ? plasterboardOption : null,
        }),
      });

      const payload = await readJson<SkipResponse>(
        `/api/skips?postcode=${encodeURIComponent(compactPostcode(activePostcode))}&heavyWaste=${String(
          heavyWaste,
        )}`,
      );

      const enrichedSkips = payload.skips
        .map((skip) => {
          const definition = getSkipDefinition(skip.size);

          if (!definition) {
            return null;
          }

          return {
            ...definition,
            price: skip.price,
            disabled: skip.disabled,
          };
        })
        .filter(Boolean) as UiSkipOption[];

      setSkips(enrichedSkips);
      setStep(3);
    } catch (error) {
      setWasteError(error instanceof Error ? error.message : "We could not load skips.");
    } finally {
      setIsSavingWaste(false);
    }
  }

  async function confirmBooking() {
    if (!selectedAddress || !selectedSkip || bookingResult || isConfirming) {
      return;
    }

    setConfirmError("");
    setIsConfirming(true);

    try {
      const payload = await readJson<BookingConfirmation>("/api/booking/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postcode: activePostcode,
          addressId: selectedAddress.id,
          heavyWaste,
          plasterboard,
          plasterboardOption: plasterboard ? plasterboardOption : null,
          skipSize: selectedSkip.size,
          price: selectedSkip.price,
          manualAddressLine1: addressMode === "manual" ? manualAddressLine1.trim() : undefined,
          manualAddressCity: addressMode === "manual" ? manualAddressCity.trim() : undefined,
        }),
      });

      setBookingResult(payload);
    } catch (error) {
      setConfirmError(
        error instanceof Error ? error.message : "The booking could not be confirmed.",
      );
    } finally {
      setIsConfirming(false);
    }
  }

  function restartBooking() {
    setStep(1);
    setPostcode("");
    setSearchedPostcode("");
    setAddresses([]);
    setSelectedAddressId("");
    setAddressMode("lookup");
    setManualAddressLine1("");
    setManualAddressCity("");
    setWasteType("");
    setPlasterboardOption(null);
    setSkips([]);
    setSelectedSkipSize("");
    setLookupState("idle");
    setLookupMessage("");
    setLookupError("");
    setWasteError("");
    setSkipError("");
    setConfirmError("");
    setIsSavingWaste(false);
    setIsConfirming(false);
    setBookingResult(null);
  }

  return (
    <div className="space-y-8">
      <section
        className={cn(
          "relative overflow-hidden transition-all duration-500",
          isJourneyActive
            ? "rounded-[36px] border border-zinc-200 bg-gradient-to-b from-white via-white to-zinc-50/80"
            : "min-h-[calc(100vh-10rem)] bg-transparent",
        )}
      >
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.14),transparent_60%)]",
            !isJourneyActive && "top-1/2 -translate-y-1/2",
          )}
        />

        <div
          className={cn(
            "relative grid gap-10 transition-all duration-700 ease-out",
            isJourneyActive ? "xl:grid-cols-[320px_minmax(0,1fr)]" : "xl:grid-cols-1",
            isJourneyActive ? "p-6 sm:p-8 lg:p-10" : "place-items-center px-6 py-12 sm:px-8",
          )}
        >
          <section
            className={cn(
              "space-y-6 transition-all duration-700 ease-out",
              isJourneyActive
                ? "xl:sticky xl:top-8 xl:self-start xl:text-left"
                : "mx-auto flex w-full max-w-4xl flex-col items-center justify-center text-center",
            )}
          >
            <div className={cn("space-y-4", !isJourneyActive && "mx-auto max-w-3xl")}>
              <Badge variant="outline" className="w-fit">
                ClearSkip
              </Badge>
              <div className="space-y-4">
                <h1
                  className={cn(
                    "font-bold tracking-tight text-zinc-950 transition-all duration-500",
                    isJourneyActive ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl",
                  )}
                >
                  Book your skip online without the back and forth.
                </h1>
                <p
                  className={cn(
                    "leading-7 text-zinc-600",
                    isJourneyActive ? "text-base" : "mx-auto max-w-2xl text-lg",
                  )}
                >
                  Check delivery availability, pick the right waste type, compare skip sizes, and
                  review the total before you place your order.
                </p>
              </div>
            </div>

            <div
              className={cn(
                "rounded-[30px] border border-zinc-200 bg-white/95 p-4 shadow-[0_24px_64px_rgba(15,23,42,0.08)] backdrop-blur sm:p-5",
                !isJourneyActive && "mx-auto max-w-3xl",
              )}
            >
              <form
                className={cn(
                  "gap-4",
                  isJourneyActive
                    ? "grid"
                    : "grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end",
                )}
                onSubmit={handlePostcodeSubmit}
              >
                <div className="space-y-2">
                  <Label htmlFor="postcode-input">Delivery postcode</Label>
                  <Input
                    id="postcode-input"
                    data-testid="postcode-input"
                    value={postcode}
                    onChange={(event) => {
                      setPostcode(event.target.value);
                      setLookupError("");
                    }}
                    placeholder="Enter your UK postcode"
                    className="h-12 rounded-2xl border-zinc-200"
                  />
                </div>

                <Button
                  data-testid="postcode-search"
                  type="submit"
                  disabled={lookupState === "loading"}
                  className="h-12 min-w-40 rounded-2xl"
                >
                  {lookupState === "loading" ? "Searching..." : "Search postcode"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  data-testid="manual-entry-toggle"
                  className="h-12 rounded-2xl"
                  onClick={() => {
                    setAddressMode("manual");
                    setSelectedAddressId("");
                    setLookupError("");
                  }}
                >
                  {addressMode === "manual" ? "Manual address selected" : "Enter manually"}
                </Button>
              </form>

              {addressMode === "manual" && isJourneyActive ? (
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setAddressMode("lookup")}
                    className="px-0 text-zinc-600 hover:text-zinc-950"
                  >
                    Use lookup results instead
                  </Button>
                </div>
              ) : null}

              <div className="mt-4 space-y-3">
                {lookupState === "loading" ? (
                  <Alert data-testid="lookup-loading">
                    <AlertTitle>Finding addresses</AlertTitle>
                    <AlertDescription>
                      We are checking addresses for {normalisePostcode(postcode) || "your postcode"}.
                    </AlertDescription>
                  </Alert>
                ) : null}

                {lookupMessage ? (
                  <Alert variant="success">
                    <AlertTitle>Addresses ready</AlertTitle>
                    <AlertDescription>{lookupMessage}</AlertDescription>
                  </Alert>
                ) : null}

                {lookupError ? (
                  <Alert variant="danger">
                    <AlertTitle>We could not complete that search</AlertTitle>
                    <AlertDescription>{lookupError}</AlertDescription>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <Button
                        data-testid="retry-search"
                        type="button"
                        variant="outline"
                        onClick={() => handlePostcodeLookup(postcode, "retry")}
                        className="border-[color:var(--danger)]/30 text-[color:var(--danger)] hover:bg-[color:var(--danger-soft)]"
                      >
                        Retry search
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setAddressMode("manual")}>
                        Enter address manually
                      </Button>
                    </div>
                  </Alert>
                ) : null}
              </div>
            </div>

            {!isJourneyActive ? (
              <div className="mx-auto max-w-3xl rounded-2xl border border-[color:var(--info-border)] bg-[color:var(--info-soft)]/70 px-4 py-4 text-left">
                <p className="text-sm font-medium text-zinc-950">Popular service areas</p>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Try{" "}
                  <span className="font-semibold text-[color:var(--info-hover)]">SW1A 1AA</span>,{" "}
                  <span className="font-semibold text-[color:var(--info-hover)]">EC1A 1BB</span>,{" "}
                  <span className="font-semibold text-[color:var(--info-hover)]">M1 1AE</span>, and{" "}
                  <span className="font-semibold text-[color:var(--info-hover)]">BS1 4DJ</span> to
                  explore supported areas, empty results, delayed loading, and retry behaviour.
                </p>
              </div>
            ) : (
              <>
                <Card className="border-zinc-200 shadow-none">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-3">
                      {bookingResult ? (
                        <Badge variant="success">Booking confirmed</Badge>
                      ) : (
                        <Badge variant="secondary">
                          Step {Math.min(step, steps.length)} of {steps.length}
                        </Badge>
                      )}
                      {currentStepConfig && !bookingResult ? <Badge>{currentStepConfig.label}</Badge> : null}
                    </div>
                    <CardTitle>Your booking journey</CardTitle>
                    <CardDescription>
                      Work through the steps and your selections will update in real time.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <StepIndicator currentStep={progressStep} steps={steps} />
                  </CardContent>
                </Card>
              </>
            )}
          </section>

          <section
            className={cn(
              "min-w-0 transition-all duration-700 ease-out",
              isJourneyActive
                ? "opacity-100 translate-y-0"
                : "pointer-events-none max-h-0 -translate-y-4 overflow-hidden opacity-0",
            )}
          >
            <div className="mb-6 border-b border-zinc-200 pb-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold text-zinc-950">Your booking</h2>
                    <Badge variant="outline">Updated live</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    A quick view of the details already confirmed in your booking.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5 xl:gap-5">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                      Postcode
                    </p>
                    <p
                      className={cn(
                        "mt-2 text-sm leading-6",
                        activePostcode ? "text-[color:var(--success)]" : "text-zinc-700",
                      )}
                    >
                      {activePostcode || "Add your postcode to get started."}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                      Address
                    </p>
                    <p
                      className={cn(
                        "mt-2 text-sm leading-6",
                        selectedAddress ? "text-[color:var(--success)]" : "text-zinc-700",
                      )}
                    >
                      {selectedAddress
                        ? formatAddress(selectedAddress)
                        : "Choose a lookup result or enter your address manually."}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                      Waste type
                    </p>
                    <p
                      className={cn(
                        "mt-2 text-sm leading-6",
                        wasteType ? "text-[color:var(--success)]" : "text-zinc-700",
                      )}
                    >
                      {getWasteLabel(wasteType, plasterboardOption)}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                      Skip
                    </p>
                    <p
                      className={cn(
                        "mt-2 text-sm leading-6",
                        selectedSkip ? "text-[color:var(--success)]" : "text-zinc-700",
                      )}
                    >
                      {selectedSkip
                        ? `${selectedSkip.size} for ${money.format(selectedSkip.price)}`
                        : "Choose an available skip size."}
                    </p>
                  </div>

                  <div className="min-w-0 xl:text-right">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                      Estimated total
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-zinc-950">{estimatedTotal}</p>
                  </div>
                </div>
              </div>
            </div>

            {bookingResult ? (
              <div
                data-testid="booking-success"
                className="rounded-[32px] border border-[color:var(--success)]/20 bg-gradient-to-b from-white to-[color:var(--success-soft)]/60 p-6 shadow-sm sm:p-8"
              >
                <div className="max-w-3xl space-y-6">
                  <Badge variant="success" className="w-fit">
                    Booking confirmed
                  </Badge>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
                      Your skip is booked and ready to be scheduled.
                    </h2>
                    <p className="max-w-2xl text-base leading-7 text-zinc-600">
                      Reference {bookingResult.bookingId}. We have saved your delivery details and
                      confirmed your order for {estimatedTotal}.
                    </p>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
                    <div className="rounded-[28px] border border-white/70 bg-white/90 p-6">
                      <h3 className="text-lg font-semibold text-zinc-950">Booking summary</h3>
                      <div className="mt-5 grid gap-5 sm:grid-cols-2">
                        <div>
                          <p className="text-sm font-medium text-zinc-500">Delivery address</p>
                          <p className="mt-2 text-sm leading-6 text-zinc-800">
                            {selectedAddress ? formatAddress(selectedAddress) : "No address selected"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-500">Waste profile</p>
                          <p className="mt-2 text-sm leading-6 text-zinc-800">
                            {getWasteLabel(wasteType, plasterboardOption)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-500">Skip size</p>
                          <p className="mt-2 text-sm leading-6 text-zinc-800">
                            {selectedSkip
                              ? `${selectedSkip.size} (${selectedSkip.hireDays} day hire)`
                              : "No skip selected"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-500">Postcode</p>
                          <p className="mt-2 text-sm leading-6 text-zinc-800">{activePostcode}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-white/70 bg-white/90 p-6">
                      <p className="text-sm font-medium text-zinc-500">Confirmed total</p>
                      <p className="mt-3 text-3xl font-semibold text-zinc-950">{estimatedTotal}</p>
                      <p className="mt-3 text-sm leading-6 text-zinc-600">
                        A member of the ClearSkip team will follow up with delivery timing and site
                        access details.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button type="button" onClick={restartBooking}>
                      Start a new booking
                    </Button>
                  </div>
                </div>
              </div>
            ) : step === 1 ? (
              <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Badge variant="outline" className="w-fit">
                      Step 1
                    </Badge>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-950">
                      Where should we deliver your skip?
                    </h2>
                    <p className="max-w-2xl text-base leading-7 text-zinc-600">
                      Choose an address from the lookup results, or add the address manually if it is
                      not listed.
                    </p>
                  </div>

                  {addresses.length > 0 ? (
                    <fieldset className="space-y-4">
                      <legend className="text-sm font-medium text-zinc-900">
                        Select your address for {searchedPostcode}
                      </legend>
                      <div className="grid gap-3">
                        {addresses.map((address, index) => {
                          const checked = addressMode === "lookup" && selectedAddressId === address.id;

                          return (
                            <label
                              key={address.id}
                              data-testid={`address-option-${index + 1}`}
                              className="block cursor-pointer"
                            >
                              <div
                                className={cn(
                                  "rounded-[24px] border px-4 py-4 transition",
                                  checked
                                    ? "border-[color:var(--info-border)] bg-[color:var(--info-soft)] ring-1 ring-[color:var(--info)]/10"
                                    : "border-zinc-200 bg-white hover:border-zinc-300",
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <input
                                    checked={checked}
                                    onChange={() => {
                                      setAddressMode("lookup");
                                      setSelectedAddressId(address.id);
                                    }}
                                    type="radio"
                                    name="selected-address"
                                    className="mt-1 h-4 w-4 accent-[color:var(--info)]"
                                  />
                                  <span className="text-sm leading-6 text-zinc-700">
                                    {formatAddress(address)}
                                  </span>
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  ) : null}

                  {addressMode === "manual" ? (
                    <div className="grid gap-4 rounded-[28px] border border-dashed border-zinc-300 bg-zinc-50/60 p-5 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="manual-address-line1">Address line 1</Label>
                        <Input
                          id="manual-address-line1"
                          data-testid="manual-address-line1"
                          value={manualAddressLine1}
                          onChange={(event) => setManualAddressLine1(event.target.value)}
                          placeholder="Building number and street"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="manual-address-city">Town or city</Label>
                        <Input
                          id="manual-address-city"
                          data-testid="manual-address-city"
                          value={manualAddressCity}
                          onChange={(event) => setManualAddressCity(event.target.value)}
                          placeholder="Town or city"
                        />
                      </div>
                    </div>
                  ) : null}

                  {hasLookupSuccess && addresses.length === 0 && addressMode !== "manual" ? (
                    <Alert>
                      <AlertTitle>No address listed?</AlertTitle>
                      <AlertDescription>
                        Switch to manual entry to continue with the booking using your delivery details.
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    <Button
                      data-testid="continue-step-1"
                      type="button"
                      variant="secondary"
                      disabled={!canContinueStepOne}
                      onClick={() => setStep(2)}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              </div>
            ) : step === 2 ? (
              <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Badge variant="outline" className="w-fit">
                      Step 2
                    </Badge>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-950">
                      What are you putting in the skip?
                    </h2>
                    <p className="max-w-2xl text-base leading-7 text-zinc-600">
                      Tell us what you are disposing of so we can show the right skip options and any
                      handling requirements.
                    </p>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    {wasteTypeOptions.map((option) => {
                      const selected = wasteType === option.id;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          data-testid={`waste-card-${option.id}`}
                          onClick={() => {
                            setWasteType(option.id);
                            setWasteError("");
                            setSelectedSkipSize("");
                            setSkips([]);
                            setBookingResult(null);
                            if (option.id !== "plasterboard") {
                              setPlasterboardOption(null);
                            }
                          }}
                          className={cn(
                            "rounded-[28px] border p-5 text-left transition",
                            selected
                              ? "border-[color:var(--info-border)] bg-[color:var(--info-soft)] shadow-sm"
                              : "border-zinc-200 bg-white hover:border-zinc-300",
                          )}
                        >
                          <Badge variant={selected ? "default" : "secondary"}>{option.badge}</Badge>
                          <h3 className="mt-4 text-xl font-semibold text-zinc-950">{option.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-zinc-500">{option.summary}</p>
                        </button>
                      );
                    })}
                  </div>

                  {plasterboard ? (
                    <div className="rounded-[28px] border border-zinc-200 bg-zinc-50/60 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold text-zinc-950">
                            Choose how your plasterboard is prepared
                          </h3>
                          <p className="text-sm leading-6 text-zinc-500">
                            We need this detail before we can show the correct skip options.
                          </p>
                        </div>
                        <Badge variant="outline">3 options</Badge>
                      </div>

                      <div className="mt-5 grid gap-4 lg:grid-cols-3">
                        {plasterboardHandlingOptions.map((option) => {
                          const selected = plasterboardOption === option.id;

                          return (
                            <button
                              key={option.id}
                              type="button"
                              data-testid={`plasterboard-option-${option.id}`}
                              onClick={() => {
                                setPlasterboardOption(option.id);
                                setWasteError("");
                              }}
                              className={cn(
                                "rounded-[24px] border p-4 text-left transition",
                                selected
                                  ? "border-[color:var(--info-border)] bg-[color:var(--info-soft)] shadow-sm"
                                  : "border-zinc-200 bg-white hover:border-zinc-300",
                              )}
                            >
                              <h4 className="text-base font-semibold text-zinc-950">{option.title}</h4>
                              <p className="mt-2 text-sm leading-6 text-zinc-500">{option.summary}</p>
                              <p className="mt-3 text-sm font-medium text-zinc-900">
                                Handling fee: {money.format(option.surcharge)}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {wasteError ? (
                    <Alert variant="danger">
                      <AlertTitle>Please choose a waste type</AlertTitle>
                      <AlertDescription>{wasteError}</AlertDescription>
                    </Alert>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button
                      data-testid="continue-step-2"
                      type="button"
                      disabled={isSavingWaste}
                      onClick={continueToSkipSelection}
                    >
                      {isSavingWaste ? "Loading skip options..." : "Continue"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : step === 3 ? (
              <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Badge variant="outline" className="w-fit">
                      Step 3
                    </Badge>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-950">
                      Choose the right skip size
                    </h2>
                    <p className="max-w-2xl text-base leading-7 text-zinc-600">
                      Compare sizes, hire periods, and availability to find the best fit for your
                      collection.
                    </p>
                  </div>

                  {skipError ? (
                    <Alert variant="danger">
                      <AlertTitle>Please choose a skip size</AlertTitle>
                      <AlertDescription>{skipError}</AlertDescription>
                    </Alert>
                  ) : null}

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-xl font-semibold text-zinc-950">Available for booking</h3>
                        <Badge variant="outline">{availableSkips.length} options</Badge>
                      </div>
                      <div className="grid gap-4 xl:grid-cols-2">
                        {availableSkips.map((skip) => {
                          const checked = selectedSkipSize === skip.size;

                          return (
                            <label
                              key={skip.size}
                              data-testid={`skip-card-${skip.size.replace("-yard", "")}`}
                              className="block cursor-pointer"
                            >
                              <div
                                className={cn(
                                  "rounded-[28px] border p-5 transition",
                                  checked
                                    ? "border-[color:var(--info-border)] bg-[color:var(--info-soft)] shadow-sm"
                                    : "border-zinc-200 bg-white hover:border-zinc-300",
                                )}
                              >
                                <div className="flex gap-4">
                                  <input
                                    type="radio"
                                    name="selected-skip"
                                    checked={checked}
                                    onChange={() => {
                                      setSelectedSkipSize(skip.size);
                                      setSkipError("");
                                      setBookingResult(null);
                                    }}
                                    className="mt-1 h-4 w-4 accent-[color:var(--info)]"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                      <div>
                                        <h4 className="text-xl font-semibold text-zinc-950">
                                          {skip.size}
                                        </h4>
                                        <p className="text-sm text-zinc-500">
                                          {skip.hireDays} day hire window
                                        </p>
                                      </div>
                                      <span className="text-lg font-semibold text-zinc-950">
                                        {money.format(skip.price)}
                                      </span>
                                    </div>
                                    <p className="mt-3 text-sm leading-6 text-zinc-500">
                                      {skip.description}
                                    </p>
                                    <div className="mt-4">
                                      <Badge
                                        variant={
                                          skip.availability === "limited" ? "warning" : "success"
                                        }
                                      >
                                        {skip.availability === "limited"
                                          ? "Limited stock"
                                          : "Ready to book"}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {unavailableSkips.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="text-xl font-semibold text-zinc-950">Currently unavailable</h3>
                          <Badge variant="secondary">Shown for comparison</Badge>
                        </div>
                        <div className="grid gap-4 xl:grid-cols-2">
                          {unavailableSkips.map((skip) => {
                            const restrictedByWeight = heavyWaste && !skip.allowedForHeavyWaste;

                            return (
                              <div
                                key={skip.size}
                                data-testid={`skip-card-${skip.size.replace("-yard", "")}`}
                                aria-disabled="true"
                                className="rounded-[28px] border border-dashed border-zinc-300 bg-zinc-50 p-5 opacity-80"
                              >
                                <div className="space-y-3">
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                      <h4 className="text-xl font-semibold text-zinc-900">{skip.size}</h4>
                                      <p className="text-sm text-zinc-500">
                                        {skip.hireDays} day hire window
                                      </p>
                                    </div>
                                    <span className="text-lg font-semibold text-zinc-900">
                                      {money.format(skip.price)}
                                    </span>
                                  </div>
                                  <p className="text-sm leading-6 text-zinc-500">{skip.description}</p>
                                  <Badge variant={restrictedByWeight ? "danger" : "warning"}>
                                    {restrictedByWeight
                                      ? "Unavailable for heavy waste"
                                      : "Currently unavailable"}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="outline" onClick={() => setStep(2)}>
                      Back
                    </Button>
                    <Button
                      data-testid="continue-step-3"
                      type="button"
                      disabled={!selectedSkip}
                      onClick={() => {
                        if (!selectedSkip) {
                          setSkipError("Choose one of the available skip sizes before continuing.");
                          return;
                        }

                        setStep(4);
                      }}
                    >
                      Review booking
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Badge variant="outline" className="w-fit">
                      Step 4
                    </Badge>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-950">
                      Review your booking
                    </h2>
                    <p className="max-w-2xl text-base leading-7 text-zinc-600">
                      Check the delivery details, price breakdown, and total before placing your
                      order.
                    </p>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
                    <Card className="border-zinc-200 shadow-none">
                      <CardHeader>
                        <CardTitle>Booking summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 text-sm">
                        <div>
                          <p className="text-sm font-medium text-zinc-500">Postcode</p>
                          <p className="mt-1 text-zinc-900">{activePostcode}</p>
                        </div>
                        <Separator />
                        <div>
                          <p className="text-sm font-medium text-zinc-500">Address</p>
                          <p className="mt-1 text-zinc-900">
                            {selectedAddress ? formatAddress(selectedAddress) : "No address selected"}
                          </p>
                        </div>
                        <Separator />
                        <div>
                          <p className="text-sm font-medium text-zinc-500">Waste type</p>
                          <p className="mt-1 text-zinc-900">
                            {getWasteLabel(wasteType, plasterboardOption)}
                          </p>
                        </div>
                        {plasterboardHandling ? (
                          <>
                            <Separator />
                            <div>
                              <p className="text-sm font-medium text-zinc-500">Handling option</p>
                              <p className="mt-1 text-zinc-900">{plasterboardHandling.title}</p>
                            </div>
                          </>
                        ) : null}
                        <Separator />
                        <div>
                          <p className="text-sm font-medium text-zinc-500">Skip size</p>
                          <p className="mt-1 text-zinc-900">
                            {selectedSkip
                              ? `${selectedSkip.size} (${selectedSkip.hireDays} day hire)`
                              : "No skip selected"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-zinc-200 shadow-none">
                      <CardHeader>
                        <CardTitle>Price breakdown</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm text-zinc-700">
                        {charges ? (
                          <>
                            <div className="flex items-center justify-between gap-3">
                              <span>Skip hire</span>
                              <span>{money.format(selectedSkip?.price ?? 0)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span>Service fee</span>
                              <span>{money.format(charges.serviceFee)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span>Environmental fee</span>
                              <span>{money.format(charges.environmentalFee)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span>Heavy waste surcharge</span>
                              <span>{money.format(charges.heavyWasteSurcharge)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span>Plasterboard handling</span>
                              <span>{money.format(charges.plasterboardHandlingFee)}</span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between gap-3">
                              <span>VAT</span>
                              <span>{money.format(charges.vat)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-lg font-semibold text-zinc-950">
                              <span>Total</span>
                              <span>{money.format(charges.total)}</span>
                            </div>
                          </>
                        ) : null}
                      </CardContent>
                    </Card>
                  </div>

                  {confirmError ? (
                    <Alert variant="danger">
                      <AlertTitle>We could not place your booking</AlertTitle>
                      <AlertDescription>{confirmError}</AlertDescription>
                    </Alert>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="outline" onClick={() => setStep(3)}>
                      Back
                    </Button>
                    <Button
                      data-testid="confirm-booking"
                      type="button"
                      disabled={
                        !selectedSkip ||
                        !selectedAddress ||
                        !wasteType ||
                        isConfirming ||
                        Boolean(bookingResult)
                      }
                      onClick={confirmBooking}
                    >
                      {isConfirming ? "Placing booking..." : "Place booking"}
                    </Button>
                    <Button type="button" variant="outline" onClick={restartBooking}>
                      Start over
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
