import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { WorkspaceData } from "../types";
import { FacilityRows } from "./facility-rows";

const statusColors: Record<string, string> = { "Sangat Rendah": "var(--status-very-low)", "Rendah": "var(--status-low)", "Sedang": "var(--status-medium)", "Tinggi": "var(--status-high)", "Sangat Tinggi": "var(--status-very-high)" };

export function OverviewPanel({ overview }: { overview: WorkspaceData["overview"] }) {
  return (
    <div className="gis-overview-content flex flex-col gap-4">
      <div className="gis-metric-grid grid grid-cols-[repeat(2,minmax(0,1fr))] gap-2 max-[639.01px]:grid-cols-[1fr]">
        {overview.metrics.map((metric) => <Card className="gis-card border-0 [outline:1px_solid_var(--gis-border)] [outline-offset:-1px] p-4 rounded-2xl [&_h2]:text-[16px] [&_h2]:leading-[24px] [&_h2]:font-medium gis-metric-card min-h-27 [&_strong]:block [&_strong]:font-medium [&_strong]:text-[24px] [&_strong]:leading-[32px] [&_>_span]:block [&_>_span]:mt-2 [&_>_span]:text-[12px] [&_>_span]:leading-[16px] min-[1000px]:max-[1199.01px]:[&_strong]:text-[21px] max-[639.01px]:min-h-27" key={metric.id}><p>{metric.label}</p><strong>{metric.value}</strong><span className={metric.trend === "increase" ? "gis-trend-up text-[#f00]" : "gis-trend-down text-[#2bb600]"}>{metric.change}</span></Card>)}
      </div>
      <Card className="gis-card border-0 [outline:1px_solid_var(--gis-border)] [outline-offset:-1px] p-4 rounded-2xl [&_h2]:text-[16px] [&_h2]:leading-[24px] [&_h2]:font-medium gis-summary-card min-h-51 [&_p]:mt-2 max-[999.01px]:min-h-0"><h2>Ringkasan Kondisi</h2><p>{overview.summary}</p></Card>
      <Card className="gis-card border-0 [outline:1px_solid_var(--gis-border)] [outline-offset:-1px] p-4 rounded-2xl [&_h2]:text-[16px] [&_h2]:leading-[24px] [&_h2]:font-medium gis-risk-card min-h-63 [&_ul]:pl-[21px] [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2 max-[999.01px]:min-h-0">
        <div className="gis-card-heading flex items-center justify-between gap-2"><h2>Status Kerawanan</h2><Badge className="gis-badge inline-flex items-center p-[4px_8px] rounded-lg bg-[#737373] text-[#fff] text-[12px] font-semibold leading-[16px]" style={{ backgroundColor: statusColors[overview.susceptibility.label] ?? "var(--muted)", color: "#111" }}>{overview.susceptibility.label}</Badge></div>
        <div className="gis-risk-scale flex h-6 gap-1 mt-2 [&_span]:flex-1 [&_span]:rounded-lg" aria-label={`Status kerawanan contoh: ${overview.susceptibility.label}`}>
          {overview.susceptibility.colors.map((color) => <span key={color} style={{ backgroundColor: color }} />)}
        </div>
        <ul>{overview.susceptibility.notes.map((note) => <li key={note}>{note}</li>)}</ul>
      </Card>
      <Card className="gis-card border-0 [outline:1px_solid_var(--gis-border)] [outline-offset:-1px] p-4 rounded-2xl [&_h2]:text-[16px] [&_h2]:leading-[24px] [&_h2]:font-medium gis-facilities-card flex flex-col gap-2">
        <h2>Fasilitas Terdampak</h2>
        <FacilityRows facilities={overview.facilities} />
      </Card>
      <Card className="gis-card border-0 [outline:1px_solid_var(--gis-border)] [outline-offset:-1px] p-4 rounded-2xl [&_h2]:text-[16px] [&_h2]:leading-[24px] [&_h2]:font-medium gis-land-card min-h-22"><h2>Tutupan Lahan</h2><div className="gis-tags flex flex-wrap gap-2 mt-2">{overview.landCover.map((label) => <Badge key={label} className="gis-badge inline-flex items-center p-[4px_8px] rounded-lg bg-[#737373] text-[#fff] text-[12px] font-semibold leading-[16px]">{label}</Badge>)}</div></Card>
      <Card className="gis-card border-0 [outline:1px_solid_var(--gis-border)] [outline-offset:-1px] p-4 rounded-2xl [&_h2]:text-[16px] [&_h2]:leading-[24px] [&_h2]:font-medium gis-inline-card [&_strong]:font-semibold flex justify-between items-center gap-2"><h2>Elevasi (DEM)</h2><strong>{overview.elevation}</strong></Card>
      <Card className="gis-card border-0 [outline:1px_solid_var(--gis-border)] [outline-offset:-1px] p-4 rounded-2xl [&_h2]:text-[16px] [&_h2]:leading-[24px] [&_h2]:font-medium gis-inline-card [&_strong]:font-semibold flex justify-between items-center gap-2"><h2>Jaringan Sungai</h2><strong>{overview.rivers}</strong></Card>
    </div>
  );
}
