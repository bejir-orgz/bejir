"use client"

import { useId } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const titles = {
  keparahan: "Filter Keparahan",
  klasifikasi: "Filter Klasifikasi",
  kerawanan: "Filter Kerawanan",
}

export interface CategoryFilterOption<TValue extends string> {
  value: TValue
  label: string
  disabled?: boolean
}

export interface CategoryFilterProps<TValue extends string> {
  variant?: keyof typeof titles
  options: readonly CategoryFilterOption<TValue>[]
  value: readonly TValue[]
  onValueChange: (value: TValue[]) => void
  disabled?: boolean
  className?: string
}

/** Figma 306:7985. Presentation-only multi-select; category meanings belong to the caller. */
export function CategoryFilter<TValue extends string>({
  variant = "keparahan",
  options,
  value,
  onValueChange,
  disabled = false,
  className,
}: CategoryFilterProps<TValue>) {
  const id = useId()

  return (
    <section
      role="group"
      aria-labelledby={`${id}-title`}
      className={cn("flex w-[497px] max-w-full flex-col gap-2.5 rounded-2xl border border-neutral-300 bg-white p-4 text-black", className)}
    >
      <h3 id={`${id}-title`} className="border-b border-neutral-300 pb-4 text-lg leading-7 font-semibold">
        {titles[variant]}
      </h3>
      {options.map((option, index) => (
        <Label
          key={option.value}
          htmlFor={`${id}-${index}`}
          data-disabled={disabled || option.disabled || undefined}
          className="min-h-6 w-full cursor-pointer gap-2 text-base leading-6 font-normal data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50"
        >
          <span className="grid size-6 shrink-0 place-items-center">
            <Checkbox
              id={`${id}-${index}`}
              disabled={disabled || option.disabled}
              checked={value.includes(option.value)}
              onCheckedChange={(checked) => onValueChange(checked === true
                ? value.includes(option.value) ? [...value] : [...value, option.value]
                : value.filter((item) => item !== option.value))}
              className="size-5 rounded-[2px] border-2 border-neutral-400 bg-white disabled:opacity-100 [&_svg]:size-4"
            />
          </span>
          <span className="min-w-0 flex-1">{option.label}</span>
        </Label>
      ))}
    </section>
  )
}
