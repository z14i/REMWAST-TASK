import { NextRequest, NextResponse } from "next/server";
import {
  isValidUkPostcode,
  normalisePostcode,
  postcodeFixtures,
} from "@/lib/booking-data";

function delay(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    postcode?: string;
  } | null;
  const postcode = normalisePostcode(body?.postcode ?? "");

  if (!postcode || !isValidUkPostcode(postcode)) {
    return NextResponse.json({ message: "Enter a valid UK postcode." }, { status: 400 });
  }

  if (postcode === "M1 1AE") {
    await delay(1200);
  }

  if (
    postcode === "BS1 4DJ" &&
    request.headers.get("x-postcode-lookup-mode") !== "retry"
  ) {
    return NextResponse.json(
      {
        message: "Temporary lookup outage for this postcode. Please retry the search.",
      },
      { status: 500 },
    );
  }

  if (!(postcode in postcodeFixtures)) {
    return NextResponse.json(
      {
        message: "No fixture data is available for this postcode yet. You can enter the address manually.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    postcode,
    addresses: postcodeFixtures[postcode],
  });
}
