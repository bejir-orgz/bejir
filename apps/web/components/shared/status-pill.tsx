import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  "Sangat Rendah": "bg-[var(--status-very-low)] text-[#111111]",
  "Rendah": "bg-[var(--status-low)] text-[#111111]",
  "Sedang": "bg-[var(--status-medium)] text-[#111111]",
  "Tinggi": "bg-[var(--status-high)] text-[#111111]",
  "Sangat Tinggi": "bg-[var(--status-very-high)] text-[#111111]",
};

export function StatusPill({ label, className }: { label: string | null | undefined; className?: string }) {
  if (!label || !(label in statusStyles)) return <span className="text-neutral-500">—</span>;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs leading-4 font-semibold whitespace-nowrap border border-black/15",
        statusStyles[label],
        className,
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full shrink-0 bg-[#111111]/80" />
      {label}
    </span>
  );
}
