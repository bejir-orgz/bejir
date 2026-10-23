"use client"

import { useId, useState } from "react"
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { toggleSelection } from "@/features/webgis/region-tree"
import type { RegionNode } from "@/features/webgis/types"

export interface RegionFilterProps {
  regions: readonly RegionNode[]
  value: readonly string[]
  onValueChange: (ids: string[]) => void
  defaultExpandedIds?: readonly string[]
  disabled?: boolean
  className?: string
}

interface RegionRowsProps extends Pick<RegionFilterProps, "regions" | "value" | "onValueChange" | "disabled"> {
  prefix: string
  depth: number
  expandedIds: readonly string[]
  onExpand: (id: string) => void
}

function RegionRows({ regions, value, onValueChange, disabled, prefix, depth, expandedIds, onExpand }: RegionRowsProps) {
  return (
    <ul className={cn("m-0 list-none p-0", depth < 2 ? "space-y-4" : "space-y-2")}>
      {regions.map((region) => {
        const children = region.children ?? []
        const branch = region.children !== undefined
        const expanded = expandedIds.includes(region.id)
        const nodeId = `${prefix}-${encodeURIComponent(region.id)}`
        const checked = value.includes(region.id)

        return (
          <li key={region.id}>
            <div className="flex min-h-6 items-center gap-2">
              {branch && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={disabled}
                  className="size-6 rounded-none p-0 text-black hover:bg-transparent hover:text-black dark:hover:bg-transparent"
                  aria-label={`${expanded ? "Tutup" : "Buka"} ${region.name}`}
                  aria-expanded={expanded}
                  aria-controls={`${nodeId}-children`}
                  onClick={() => onExpand(region.id)}
                >
                  {expanded ? <IconChevronDown className="size-6" aria-hidden="true" /> : <IconChevronRight className="size-6" aria-hidden="true" />}
                </Button>
              )}
              <Label
                htmlFor={`${nodeId}-checkbox`}
                data-disabled={disabled || undefined}
                className="min-h-6 min-w-0 flex-1 cursor-pointer gap-2 text-base leading-6 font-normal data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50"
              >
                <span className="grid size-6 shrink-0 place-items-center">
                  <Checkbox
                    id={`${nodeId}-checkbox`}
                    disabled={disabled}
                    checked={checked}
                    onCheckedChange={(next) => {
                      if ((next === true) !== checked) onValueChange(toggleSelection([...value], region.id))
                    }}
                    className="size-5 rounded-[2px] border-2 border-neutral-400 bg-white disabled:opacity-100 [&_svg]:size-4"
                  />
                </span>
                <span className="min-w-0 flex-1">{region.name}</span>
              </Label>
            </div>
            {branch && (
              <div id={`${nodeId}-children`} hidden={!expanded} className="mt-4 border-t border-neutral-300 pt-4">
                {expanded && (children.length ? <RegionRows regions={children} value={value} onValueChange={onValueChange} disabled={disabled} prefix={prefix} depth={depth + 1} expandedIds={expandedIds} onExpand={onExpand} /> : <p className="text-sm text-neutral-500" role="status">Daerah turunan belum tersedia.</p>)}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** Figma 306:8767. Selection records explicit node IDs; expanding never changes selection. */
export function RegionFilter({ regions, value, onValueChange, defaultExpandedIds = [], disabled = false, className }: RegionFilterProps) {
  const id = useId()
  const [expandedIds, setExpandedIds] = useState<string[]>(() => [...defaultExpandedIds])

  return (
    <section role="group" aria-labelledby={`${id}-title`} className={cn("flex max-h-[min(744px,calc(100dvh_-_32px))] w-full min-w-0 max-w-[497px] flex-col gap-2.5 overflow-hidden rounded-2xl border border-neutral-300 bg-white p-4 text-black", className)}>
      <h3 id={`${id}-title`} className="shrink-0 border-b border-neutral-300 pb-4 text-lg leading-7 font-semibold">Filter Daerah</h3>
      <div className="min-h-0 overflow-y-auto overscroll-contain [--sb-size:4px]">
        <RegionRows regions={regions} value={value} onValueChange={onValueChange} disabled={disabled} prefix={id} depth={0} expandedIds={expandedIds} onExpand={(nodeId) => setExpandedIds((current) => toggleSelection(current, nodeId))} />
        {regions.length === 0 && <p className="text-sm text-neutral-500" role="status">Daerah belum tersedia.</p>}
      </div>
    </section>
  )
}
