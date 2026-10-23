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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={iconOnly ? "ghost" : "outline"}
          size={iconOnly ? "icon-sm" : "default"}
          className={iconOnly ? "size-8 p-1 text-primary data-[active=true]:bg-blue-100" : "max-w-full"}
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
  )
}
