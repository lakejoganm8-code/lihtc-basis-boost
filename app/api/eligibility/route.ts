import { isQCT } from "@/lib/qct";
import { isDDACounty } from "@/lib/dda";
import { EligibilityRequest } from "@/lib/types";
import { RequestCache } from "@/lib/cache";

const eligibilityCache = new RequestCache(30 * 60 * 1000); // 30 min TTL

export async function POST(request: Request) {
  try {
    const body: EligibilityRequest = await request.json();

    const cacheKey = `eligibility:${body.fullGeoId}`;
    const cached = eligibilityCache.get(cacheKey);
    if (cached) {
      return Response.json(cached);
    }

    const qct = await isQCT(body.fullGeoId);
    const dda = await isDDACounty(body.stateFips, body.countyFips);

    const result = {
      isQCT: qct,
      isDDA: dda,
      eligible: qct || dda,
      reason: qct
        ? "Located in a Qualified Census Tract"
        : dda
          ? "Located in a Difficult Development Area county"
          : "Not eligible for 30% basis boost",
    };

    eligibilityCache.set(cacheKey, result);
    return Response.json(result);
  } catch {
    return Response.json({ error: "Eligibility check failed" }, { status: 500 });
  }
}
