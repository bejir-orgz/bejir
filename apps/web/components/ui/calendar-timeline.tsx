"use client"

import type * as React from "react"
import { CalendarBase } from "./calendar-base"

/** Timeline uses the shared shadcn calendar geometry and connected range styling. */
export function CalendarTimeline({ captionLayout = "label", numberOfMonths = 1, ...props }: React.ComponentProps<typeof CalendarBase>) {
  return <CalendarBase {...props} captionLayout={captionLayout} numberOfMonths={numberOfMonths} />
}
