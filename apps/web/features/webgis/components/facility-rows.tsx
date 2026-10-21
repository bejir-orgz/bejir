import { IconBuilding, IconBuildingHospital, IconMosque, IconSchool } from "@tabler/icons-react";
import type { FacilityMetric } from "../types";

const facilityStyles = {
  health: { icon: IconBuildingHospital, background: "#FFD2D2", color: "#FF0000" },
  education: { icon: IconSchool, background: "var(--facility-education-background, #DBEAFE)", color: "var(--primary)" },
  public: { icon: IconBuilding, background: "#FFE4CD", color: "#FF6A00" },
  worship: { icon: IconMosque, background: "#D7FFD9", color: "#2BB600" },
};

/** Shared presentation for the map overview and analysis dashboard. */
export function FacilityRows({ facilities }: { facilities: FacilityMetric[] }) {
  return facilities.map((facility) => {
    const Icon = facilityStyles[facility.id].icon;
    return <div key={facility.id} className="gis-facility-row"><div className="gis-facility-label"><span className="gis-facility-icon" style={{ backgroundColor: facilityStyles[facility.id].background, color: facilityStyles[facility.id].color }}><Icon className="size-6 shrink-0" stroke={2} aria-hidden="true" /></span><span>{facility.label}</span></div><strong>{facility.count}</strong></div>;
  });
}
