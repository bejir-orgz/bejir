"use client"

import type * as React from "react"
import { CalendarBase } from "./calendar-base"

/** Figma 364:1706; supports shadcn single-date and range selection props. */
export function CalendarFilter({ captionLayout = "dropdown", numberOfMonths = 1, ...props }: React.ComponentProps<typeof CalendarBase>) {
  return <CalendarBase {...props} captionLayout={captionLayout} numberOfMonths={numberOfMonths} />
}
