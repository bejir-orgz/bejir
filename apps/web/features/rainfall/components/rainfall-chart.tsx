"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { RainfallPageData } from "../types";

const chartConfig = { rainfallMm: { label: "Curah hujan (mm)", color: "var(--primary)" } } satisfies ChartConfig;

export function RainfallChart({ distribution }: { distribution: RainfallPageData["snapshots"][number]["distribution"] }) {
  return <Card className="rainfall-chart p-4 h-[310px] min-w-0 max-[700.01px]:p-3"><h2>Distribusi Curah Hujan Bulanan</h2>
    <ChartContainer config={chartConfig} className="h-[238px] w-full aspect-auto" aria-label="Contoh distribusi curah hujan bulanan dalam milimeter, data dummy">
      <BarChart accessibilityLayer data={distribution} margin={{ top: 4, left: 0, right: 0, bottom: 0 }} barCategoryGap="9%">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} interval={0} minTickGap={0} tickMargin={8} height={24} padding={{ left: 10, right: 10 }} />
        <YAxis domain={[0, 24]} ticks={[0, 6, 12, 18, 24]} tickLine={false} axisLine={false} width={37} tickMargin={8} />
        <ChartTooltip cursor={{ fill: "var(--primary)", opacity: .06 }} content={<ChartTooltipContent />} />
        <Bar dataKey="rainfallMm" fill="var(--color-rainfallMm)" maxBarSize={48} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  </Card>;
}
