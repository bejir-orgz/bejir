"use client";

import type { ComponentProps } from "react";
import { IconBrandGithubCopilot } from "@tabler/icons-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/** Overview/AI switch. Render within shadcn Tabs with matching content values. */
export function OverviewButton({ className, ...props }: ComponentProps<typeof TabsList>) {
  const triggerClassName = "h-8 flex-1 gap-2 rounded-lg border-0 bg-transparent p-2 text-xs leading-4 font-semibold text-neutral-500 hover:text-neutral-700 data-[state=active]:bg-blue-500 data-[state=active]:text-white dark:data-[state=active]:bg-blue-500 dark:data-[state=active]:text-white";
  return (
    <TabsList
      aria-label="Panel informasi"
      {...props}
      className={cn("w-full gap-2 rounded-2xl border border-blue-500 bg-blue-100 p-2 h-[50px]!", className)}
    >
      <TabsTrigger value="overview" className={triggerClassName}>Overview</TabsTrigger>
      <TabsTrigger value="ai" className={triggerClassName}>
        <IconBrandGithubCopilot className="size-4" aria-hidden="true" />
        AI
      </TabsTrigger>
    </TabsList>
  );
}
