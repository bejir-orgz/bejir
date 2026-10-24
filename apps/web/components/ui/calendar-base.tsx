"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { IconChevronDown, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
} from "react-day-picker"
import { id } from "date-fns/locale"

import { Button, buttonVariants } from "@/components/ui/button"
import { CalendarDropdown } from "@/components/ui/calendar-selector"

function CalendarBase({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "outline",
  formatters,
  components,
  numberOfMonths,
  locale = id,
  weekStartsOn = 0,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      numberOfMonths={numberOfMonths}
      locale={locale}
      weekStartsOn={weekStartsOn}
      className={cn(
        "group/calendar rounded-2xl border border-neutral-300 bg-white p-3 text-black [--cell-size:32px] [&_button[data-day]]:text-sm! [&_button[data-day]]:leading-5! [&_button[data-day]]:font-normal!",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("id-ID", { month: "short" }),
        formatWeekdayName: (date) => ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][date.getDay()],
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          defaultClassNames.months
        ),
        month: cn("flex w-[calc(var(--cell-size)*7_+_24px)] flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "pointer-events-none absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1 [&_button]:pointer-events-auto",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-8 rounded-lg border border-primary bg-blue-100 p-0 text-primary hover:bg-blue-200 hover:text-primary select-none aria-disabled:opacity-25",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-8 rounded-lg border border-primary bg-blue-100 p-0 text-primary hover:bg-blue-200 hover:text-primary select-none aria-disabled:opacity-25",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-8 w-full items-center justify-center px-10",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-8 w-full items-center justify-center gap-2 text-sm font-normal",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative h-8 rounded-lg border border-neutral-300 bg-white has-focus:border-ring has-focus:ring-[3px] has-focus:ring-ring/50",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute inset-0 bg-popover opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "font-medium select-none",
          captionLayout === "label"
            ? "text-sm"
            : "flex h-full items-center gap-1.5 rounded-lg px-2 text-sm font-normal [&>svg]:size-4 [&>svg]:text-neutral-500",
          defaultClassNames.caption_label
        ),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 rounded-md text-center text-[0.8rem] font-normal text-neutral-500 select-none",
          defaultClassNames.weekday
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        week_number_header: cn(
          "w-(--cell-size) select-none",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-[0.8rem] text-muted-foreground select-none",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative h-(--cell-size) min-w-(--cell-size) flex-1 p-0 text-center select-none [&:has(button[data-range-start=true][data-range-end=true])]:before:hidden",
          defaultClassNames.day
        ),
        range_start: "before:pointer-events-none before:absolute before:inset-y-0 before:right-0 before:w-1/2 before:bg-blue-100",
        range_middle: "bg-blue-100 first:rounded-l-lg last:rounded-r-lg",
        range_end: "before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-1/2 before:bg-blue-100",
        today: cn(
          "font-normal",
          defaultClassNames.today
        ),
        outside: cn(
          "text-black opacity-50 data-[selected=true]:opacity-100",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Dropdown: CalendarDropdown,
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <IconChevronLeft aria-hidden="true" className={cn("size-4", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <IconChevronRight aria-hidden="true"
                className={cn("size-4", className)}
                {...props}
              />
            )
          }

          return (
            <IconChevronDown aria-hidden="true" className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={`${day.date.getFullYear()}-${String(day.date.getMonth() + 1).padStart(2, "0")}-${String(day.date.getDate()).padStart(2, "0")}`}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "relative z-1 mx-auto flex size-(--cell-size) min-w-(--cell-size) flex-col gap-1 rounded-sm p-0 leading-5 font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50 data-[range-end=true]:rounded-lg data-[range-end=true]:rounded-r-lg data-[range-end=true]:bg-primary! data-[range-end=true]:text-primary-foreground! data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-transparent! data-[range-middle=true]:text-black! data-[range-start=true]:rounded-lg data-[range-start=true]:rounded-l-lg data-[range-start=true]:bg-primary! data-[range-start=true]:text-primary-foreground! data-[selected-single=true]:bg-primary! data-[selected-single=true]:text-primary-foreground! dark:hover:text-accent-foreground [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { CalendarBase }
