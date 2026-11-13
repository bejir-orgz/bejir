import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { connection } from "next/server";
import { RainfallPage } from "@/features/rainfall/components/rainfall-page";
import { emptyRainfallData, getRainfallPageData } from "@/features/rainfall/api";

export const metadata: Metadata = { title: "Curah Hujan" };
const rainfallData = unstable_cache(getRainfallPageData, ["rainfall-spatial", process.env.BEJIR_API_URL || "documented"], { revalidate: 300 });

export default async function Page() {
  // Keep upstream failures retryable instead of prerendering an empty page during build.
  await connection();
  let data;
  try { data = await rainfallData(); }
  catch { data = emptyRainfallData("Data curah hujan gagal dimuat. Muat ulang halaman untuk mencoba lagi."); }
  return <RainfallPage data={data} />;
}
