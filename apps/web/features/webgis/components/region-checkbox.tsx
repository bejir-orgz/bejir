import { Checkbox } from "@/components/ui/checkbox";

export function RegionCheckbox({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: () => void;
}) {
  return <Checkbox aria-label={label} checked={checked} onCheckedChange={onChange} className="gis-checkbox" />;
}
