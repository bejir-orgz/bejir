"use client"

import type * as React from "react"
import { CalendarBase } from "./calendar-base"

/** Figma 306:8828; supports shadcn single-date and range selection props. */
export function CalendarTimeline({ captionLayout = "label", numberOfMonths = 1, ...props }: React.ComponentProps<typeof CalendarBase>) {
  return <CalendarBase {...props} captionLayout={captionLayout} numberOfMonths={numberOfMonths} />
}
