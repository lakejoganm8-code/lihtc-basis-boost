/**
 * generate-data.ts
 * Fetches QCT tract FIPS codes from the ArcGIS REST API and generates
 * a compact lookup file at /data/qct-tracts.json.
 *
 * Usage: npx tsx scripts/generate-data.ts
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const QCT_SERVICE_URL =
  "https://services3.arcgis.com/QnAlpI4OtHhbgGN9/arcgis/rest/services/FCPR_Webmap_V_1_WFL1/FeatureServer/0/query";

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
    } catch {
      if (i === retries - 1) throw new Error(`Failed after ${retries} retries`);
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
  throw new Error("Unreachable");
}

async function fetchQCTTracts(): Promise<string[]> {
  console.log("Fetching QCT tract data from ArcGIS...");

  const params = new URLSearchParams({
    where: "QCT_DESIGNATION = 'QCT'",
    outFields: "TRACT",
    returnGeometry: "false",
    f: "json",
    resultOffset: "0",
    resultRecordCount: "2000",
  });

  const url = `${QCT_SERVICE_URL}?${params}`;
  const res = await fetchWithRetry(url);
  const data = await res.json();

  if (data.error) {
    throw new Error(`ArcGIS error: ${JSON.stringify(data.error)}`);
  }

  const features = data.features || [];
  console.log(`Found ${features.length} QCT features`);

  return features
    .map((f: { attributes: Record<string, string> }) => f.attributes?.TRACT)
    .filter((t: string | undefined): t is string => !!t)
    .sort();
}

function main() {
  fetchQCTTracts()
    .then((tracts) => {
      const dataDir = join(process.cwd(), "data");
      if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
      }
      const outputPath = join(dataDir, "qct-tracts.json");
      writeFileSync(outputPath, JSON.stringify(tracts, null, 2) + "\n");
      console.log(`\nWrote ${tracts.length} QCT tract FIPS to ${outputPath}`);
    })
    .catch((err) => {
      console.error("Failed to generate QCT data:", err.message);
      process.exit(1);
    });
}

main();
