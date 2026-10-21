import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { WorkspaceData } from "../types";
import { FacilityRows } from "./facility-rows";

const statusColors: Record<string, string> = { "Sangat Rendah": "var(--status-very-low)", "Rendah": "var(--status-low)", "Sedang": "var(--status-medium)", "Tinggi": "var(--status-high)", "Sangat Tinggi": "var(--status-very-high)" };

export function OverviewPanel({ overview }: { overview: WorkspaceData["overview"] }) {
  return (
    <div className="gis-overview-content">
      <div className="gis-metric-grid">
        {overview.metrics.map((metric) => <Card className="gis-card gis-metric-card" key={metric.id}><p>{metric.label}</p><strong>{metric.value}</strong><span className={metric.trend === "increase" ? "gis-trend-up" : "gis-trend-down"}>{metric.change}</span></Card>)}
      </div>
      <Card className="gis-card gis-summary-card"><h2>Ringkasan Kondisi</h2><p>{overview.summary}</p></Card>
      <Card className="gis-card gis-risk-card">
        <div className="gis-card-heading"><h2>Status Kerawanan</h2><Badge className="gis-badge" style={{ backgroundColor: statusColors[overview.susceptibility.label] ?? "var(--muted)", color: "#111" }}>{overview.susceptibility.label}</Badge></div>
        <div className="gis-risk-scale" aria-label={`Status kerawanan contoh: ${overview.susceptibility.label}`}>
          {overview.susceptibility.colors.map((color) => <span key={color} style={{ backgroundColor: color }} />)}
        </div>
        <ul>{overview.susceptibility.notes.map((note) => <li key={note}>{note}</li>)}</ul>
      </Card>
      <Card className="gis-card gis-facilities-card">
        <h2>Fasilitas Terdampak</h2>
        <FacilityRows facilities={overview.facilities} />
      </Card>
      <Card className="gis-card gis-land-card"><h2>Tutupan Lahan</h2><div className="gis-tags">{overview.landCover.map((label) => <Badge key={label} className="gis-badge">{label}</Badge>)}</div></Card>
      <Card className="gis-card gis-inline-card"><h2>Elevasi (DEM)</h2><strong>{overview.elevation}</strong></Card>
      <Card className="gis-card gis-inline-card"><h2>Jaringan Sungai</h2><strong>{overview.rivers}</strong></Card>
    </div>
  );
}
