import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export async function readPrepared<T>(name: "catalog" | "boundaries" | "facilities"): Promise<T & { prepared_at: string }> {
  const directory = process.env.BEJIR_PREPARED_DATA_DIR || resolve(process.cwd(), "../../data/processed/web");
  const data = JSON.parse(await readFile(resolve(directory, `${name}.json`), "utf8"));
  const source = (process.env.BEJIR_API_URL || "http://80.43.0.180:8000").replace(/\/+$/, "");
  if (data.source !== source || !Number.isFinite(Date.parse(data.prepared_at))) throw new Error("Sumber data olahan tidak cocok.");
  return data;
}
