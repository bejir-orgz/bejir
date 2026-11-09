import type { Metadata } from "next";
import { AnalysisPage } from "@/features/webgis/components/analysis-page";
import { mockAnalysis } from "@/mocks/analysis";

export const metadata: Metadata = { title: "Analisis" };

export default function Page() {
  return <AnalysisPage data={mockAnalysis} />;
}
