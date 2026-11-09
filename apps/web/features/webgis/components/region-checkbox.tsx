import { Checkbox } from "@/components/ui/checkbox";

export function RegionCheckbox({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: () => void;
}) {
  return <Checkbox aria-label={label} checked={checked} onCheckedChange={onChange} className="gis-checkbox w-[18px] h-[18px] m-[3px] [flex:0_0_18px] rounded-[2px] border-[#a1a1a1] shadow-none bg-[#fff] [&[data-state=checked]]:bg-[var(--gis-blue)] [&[data-state=checked]]:border-[var(--gis-blue)] [&[data-state=checked]]:text-[white] dark:bg-white" />;
}
