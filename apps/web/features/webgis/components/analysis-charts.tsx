"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { AnalysisData } from "../analysis-types";

type Snapshot = AnalysisData["snapshots"][number];
const eventConfig = { events: { label: "Kejadian", color: "var(--primary)" } } satisfies ChartConfig;
const riskConfig = { value: { label: "Jumlah wilayah" } } satisfies ChartConfig;

export function FrequencyChart({ frequency }: { frequency: Snapshot["frequency"] }) {
  return <Card className="analysis-frequency h-[330px] [&_[data-slot=chart]_.recharts-yAxis-tick-labels_text]:[fill:#171717]"><h2>Frekuensi Banjir</h2>
    <ChartContainer config={eventConfig} className="h-[258px] w-full aspect-auto" aria-label="Frekuensi banjir">
      <BarChart accessibilityLayer layout="vertical" data={frequency} margin={{ top: -4, right: 0, bottom: 0, left: 0 }}>
        <XAxis type="number" domain={[0, 40]} ticks={[0, 10, 20, 30, 40]} tickLine={false} axisLine={false} height={24} tickMargin={8} />
        <YAxis type="category" dataKey="id" interval={0} tickFormatter={(id) => frequency.find((row) => row.id === id)?.region || ""} tickLine={false} axisLine={false} width={156} tickMargin={16} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent labelFormatter={(_, payload) => payload?.[0]?.payload?.region ?? "Frekuensi Banjir"} />} />
        <Bar dataKey="events" fill="var(--color-events)" radius={[0, 8, 8, 0]} barSize={16} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  </Card>;
}

export function SusceptibilityChart({ distribution }: { distribution: Snapshot["distribution"] }) {
  return <Card className="analysis-susceptibility h-[330px] [&_[data-slot=chart]_.recharts-yAxis-tick-labels_text]:[fill:#171717]"><h2>Distribusi Kerawanan</h2>
    <ChartContainer config={riskConfig} className="h-[258px] w-full aspect-auto" aria-label="Distribusi kerawanan, data belum tersedia">
      <BarChart accessibilityLayer layout="vertical" data={distribution} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <XAxis type="number" domain={[0, 40]} ticks={[0, 10, 20, 30, 40]} tickLine={false} axisLine={false} height={24} tickMargin={8} />
        <YAxis type="category" dataKey="label" interval={0} tickLine={false} axisLine={false} width={112} tickMargin={16} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={16} isAnimationActive={false}>{distribution.map((entry) => <Cell key={entry.label} fill={entry.color} />)}</Bar>
      </BarChart>
    </ChartContainer>
  </Card>;
}

export function AnnualEventsChart({ annualEvents }: { annualEvents: Snapshot["annualEvents"] }) {
  return <Card className="analysis-annual h-[314px]"><h2>Distribusi Kejadian/Tahun</h2>
    <ChartContainer config={eventConfig} className="h-[240px] w-full aspect-auto" aria-label="Distribusi kejadian per tahun">
      <BarChart accessibilityLayer data={annualEvents} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" tickLine={false} axisLine={false} interval={0} tickMargin={8} height={24} padding={{ left: -12, right: -12 }} />
        <YAxis domain={[0, 80]} ticks={[0, 20, 40, 60, 80]} tickLine={false} axisLine={false} width={37} tickMargin={8} />
        <ChartTooltip cursor={{ fill: "var(--primary)", opacity: .06 }} content={<ChartTooltipContent />} />
        <Bar dataKey="events" fill="var(--color-events)" maxBarSize={48} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  </Card>;
}
