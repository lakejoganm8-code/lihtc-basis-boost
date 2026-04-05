import { NextRequest, NextResponse } from "next/server";
import { getFairMarketRent, FMR_LABELS } from "@/lib/hud-api";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const state = body?.state as string | undefined;
  try {
    if (!state) {
      return NextResponse.json(
        { error: "State is required" },
        { status: 400 }
      );
    }
    const fmr = getFairMarketRent(state);
    return NextResponse.json({
      area: fmr.fips,
      state: state,
      year: fmr.year,
      fmr: {
        "0": fmr.zeroBr,
        "1": fmr.oneBr,
        "2": fmr.twoBr,
        "3": fmr.threeBr,
        "4": fmr.fourBr,
      },
      labels: FMR_LABELS,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch FMR data" },
      { status: 500 }
    );
  }
}
