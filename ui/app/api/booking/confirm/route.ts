import { NextRequest, NextResponse } from "next/server";
import {
  PlasterboardOption,
  getSkipDefinition,
  isValidUkPostcode,
  normalisePostcode,
  postcodeFixtures,
} from "@/lib/booking-data";

const allowedPlasterboardOptions = new Set<PlasterboardOption>([
  "bagged",
  "sheeted",
  "sealed",
]);

type BookingPayload = {
  postcode?: string;
  addressId?: string;
  heavyWaste?: boolean;
  plasterboard?: boolean;
  plasterboardOption?: PlasterboardOption | null;
  skipSize?: string;
  price?: number;
  manualAddressLine1?: string;
  manualAddressCity?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as BookingPayload | null;
  const postcode = normalisePostcode(body?.postcode ?? "");

  if (
    !postcode ||
    !isValidUkPostcode(postcode) ||
    typeof body?.addressId !== "string" ||
    typeof body.heavyWaste !== "boolean" ||
    typeof body.plasterboard !== "boolean" ||
    typeof body.skipSize !== "string" ||
    typeof body.price !== "number"
  ) {
    return NextResponse.json(
      { message: "Incomplete booking details were submitted." },
      { status: 400 },
    );
  }

  if (body.heavyWaste && body.plasterboard) {
    return NextResponse.json(
      { message: "Heavy waste and plasterboard cannot both be true." },
      { status: 400 },
    );
  }

  if (body.plasterboard) {
    if (!body.plasterboardOption || !allowedPlasterboardOptions.has(body.plasterboardOption)) {
      return NextResponse.json(
        { message: "A plasterboard handling option is required." },
        { status: 400 },
      );
    }
  }

  const skip = getSkipDefinition(body.skipSize);

  if (!skip || skip.price !== body.price) {
    return NextResponse.json(
      { message: "Skip size and price do not match the current catalogue." },
      { status: 400 },
    );
  }

  if (body.heavyWaste && !skip.allowedForHeavyWaste) {
    return NextResponse.json(
      { message: "This skip size is disabled for heavy waste bookings." },
      { status: 400 },
    );
  }

  if (body.addressId === "manual-entry") {
    if (!body.manualAddressLine1?.trim() || !body.manualAddressCity?.trim()) {
      return NextResponse.json(
        { message: "Manual address details are required for manual entry." },
        { status: 400 },
      );
    }
  } else {
    const matchedAddress = postcodeFixtures[postcode]?.some(
      (address) => address.id === body.addressId,
    );

    if (!matchedAddress) {
      return NextResponse.json(
        { message: "Selected address does not belong to the searched postcode." },
        { status: 400 },
      );
    }
  }

  const bookingId = `BK-${Date.now().toString().slice(-5)}`;

  return NextResponse.json({
    status: "success",
    bookingId,
  });
}
