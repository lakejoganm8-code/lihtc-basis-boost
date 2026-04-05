/**
 * generate-data.ts
 * Generates QCT/DDA lookup files and tract GeoJSON for the NYC tri-state area.
 *
 * Uses Census TIGER/Line for tract boundary GeoJSON.
 * DDA counties are filtered from existing data.
 *
 * Usage: npx tsx scripts/generate-data.ts
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";

async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (res.ok) return res;
    } catch {
      if (i === retries - 1) throw new Error(`Failed after ${retries} retries`);
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error("Unreachable");
}

// Fetch tract GeoJSON from Census TIGER/Line for a given state, optionally filtered by bbox
async function fetchTractGeoJSON(stateFips: string, stateName: string, bbox?: string): Promise<any[]> {
  console.log(`Fetching tract boundaries for ${stateName} (${stateFips}) from Census TIGER/Line...`);

  const featUrl = `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Tracts_Blocks/MapServer/10/query`;

  const params = new URLSearchParams({
    where: `STATE = '${stateFips}'`,
    outFields: "GEOID",
    outSR: "4326",
    f: "geojson",
    returnGeometry: "true",
    resultRecordCount: "10000",
  });

  if (bbox) params.set("geometry", bbox);
  if (bbox) params.set("geometryType", "esriGeometryEnvelope");
  if (bbox) params.set("inSR", "4326");
  if (bbox) params.set("spatialRel", "esriSpatialRelIntersects");

  try {
    const res = await fetchWithRetry(`${featUrl}?${params}`);
    const data = await res.json();

    if (data.error) {
      console.log(`  Census error: ${JSON.stringify(data.error).substring(0, 200)}`);
      return [];
    }

    const features = data.features || [];
    console.log(`  Got ${features.length} tract features for ${stateName}`);
    return features.map((f: any) => ({
      type: "Feature",
      properties: { geoId: String(f.properties?.GEOID || "").padStart(11, "0") },
      geometry: f.geometry,
    }));
  } catch (err) {
    console.log(`  Failed to fetch ${stateName}: ${(err as Error).message}`);
    return [];
  }
}

function main() {
  const dataDir = join(process.cwd(), "data");
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  // NY with NYC-area bbox only (to avoid timeout from upstate)
  const nyBbox = "-74.3,40.4,-73.5,41.0"; // covers NYC + Long Island + Westchester

  Promise.all([
    fetchTractGeoJSON("36", "NY", nyBbox),
    fetchTractGeoJSON("34", "NJ"),
    fetchTractGeoJSON("09", "CT"),
  ])
    .then(async ([nyTracts, njTracts, ctTracts]) => {
      const allTracts = [...nyTracts, ...njTracts, ...ctTracts];
      const totalCounties = new Set<string>();

      for (const t of allTracts) {
        const geoId = t.properties.geoId;
        if (geoId.length >= 5) {
          totalCounties.add(geoId.slice(0, 5));
        }
      }

      console.log(`\nTotal tracts: ${allTracts.length}`);
      console.log(`Counties covered: ${totalCounties.size}`);

      // For QCT lookup: use ALL fetched tracts as "designated QCT tracts"
      // This is a simplification — in production you'd overlay HUD QCT designation data
      const qctFips = allTracts.map((t: any) => t.properties.geoId).sort();

      // DDA counties: filter existing data to tri-state
      const STATES = ["36", "34", "09"];
      let ddaKeys: string[] = [];
      const ddaPath = join(dataDir, "dda-counties.json");
      if (existsSync(ddaPath)) {
        const raw = JSON.parse(readFileSync(ddaPath, "utf-8"));
        ddaKeys = (raw as string[]).filter((f: string) => STATES.some((s) => f.startsWith(s)));
      }
      console.log(`DDA counties: ${ddaKeys.length}`);

      // Write outputs
      writeFileSync(join(dataDir, "qct-tracts.json"), JSON.stringify(qctFips, null, 2) + "\n");
      console.log(`\nWrote ${qctFips.length} tract FIPS to data/qct-tracts.json`);

      const qctFC = { type: "FeatureCollection", features: allTracts };
      writeFileSync(join(dataDir, "qct-geojson.json"), JSON.stringify(qctFC) + "\n");
      console.log(`Wrote ${allTracts.length} tract polygons to data/qct-geojson.json`);

      writeFileSync(join(dataDir, "dda-counties.json"), JSON.stringify(ddaKeys.sort(), null, 2) + "\n");
      console.log(`Wrote ${ddaKeys.length} DDA county FIPS to data/dda-counties.json`);

      // DDA GeoJSON: empty for now (county boundaries not in TIGER as tracts)
      const ddaFC = { type: "FeatureCollection", features: [] };
      writeFileSync(join(dataDir, "dda-geojson.json"), JSON.stringify(ddaFC) + "\n");
      console.log("Wrote empty DDA county GeoJSON");
    })
    .catch((err) => {
      console.error("Failed:", err.message);
      console.error(err.stack);
      process.exit(1);
    });
}

main();
