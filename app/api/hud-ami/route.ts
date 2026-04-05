import { NextRequest, NextResponse } from "next/server";
import { getAmiLimits } from "@/lib/hud-api";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const state = body?.state as string | undefined;
  const county = body?.county as string | undefined;
  try {
    if (!state) {
      return NextResponse.json(
        { error: "State is required" },
        { status: 400 }
      );
    }
    const data = getAmiLimits(state, county);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch AMI data" },
      { status: 500 }
    );
  }
}
