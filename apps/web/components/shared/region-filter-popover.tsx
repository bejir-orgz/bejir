"use client"

import { useMemo } from "react"
import { IconFilter2, IconMap } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RegionFilter } from "@/components/ui/region-filter"
import { createRegionFilterTree, westJavaFilterId, type DistrictFilterRow } from "@/features/webgis/region-tree"
import type { RegionNode } from "@/features/webgis/types"

function findName(nodes: readonly RegionNode[], id: string): string | undefined {
  for (const node of nodes) {
    if (node.id === id) return node.name
    const childName = node.children && findName(node.children, id)
    if (childName) return childName
  }
}

export function RegionFilterPopover({ regions, districtRows, value, onChange, iconOnly = false }: {
  regions: readonly string[]
  districtRows?: readonly DistrictFilterRow[]
  value: readonly string[]
  onChange: (ids: string[]) => void
  iconOnly?: boolean
}) {
  const nodes = useMemo(() => createRegionFilterTree(regions, districtRows), [regions, districtRows])
  const label = value.length === 1 ? findName(nodes, value[0]) ?? "1 daerah" : value.length ? `${value.length} daerah` : "Daerah"

  const headerLabel = value.length ? value.map((id) => findName(nodes, id)).filter(Boolean).join(", ") || "Jawa Barat" : "Jawa Barat"

  return (
    <>
      {iconOnly && <span className="min-w-0 max-w-[min(40vw,400px)] truncate text-[20px] leading-7 text-blue-500 max-[700.01px]:text-[16px]" title={headerLabel}>{headerLabel}</span>}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={iconOnly ? "ghost" : value.length ? "outline" : "filter"}
            size={iconOnly ? "icon-sm" : "default"}
            className={iconOnly ? "size-8 p-1 text-neutral-400 hover:text-neutral-400 data-[active=true]:text-blue-500 data-[active=true]:hover:text-blue-500" : "max-w-full rounded-2xl"}
            aria-label={iconOnly ? "Filter daerah di header" : "Filter daerah pada tabel"}
            data-active={value.length > 0}
          >
            {iconOnly ? <IconFilter2 className="size-6" aria-hidden="true" /> : <><IconMap className="size-6" aria-hidden="true" /><span className="min-w-0 truncate">{label}</span></>}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" collisionPadding={16} className="w-[497px] max-w-[calc(100vw_-_32px)] rounded-2xl border-0 bg-transparent p-0">
          <RegionFilter
            regions={nodes}
            value={value}
            onValueChange={onChange}
            defaultExpandedIds={[westJavaFilterId]}
            className="max-h-[min(744px,var(--radix-popover-content-available-height),calc(100dvh_-_32px))]"
          />
        </PopoverContent>
      </Popover>
    </>
  )
}
