import { geocodeAddress, reverseGeocode } from "@/lib/census-api";
import { GeocodeRequest, ReverseGeocodeRequest } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // If lat/lng provided, use reverse geocoding (map click)
    if ("lat" in body && "lng" in body) {
      const geoBody = body as ReverseGeocodeRequest;
      const result = await reverseGeocode(geoBody);
      return Response.json(result);
    }

    // Otherwise, use standard address geocoding
    const addrBody = body as GeocodeRequest;
    const result = await geocodeAddress(addrBody);
    return Response.json(result);
  } catch {
    return Response.json({ error: "Geocoding failed" }, { status: 500 });
  }
}
