import { NextRequest, NextResponse } from "next/server";
import { PlasterboardOption } from "@/lib/booking-data";

const allowedPlasterboardOptions = new Set<PlasterboardOption>([
  "bagged",
  "sheeted",
  "sealed",
]);

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    heavyWaste?: boolean;
    plasterboard?: boolean;
    plasterboardOption?: PlasterboardOption | null;
  } | null;

  if (
    typeof body?.heavyWaste !== "boolean" ||
    typeof body.plasterboard !== "boolean"
  ) {
    return NextResponse.json(
      { message: "heavyWaste and plasterboard must both be provided." },
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
        { message: "Select one plasterboard handling option." },
        { status: 400 },
      );
    }
  } else if (body.plasterboardOption !== null && body.plasterboardOption !== undefined) {
    return NextResponse.json(
      { message: "plasterboardOption must be null unless plasterboard is true." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
