import { NextRequest, NextResponse } from "next/server";
import { getFairMarketRent, FMR_LABELS } from "@/lib/hud-api";

export async function POST(req: NextRequest) {
  try {
    const { state } = await req.json();
    if (!state) {
      return NextResponse.json(
        { error: "State is required" },
        { status: 400 }
      );
    }
    const fmr = getFairMarketRent(state);
    return NextResponse.json({
      area: fmr.fips,
      state,
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
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch FMR data" },
      { status: 500 }
    );
  }
}
