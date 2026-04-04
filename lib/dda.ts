import path from "path";
import { promises as fs } from "fs";

let ddaSet: Set<string> | null = null;

async function loadDDACounties(): Promise<Set<string>> {
  if (ddaSet) return ddaSet;

  const filePath = path.join(process.cwd(), "data", "dda-counties.json");
  const rawData = await fs.readFile(filePath, "utf-8");
  const data: string[] = JSON.parse(rawData);
  ddaSet = new Set(data);
  return ddaSet;
}

export async function isDDACounty(stateFips: string, countyFips: string): Promise<boolean> {
  const counties = await loadDDACounties();
  return counties.has(`${stateFips}${countyFips}`);
}
