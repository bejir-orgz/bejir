"use client";

import { useId } from "react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { FloodHistoryData } from "../types";

type Snapshot = FloodHistoryData["snapshots"][number];
const casualtyConfig = { deaths: { label: "Meninggal", color: "var(--death)" }, missing: { label: "Hilang", color: "var(--missing)" } } satisfies ChartConfig;
const timelineConfig = { events: { label: "Kejadian", color: "var(--primary)" } } satisfies ChartConfig;

export function CasualtyChart({ snapshot }: { snapshot: Snapshot }) {
  const total = snapshot.deaths === null || snapshot.missing === null ? null : snapshot.deaths + snapshot.missing;
  const values = [{ kind: "deaths", value: snapshot.deaths }, { kind: "missing", value: snapshot.missing }];
  return <Card className="history-casualties h-109 p-4 max-[700.01px]:h-109">
    <h2>Distribusi Korban</h2>
    <div className="history-donut relative w-55 h-55 m-[24px_auto]" role="img" aria-label={total === null ? "Data korban belum tersedia." : `Total ${total} korban: ${snapshot.deaths} meninggal dan ${snapshot.missing} hilang.`}>
      <ChartContainer config={casualtyConfig} className="size-[220px] aspect-square">
        <PieChart><Pie data={values} dataKey="value" nameKey="kind" innerRadius={84} outerRadius={110} startAngle={90} endAngle={-270} strokeWidth={0} isAnimationActive={false}>
          {values.map((entry) => <Cell key={entry.kind} fill={`var(--color-${entry.kind})`} />)}
        </Pie><ChartTooltip content={<ChartTooltipContent hideLabel />} /></PieChart>
      </ChartContainer>
      <div className="history-donut-total absolute [inset:0] flex flex-col items-center justify-center gap-1 pointer-events-none [&_span]:text-[12px] [&_span]:leading-[16px] [&_strong]:text-[20px] [&_strong]:leading-[28px] [&_strong]:font-semibold"><span>Total Korban</span><strong>{total ?? "—"}</strong></div>
    </div>
    <div className="history-casualty-legend grid gap-4">{values.map((entry) => <div className={`history-casualty-row h-12 flex items-stretch gap-2 [&_>_div]:flex [&_>_div]:flex-1 [&_>_div]:flex-col [&_>_div]:justify-center [&_>_div]:gap-1 [&_span:not(.history-casualty-swatch)]:text-[12px] [&_span:not(.history-casualty-swatch)]:leading-[16px] [&_strong]:text-[16px] [&_strong]:leading-[24px] [&_strong]:font-semibold [&_b]:w-16 [&_b]:grid [&_b]:[place-items:center] [&_b]:rounded-lg [&_b]:bg-[#ffdddd] [&_b]:text-[16px] [&_b]:font-medium history-${entry.kind} ${entry.kind === "missing" ? "[&_.history-casualty-swatch]:bg-[var(--missing)] [&_b]:bg-[#fef9c2]" : ""}`} key={entry.kind}>
      <span className="history-casualty-swatch w-2 rounded-lg bg-[var(--death)]" aria-hidden="true" /><div><span>{casualtyConfig[entry.kind as keyof typeof casualtyConfig].label}</span><strong>{entry.value ?? "—"}</strong></div>
      <b>{entry.value === null || total === null ? "—" : `${total ? Math.round(entry.value / total * 100) : 0}%`}</b>
    </div>)}</div>
  </Card>;
}

export function TimelineChart({ snapshot }: { snapshot: Snapshot }) {
  const gradientId = useId().replaceAll(":", "");
  return <Card className="history-timeline p-4 h-78 min-w-0 [&_h2]:mb-4 max-[700.01px]:p-3"><h2>Timeline Banjir</h2>
    <ChartContainer config={timelineConfig} className="h-[240px] w-full aspect-auto" aria-label="Timeline kejadian banjir bulanan">
      <AreaChart accessibilityLayer data={snapshot.timeline} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
        <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={.18} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={.01} /></linearGradient></defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={12} interval={0} minTickGap={0} height={28} />
        <YAxis domain={[0, 300]} ticks={[0, 100, 150, 200, 300]} tickLine={false} axisLine={false} width={36} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area type="linear" dataKey="events" stroke="var(--color-events)" fill={`url(#${gradientId})`} strokeWidth={2} dot={{ r: 3, fill: "var(--primary)", strokeWidth: 0 }} activeDot={{ r: 5 }} isAnimationActive={false} />
      </AreaChart>
    </ChartContainer>
  </Card>;
}
