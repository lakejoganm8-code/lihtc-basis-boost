import { NextRequest, NextResponse } from "next/server";
import { getAmiLimits } from "@/lib/hud-api";

export async function POST(req: NextRequest) {
  try {
    const { state, county } = await req.json();
    if (!state) {
      return NextResponse.json(
        { error: "State is required" },
        { status: 400 }
      );
    }
    const data = getAmiLimits(state, county);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch AMI data" },
      { status: 500 }
    );
  }
}
