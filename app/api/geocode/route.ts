import { geocodeAddress } from "@/lib/census-api";
import { GeocodeRequest } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body: GeocodeRequest = await request.json();
    const result = await geocodeAddress(body);
    return Response.json(result);
  } catch {
    return Response.json({ error: "Geocoding failed" }, { status: 500 });
  }
}
