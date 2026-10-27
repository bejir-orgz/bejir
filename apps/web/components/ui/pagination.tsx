import * as React from "react"
import { cn } from "@/lib/utils"
import { IconChevronLeft, IconChevronRight, IconDots } from "@tabler/icons-react"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & React.ComponentProps<"a">

function PaginationLink({
  className,
  isActive,
  ...props
}: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        "inline-flex h-10 min-w-10 items-center justify-center p-2 rounded-[10px] text-[#2b7fff] text-[14px] font-normal leading-[1.3333333333] select-none transition-colors max-[700.01px]:min-w-8 max-[700.01px]:w-8 max-[700.01px]:h-8 max-[700.01px]:rounded-lg",
        isActive
          ? "border border-[#2b7fff] bg-transparent text-[#2b7fff]"
          : "hover:bg-[#dbeafe]/50 text-[#2b7fff]",
        className
      )}
      {...props}
    />
  )
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Halaman sebelumnya"
      className={cn("bg-[#dbeafe] text-[#2b7fff] hover:bg-[#bfdbfe] border-0", className)}
      {...props}
    >
      <IconChevronLeft className="size-6" aria-hidden="true" />
      <span className="sr-only">Halaman sebelumnya</span>
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Halaman berikutnya"
      className={cn("bg-[#dbeafe] text-[#2b7fff] hover:bg-[#bfdbfe] border-0", className)}
      {...props}
    >
      <IconChevronRight className="size-6" aria-hidden="true" />
      <span className="sr-only">Halaman berikutnya</span>
    </PaginationLink>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("grid w-8 place-items-center text-[#2b7fff]", className)}
      {...props}
    >
      <IconDots aria-hidden="true" className="size-4" />
      <span className="sr-only">Halaman lainnya</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}
