import Link from "next/link";
import { IconRipple } from "@tabler/icons-react";

export function Brand() {
  return (
    <Link href="/" aria-label="Bejir — beranda" className="inline-flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
      <span className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white"><IconRipple size={25} stroke={1.8} aria-hidden="true" /></span>
      <span className="text-[26px] font-bold tracking-[-1.2px] text-neutral-950">bejir<span className="text-blue-600">.</span></span>
    </Link>
  );
}
