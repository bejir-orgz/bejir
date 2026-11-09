import type { Metadata } from "next";
import { RainfallPage } from "@/features/rainfall/components/rainfall-page";
import { mockRainfall } from "@/mocks/rainfall";

export const metadata: Metadata = { title: "Curah Hujan" };

export default function Page() {
  return <RainfallPage data={mockRainfall} />;
}
