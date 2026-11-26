"use client";

import { useReducedMotion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { AnalysisData } from "../analysis-types";

type Snapshot = AnalysisData["snapshots"][number];
const eventConfig = { events: { label: "Kejadian", color: "var(--primary)" } } satisfies ChartConfig;
const riskConfig = { value: { label: "Jumlah kecamatan" } } satisfies ChartConfig;

export function FrequencyChart({ frequency }: { frequency: Snapshot["frequency"] }) {
  const reduced = useReducedMotion();
  return (
    <Card className="analysis-frequency min-h-[364px] [&_[data-slot=chart]_.recharts-yAxis-tick-labels_text]:[fill:#171717]">
      <h2>Frekuensi Banjir Tertinggi</h2>
      {!frequency.length ? (
        <div className="h-[296px] grid place-items-center text-center text-sm text-neutral-500 px-4" role="status">
          Data frekuensi banjir tersedia pada cakupan provinsi atau kabupaten/kota. Pilih kabupaten/kota di filter atas untuk melihat perbandingan kejadian.
        </div>
      ) : (
        <ChartContainer config={eventConfig} className="h-[296px] w-full aspect-auto" aria-label="Frekuensi banjir">
          <BarChart accessibilityLayer layout="vertical" data={frequency} margin={{ top: 2, right: 12, bottom: 4, left: 0 }}>
            <XAxis type="number" domain={[0, "auto"]} allowDecimals={false} tickLine={false} axisLine={false} height={24} tickMargin={8} />
            <YAxis
              type="category"
              dataKey="id"
              interval={0}
              tick={{ fontSize: 12 }}
              tickFormatter={(id) => {
                const name = frequency.find((row) => row.id === id)?.region || "";
                return name.replace(/^Kabupaten\s+/i, "Kab. ");
              }}
              tickLine={false}
              axisLine={false}
              width={148}
              tickMargin={12}
            />
            <ChartTooltip cursor={{ fill: "var(--primary)", opacity: 0.06 }} content={<ChartTooltipContent labelFormatter={(_, payload) => payload?.[0]?.payload?.region ?? "Frekuensi Banjir"} />} />
            <Bar
              dataKey="events"
              fill="var(--color-events)"
              radius={[0, 8, 8, 0]}
              barSize={16}
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

export function SusceptibilityChart({ distribution }: { distribution: Snapshot["distribution"] }) {
  const reduced = useReducedMotion();
  const hasData = distribution.some((entry) => entry.value !== null);
  return (
    <Card className="analysis-susceptibility min-h-[364px] [&_[data-slot=chart]_.recharts-yAxis-tick-labels_text]:[fill:#171717]">
      <h2>Distribusi Kelas Kerawanan</h2>
      {!hasData ? (
        <div className="h-[296px] grid place-items-center text-center text-sm text-neutral-500 px-4" role="status">
          Distribusi kelas kerawanan dihitung pada tingkat kecamatan. Pilih provinsi, kabupaten/kota, atau kecamatan untuk menampilkan sebaran kelas.
        </div>
      ) : (
        <ChartContainer config={riskConfig} className="h-[296px] w-full aspect-auto" aria-label="Jumlah kecamatan menurut kelas kerawanan dominan">
          <BarChart accessibilityLayer layout="vertical" data={distribution} margin={{ top: 2, right: 12, left: 0, bottom: 4 }}>
            <XAxis type="number" domain={[0, "auto"]} allowDecimals={false} tickLine={false} axisLine={false} height={24} tickMargin={8} />
            <YAxis type="category" dataKey="label" interval={0} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={116} tickMargin={12} />
            <ChartTooltip cursor={{ fill: "#171717", opacity: 0.04 }} content={<ChartTooltipContent />} />
            <Bar
              dataKey="value"
              radius={[0, 8, 8, 0]}
              barSize={18}
              isAnimationActive={!reduced}
              animationDuration={400}
              animationEasing="ease-out"
            >
              {distribution.map((entry) => (
                <Cell key={entry.label} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </Card>
  );
}

export function AnnualEventsChart({ annualEvents }: { annualEvents: Snapshot["annualEvents"] }) {
  const reduced = useReducedMotion();
  return (
    <Card className="analysis-annual h-[314px]">
      <h2>Distribusi Kejadian 5 Tahun Terakhir</h2>
      {!annualEvents.length ? (
        <div className="h-[240px] grid place-items-center text-center text-sm text-neutral-500 px-4" role="status">
          Tren tahunan tersedia pada cakupan provinsi atau kabupaten/kota.
        </div>
      ) : (
        <ChartContainer config={eventConfig} className="h-[240px] w-full aspect-auto" aria-label="Distribusi kejadian per tahun">
          <BarChart accessibilityLayer data={annualEvents} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="year" tickLine={false} axisLine={false} interval={0} tickMargin={8} height={24} />
            <YAxis domain={[0, "auto"]} allowDecimals={false} tickLine={false} axisLine={false} width={37} tickMargin={8} />
            <ChartTooltip cursor={{ fill: "var(--primary)", opacity: 0.08 }} content={<ChartTooltipContent />} />
            <Bar
              dataKey="events"
              fill="var(--color-events)"
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
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
