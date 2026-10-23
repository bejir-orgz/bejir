import type { ComponentProps } from "react";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

/** Native scrolling, including descendants; asChild preserves the existing element and refs. */
export function Scrollbar({ asChild = false, className, ...props }: ComponentProps<"div"> & { asChild?: boolean }) {
  const Component = asChild ? Slot.Root : "div";
  return <Component className={cn(
    "[&::-webkit-scrollbar,&_*::-webkit-scrollbar]:w-[var(--sb-size,5px)] [&::-webkit-scrollbar,&_*::-webkit-scrollbar]:h-[var(--sb-size,5px)]",
    "[&::-webkit-scrollbar-track,&_*::-webkit-scrollbar-track]:m-0 [&::-webkit-scrollbar-track,&_*::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track,&_*::-webkit-scrollbar-track]:bg-transparent",
    "[&::-webkit-scrollbar-thumb,&_*::-webkit-scrollbar-thumb]:min-h-8 [&::-webkit-scrollbar-thumb,&_*::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb,&_*::-webkit-scrollbar-thumb]:bg-[var(--sb-thumb-color,#8ec5ff)]",
    "[&::-webkit-scrollbar-thumb:hover,&_*::-webkit-scrollbar-thumb:hover]:bg-[#2b7fff] [&::-webkit-scrollbar-thumb:active,&_*::-webkit-scrollbar-thumb:active]:bg-[#155dfc]",
    "[&::-webkit-scrollbar-corner,&_*::-webkit-scrollbar-corner]:bg-transparent [&::-webkit-scrollbar-button,&_*::-webkit-scrollbar-button]:hidden [&::-webkit-scrollbar-button,&_*::-webkit-scrollbar-button]:size-0",
    "[@supports_not_selector(::-webkit-scrollbar)]:[&,&_*]:[scrollbar-width:thin] [@supports_not_selector(::-webkit-scrollbar)]:[&,&_*]:[scrollbar-color:var(--sb-thumb-color,#8ec5ff)_transparent]",
    className,
  )} {...props} />;
}
