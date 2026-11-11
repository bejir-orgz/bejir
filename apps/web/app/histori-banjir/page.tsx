import type { Metadata } from "next";
import { HistoryPage } from "@/features/floods/components/history-page";
import { getFloodHistory } from "@/features/floods/api";
import { unavailableSnapshot } from "@/features/floods/history-summary";
import type { FloodHistoryData } from "@/features/floods/types";

export const metadata: Metadata = { title: "Histori Banjir" };

export default async function Page() {
  let data: FloodHistoryData;
  try {
    data = await getFloodHistory();
  } catch {
    const year = Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date()));
    data = {
      source: "backend", error: "Data histori banjir gagal dimuat.",
      years: [year], regions: [], rows: [], snapshots: { [year]: unavailableSnapshot },
    };
  }
  return <HistoryPage data={data} />;
}
