"use client";

import { useReducedMotion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { RainfallPageData } from "../types";

const chartConfig = { rainfallMm: { label: "Curah hujan (mm)", color: "var(--primary)" } } satisfies ChartConfig;

export function RainfallChart({ distribution }: { distribution: RainfallPageData["snapshots"][number]["distribution"] }) {
  const reduced = useReducedMotion();
  return (
    <Card className="rainfall-chart p-4 h-[310px] min-w-0 max-[700.01px]:p-3">
      <h2>Distribusi Curah Hujan Bulanan</h2>
      {!distribution.length ? (
        <div className="h-[238px] grid place-items-center text-center text-sm text-neutral-500 px-4" role="status">
          Seri curah hujan bulanan belum tersedia untuk pilihan ini. Pilih tahun atau cakupan wilayah lain untuk memeriksa ketersediaan seri.
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="h-[238px] w-full aspect-auto" aria-label="distribusi curah hujan bulanan dalam milimeter, seri bulanan">
          <BarChart accessibilityLayer data={distribution} margin={{ top: 4, left: 0, right: 0, bottom: 0 }} barCategoryGap="11%">
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} interval={0} minTickGap={0} tickMargin={8} height={24} padding={{ left: 10, right: 10 }} />
            <YAxis domain={[0, "auto"]} tickLine={false} axisLine={false} width={45} tickMargin={8} />
            <ChartTooltip cursor={{ fill: "var(--primary)", opacity: 0.08 }} content={<ChartTooltipContent />} />
            <Bar
              dataKey="rainfallMm"
              fill="var(--color-rainfallMm)"
              radius={[6, 6, 0, 0]}
              maxBarSize={46}
              isAnimationActive={!reduced}
              animationDuration={400}
              animationEasing="ease-out"
            />
          </BarChart>
        </ChartContainer>
      )}
    </Card>
  );
}
