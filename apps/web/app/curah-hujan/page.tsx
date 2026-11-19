import type { Metadata } from "next";
import { connection } from "next/server";
import { RainfallPage } from "@/features/rainfall/components/rainfall-page";
import { emptyRainfallData, getRainfallPageData } from "@/features/rainfall/api";

export const metadata: Metadata = { title: "Curah Hujan" };

export default async function Page() {
  // Keep upstream failures retryable instead of prerendering an empty page during build.
  await connection();
  let data;
  try { data = await getRainfallPageData(); }
  catch { data = emptyRainfallData("Data curah hujan gagal dimuat. Muat ulang halaman untuk mencoba lagi."); }
  return <RainfallPage data={data} />;
}
