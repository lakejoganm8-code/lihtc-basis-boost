import { geocodeAddress, reverseGeocode } from "@/lib/census-api";
import { GeocodeRequest, ReverseGeocodeRequest, GeocodeResponse } from "@/lib/types";
import { RequestCache } from "@/lib/cache";

const geocodeCache = new RequestCache(30 * 60 * 1000); // 30 min TTL

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const isReverse = "lat" in body && "lng" in body;
    const cacheKey = isReverse
      ? `geocode:rev:${body.lat}:${body.lng}`
      : `geocode:${body.street}:${body.city}:${body.state}:${body.zip}`;

    const cached = geocodeCache.get(cacheKey);
    if (cached) {
      return Response.json(cached);
    }

    let result: GeocodeResponse;
    if (isReverse) {
      const geoBody = body as ReverseGeocodeRequest;
      result = await reverseGeocode(geoBody);
    } else {
      const addrBody = body as GeocodeRequest;
      result = await geocodeAddress(addrBody);
    }

    geocodeCache.set(cacheKey, result);
    return Response.json(result);
  } catch {
    return Response.json({ error: "Geocoding failed" }, { status: 500 });
  }
}
