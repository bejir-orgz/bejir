import type { Metadata } from "next";
import { connection } from "next/server";
import { AnalysisPage } from "@/features/webgis/components/analysis-page";
import { emptyAnalysisData, getAnalysisData } from "@/features/webgis/analysis-api";

export const metadata: Metadata = { title: "Analisis" };

export default async function Page() {
  await connection();
  let data;
  try {
    data = await getAnalysisData();
  } catch {
    data = emptyAnalysisData("Data analisis gagal dimuat. Muat ulang halaman untuk mencoba lagi.");
  }
  return <AnalysisPage data={data} />;
}
