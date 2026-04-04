import { isQCT } from "@/lib/qct";
import { isDDACounty } from "@/lib/dda";
import { EligibilityRequest } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body: EligibilityRequest = await request.json();
    const qct = await isQCT(body.fullGeoId);
    const dda = await isDDACounty(body.stateFips, body.countyFips);

    return Response.json({
      isQCT: qct,
      isDDA: dda,
      eligible: qct || dda,
      reason: qct
        ? "Located in a Qualified Census Tract"
        : dda
          ? "Located in a Difficult Development Area county"
          : "Not eligible for 30% basis boost",
    });
  } catch {
    return Response.json({ error: "Eligibility check failed" }, { status: 500 });
  }
}
