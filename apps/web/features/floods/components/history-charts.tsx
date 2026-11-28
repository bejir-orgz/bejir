"use client";

import { useId } from "react";
import { useReducedMotion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { AnimatedMetricValue } from "@/components/shared/animated-metric-value";
import type { FloodHistoryData } from "../types";

type Snapshot = FloodHistoryData["snapshots"][number];
const casualtyConfig = { deaths: { label: "Meninggal", color: "var(--death)" }, missing: { label: "Hilang", color: "var(--missing)" } } satisfies ChartConfig;
const timelineConfig = { events: { label: "Kejadian", color: "var(--primary)" } } satisfies ChartConfig;

export function CasualtyChart({ snapshot }: { snapshot: Snapshot }) {
  const reduced = useReducedMotion();
  const total = snapshot.deaths === null || snapshot.missing === null ? null : snapshot.deaths + snapshot.missing;
  const values = [{ kind: "deaths", value: snapshot.deaths }, { kind: "missing", value: snapshot.missing }];
  const chartValues = total === 0
    ? [{ kind: "empty", value: 1 }]
    : values.map((entry) => ({ ...entry, value: entry.value ?? 0 }));

  return (
    <Card className="history-casualties h-109 p-4 max-[700.01px]:h-auto">
      <h2>Distribusi Korban</h2>
      <div className="history-donut relative w-55 h-55 m-[24px_auto]" role="img" aria-label={total === null ? "Data korban belum tersedia." : `Total ${total} korban: ${snapshot.deaths} meninggal dan ${snapshot.missing} hilang.`}>
        <ChartContainer config={casualtyConfig} className="size-[220px] aspect-square">
          <PieChart>
            <Pie
              data={chartValues}
              dataKey="value"
              nameKey="kind"
              innerRadius={84}
              outerRadius={110}
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
              isAnimationActive={!reduced}
              animationDuration={420}
              animationEasing="ease-out"
            >
              {chartValues.map((entry) => (
                <Cell
                  key={entry.kind}
                  fill={entry.kind === "empty" ? "#e5e5e5" : `var(--color-${entry.kind})`}
                />
              ))}
            </Pie>
            {total !== 0 && total !== null && <ChartTooltip content={<ChartTooltipContent hideLabel />} />}
          </PieChart>
        </ChartContainer>
        <div className="history-donut-total absolute [inset:0] flex flex-col items-center justify-center gap-1 pointer-events-none [&>span]:text-[12px] [&>span]:leading-[16px] [&>span]:text-neutral-500 [&_strong]:text-[24px] [&_strong]:leading-[30px] [&_strong]:font-semibold">
          <span>Total Korban</span>
          <strong><AnimatedMetricValue value={total === null ? "—" : total.toLocaleString("id-ID")} /></strong>
        </div>
      </div>
      <div className="history-casualty-legend grid gap-4">
        {values.map((entry) => {
          const isMissing = entry.kind === "missing";
          return (
            <div className="history-casualty-row h-12 flex items-stretch gap-2.5" key={entry.kind}>
              <span
                className={`w-2 rounded-lg shrink-0 ${isMissing ? "bg-[var(--missing)]" : "bg-[var(--death)]"}`}
                aria-hidden="true"
              />
              <div className="flex flex-1 flex-col justify-center gap-0.5">
                <span className="text-[12px] leading-[16px] text-neutral-600">
                  {casualtyConfig[entry.kind as keyof typeof casualtyConfig].label}
                </span>
                <strong className="text-[16px] leading-[24px] font-semibold tabular-nums">
                  {entry.value === null ? "—" : entry.value.toLocaleString("id-ID")}
                </strong>
              </div>
              <b
                className={`w-16 grid place-items-center rounded-lg text-[15px] font-semibold tabular-nums ${
                  isMissing ? "bg-[#fef9c2] text-[#713f12]" : "bg-[#ffdddd] text-[#7f1d1d]"
                }`}
              >
                {entry.value === null || total === null ? "—" : `${total ? Math.round((entry.value / total) * 100) : 0}%`}
              </b>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function TimelineChart({ snapshot }: { snapshot: Snapshot }) {
  const reduced = useReducedMotion();
  const gradientId = useId().replaceAll(":", "");
  return (
    <Card className="history-timeline p-4 h-78 min-w-0 [&_h2]:mb-4 max-[700.01px]:p-3">
      <h2>Timeline Banjir Bulanan</h2>
      <ChartContainer config={timelineConfig} className="h-[240px] w-full aspect-auto" aria-label="Timeline kejadian banjir bulanan">
        <AreaChart accessibilityLayer data={snapshot.timeline} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.24} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={12} interval={0} minTickGap={0} height={28} />
          <YAxis
            domain={[0, (dataMax: number) => Math.max(10, Math.ceil((Number.isFinite(dataMax) ? dataMax : 10) * 1.25))]}
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={36}
            tickMargin={8}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="events"
            stroke="var(--color-events)"
            fill={`url(#${gradientId})`}
            strokeWidth={2.25}
            dot={{ r: 3, fill: "var(--primary)", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive={!reduced}
            animationDuration={420}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ChartContainer>
    </Card>
  );
}
