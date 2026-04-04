import path from "path";
import { promises as fs } from "fs";

let qctSet: Set<string> | null = null;

async function loadQCTTracts(): Promise<Set<string>> {
  if (qctSet) return qctSet;

  const filePath = path.join(process.cwd(), "data", "qct-tracts.json");
  const rawData = await fs.readFile(filePath, "utf-8");
  const data: string[] = JSON.parse(rawData);
  qctSet = new Set(data);
  return qctSet;
}

export async function isQCT(fullGeoId: string): Promise<boolean> {
  const tracts = await loadQCTTracts();
  return tracts.has(fullGeoId);
}
