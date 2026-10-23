import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

// All button variants share one type scale and the same three size steps.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 text-xs! leading-4! font-semibold! whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-25! aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-blue-600",
        outline: "border border-primary bg-transparent text-primary hover:bg-blue-50 hover:text-primary",
        destructive: "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 rounded-lg px-2 py-2 [&_svg:not([class*='size-'])]:size-4",
        default: "h-10 rounded-[10px] px-2 py-2 [&_svg:not([class*='size-'])]:size-6",
        lg: "h-12 rounded-xl px-2 py-3 [&_svg:not([class*='size-'])]:size-6",
        "icon-sm": "size-8 rounded-lg p-0 [&_svg:not([class*='size-'])]:size-4",
        icon: "size-10 rounded-[10px] p-0 [&_svg:not([class*='size-'])]:size-6",
        "icon-lg": "size-12 rounded-xl p-0 [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }

function Button({ className, variant = "default", size = "default", asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }
