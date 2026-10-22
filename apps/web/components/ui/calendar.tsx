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

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
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
      numberOfMonths={numberOfMonths ?? (props.mode === "range" ? 2 : 1)}
      locale={locale}
      weekStartsOn={weekStartsOn}
      className={cn(
        "group/calendar rounded-lg bg-white p-4 text-black [--cell-size:48px] max-[767.99px]:[--cell-size:clamp(32px,calc((100vw_-_92px)/7),48px)] [[data-slot=card-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        formatWeekdayName: (date) => ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][date.getDay()],
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          defaultClassNames.months
        ),
        month: cn("flex w-[calc(var(--cell-size)*7_+_6px)] flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-8 rounded-lg border border-primary bg-blue-100 p-2 text-primary hover:bg-blue-200 hover:text-primary dark:bg-blue-100 dark:hover:bg-blue-200 aria-disabled:opacity-50",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-8 rounded-lg border border-primary bg-blue-100 p-2 text-primary hover:bg-blue-200 hover:text-primary dark:bg-blue-100 dark:hover:bg-blue-200 aria-disabled:opacity-50",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-8 w-full items-center justify-center px-8",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-8 w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative rounded-md border border-input has-focus:border-ring has-focus:ring-[3px] has-focus:ring-ring/50",
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
            : "flex h-8 items-center gap-1 rounded-md pr-1 pl-2 text-sm [&>svg]:size-3.5 [&>svg]:text-muted-foreground",
          defaultClassNames.caption_label
        ),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex gap-px", defaultClassNames.weekdays),
        weekday: cn(
          "flex h-8 flex-1 items-center justify-center text-xs leading-4 font-normal text-neutral-500 select-none",
          defaultClassNames.weekday
        ),
        week: cn("mt-px flex w-full gap-px", defaultClassNames.week),
        week_number_header: cn(
          "w-(--cell-size) select-none",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-[0.8rem] text-muted-foreground select-none",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative size-(--cell-size) p-0 text-center select-none [&:last-child[data-selected=true]_button]:rounded-r-lg",
          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-md"
            : "[&:first-child[data-selected=true]_button]:rounded-l-md",
          defaultClassNames.day
        ),
        range_start: cn(
          "rounded-l-lg bg-blue-100",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none bg-blue-100", defaultClassNames.range_middle),
        range_end: cn("rounded-r-lg bg-blue-100", defaultClassNames.range_end),
        today: cn(
          "font-medium",
          defaultClassNames.today
        ),
        outside: cn(
          "text-black opacity-50",
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
      data-day={day.date.toLocaleDateString()}
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
        "flex size-(--cell-size) min-w-(--cell-size) flex-col gap-1 rounded-lg p-0 text-sm leading-5 font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50 data-[range-end=true]:rounded-lg data-[range-end=true]:rounded-r-lg data-[range-end=true]:bg-primary! data-[range-end=true]:text-primary-foreground! data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-blue-100! data-[range-middle=true]:text-black! data-[range-start=true]:rounded-lg data-[range-start=true]:rounded-l-lg data-[range-start=true]:bg-primary! data-[range-start=true]:text-primary-foreground! data-[selected-single=true]:bg-primary! data-[selected-single=true]:text-primary-foreground! dark:hover:text-black [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
