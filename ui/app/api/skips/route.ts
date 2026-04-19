import { NextRequest, NextResponse } from "next/server";
import {
  getSkipContractCatalogue,
  isValidUkPostcode,
  normalisePostcode,
} from "@/lib/booking-data";

export async function GET(request: NextRequest) {
  const postcode = normalisePostcode(request.nextUrl.searchParams.get("postcode") ?? "");
  const heavyWaste = request.nextUrl.searchParams.get("heavyWaste") === "true";

  if (!postcode || !isValidUkPostcode(postcode)) {
    return NextResponse.json({ message: "A valid postcode is required." }, { status: 400 });
  }

  return NextResponse.json({
    skips: getSkipContractCatalogue(heavyWaste),
  });
}
