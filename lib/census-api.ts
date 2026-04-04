import { GeocodeRequest, GeocodeResponse } from "./types";

export async function geocodeAddress(req: GeocodeRequest): Promise<GeocodeResponse> {
  const params = new URLSearchParams({
    benchmark: "Public_AR_Current",
    vintage: "Current_Current",
    layers: "10",
    format: "json",
  });

  const address = [req.street, req.city, req.state, req.zip].filter(Boolean).join(", ");
  params.set("address", address);

  const url = `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?${params}`;

  const res = await fetch(url, { next: { revalidate: 86400 } });

  if (!res.ok) {
    return emptyResult();
  }

  const data = await res.json();
  const result = data.result?.addressMatches?.[0];

  if (!result) {
    return emptyResult();
  }

  const geographies = result.geographies;

  // Iterate all geography entries to extract all needed fields
  let stateFips = "";
  let countyFips = "";
  let tract = "";
  let countyName = "";
  let stateAbbr = "";

  const geoEntries = geographies as Record<string, Record<string, unknown>[]>;
  for (const [key, entries] of Object.entries(geoEntries)) {
    if (!entries?.[0]) continue;
    const entry = entries[0] as Record<string, unknown>;

    if (!stateFips && entry.STATE) stateFips = String(entry.STATE);
    if (!countyFips && entry.COUNTY) countyFips = String(entry.COUNTY);
    if (!tract && entry.TRACT) tract = String(entry.TRACT);
    if (!stateAbbr && entry.STUSAB) stateAbbr = String(entry.STUSAB);

    // County name: prefer entries where key contains "County"
    if (!countyName && entry.NAME && typeof entry.NAME === "string") {
      if (key.includes("County") || key.includes("county")) {
        countyName = entry.NAME;
      } else if (key.includes("County Equivalent")) {
        countyName = entry.NAME;
      } else if (key === "Cities") {
        countyName = entry.NAME;
      }
    }
  }

  // Try to get county name from Cities or other keys if still empty
  if (!countyName) {
    for (const [key, entries] of Object.entries(geoEntries)) {
      if (
        entries?.[0]?.NAME &&
        (key.includes("County") || key.includes("city"))
      ) {
        countyName = entries[0].NAME as string;
        break;
      }
    }
  }

  // Fallback: use state FIPS to state abbreviation mapping
  const stateFipsToName: Record<string, string> = {
    "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO",
    "09": "CT", "10": "DE", "11": "DC", "12": "FL", "13": "GA", "15": "HI",
    "16": "ID", "17": "IL", "18": "IN", "19": "IA", "20": "KS", "21": "KY",
    "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN",
    "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
    "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH",
    "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD",
    "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA",
    "54": "WV", "55": "WI", "56": "WY",
  };

  if (!stateAbbr && stateFips) {
    stateAbbr = stateFipsToName[stateFips] || stateFips;
  }

  // If still no county name, default to the state name (for DC and county equivalents)
  if (!countyName && stateFips) {
    countyName = stateAbbr || stateFips;
  }

  return {
    matched: true,
    tract: tract,
    countyFips: countyFips,
    stateFips: stateFips,
    fullGeoId: `${stateFips}${countyFips}${tract}`,
    county: countyName,
    state: stateAbbr,
  };
}

function emptyResult(): GeocodeResponse {
  return {
    matched: false,
    tract: "",
    countyFips: "",
    stateFips: "",
    fullGeoId: "",
    county: "",
    state: "",
  };
}
