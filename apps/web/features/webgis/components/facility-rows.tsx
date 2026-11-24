import { IconBuildingBridge, IconBuildingHospital, IconMosque, IconSchool } from "@tabler/icons-react";
import type { FacilityMetric } from "../types";

const facilityStyles = {
  health: { icon: IconBuildingHospital, background: "#FFD2D2", color: "#FF0000" },
  education: { icon: IconSchool, background: "var(--facility-education-background, #DBEAFE)", color: "var(--primary)" },
  worship: { icon: IconMosque, background: "#D7FFD9", color: "#2BB600" },
  bridges: { icon: IconBuildingBridge, background: "#FEF3C7", color: "#B45309" },
};

/** Shared presentation for the map overview and analysis dashboard. */
export function FacilityRows({ facilities }: { facilities: FacilityMetric[] }) {
  // Four bare zeros read as a broken panel; say the period simply has no record.
  const recorded = facilities.some((facility) => (facility.count ?? 0) > 0);
  return <>
    {facilities.map((facility) => {
      const Icon = facilityStyles[facility.id].icon;
      return <div key={facility.id} className="gis-facility-row flex items-center justify-between gap-2 [&_strong]:font-semibold max-[639.01px]:text-[12px]"><div className="gis-facility-label flex items-center gap-4 max-[639.01px]:gap-2"><span className="gis-facility-icon flex items-center justify-center w-10 h-10 [flex:0_0_40px] p-2 rounded-lg" style={{ backgroundColor: facilityStyles[facility.id].background, color: facilityStyles[facility.id].color }}><Icon className="size-6 shrink-0" stroke={2} aria-hidden="true" /></span><span>{facility.label}</span></div><strong>{facility.count ?? "—"}</strong></div>;
    })}
    {!recorded && <p className="gis-facility-empty text-[12px] leading-[16px] text-neutral-500">Belum ada kerusakan fasilitas yang tercatat untuk periode ini.</p>}
  </>;
}
