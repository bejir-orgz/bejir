import type { Metadata } from "next";
import { HistoryPage } from "@/features/floods/components/history-page";
import { mockFloodHistory } from "@/mocks/flood-history";

export const metadata: Metadata = { title: "Histori Banjir" };

export default function Page() {
  return <HistoryPage data={mockFloodHistory} />;
}
