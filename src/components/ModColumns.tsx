import * as React from "react"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Check, X } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import type { Mod, ModRequirement } from "@/types"

export const getColumns = (): ColumnDef<Mod>[] => [
  {
    accessorKey: "priority",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Priority
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const p = row.getValue("priority") as number
      return <div className="font-medium text-center">{p >= 0 ? p : "-"}</div>
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const name = row.getValue("name") as string
      const nexusId = row.original.nexusId
      if (nexusId && nexusId !== "0" && nexusId !== "-1") {
        return (
          <a
            href={`https://www.nexusmods.com/skyrimspecialedition/mods/${nexusId}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-500 dark:text-blue-400 hover:underline"
          >
            {name}
          </a>
        )
      }
      return <span>{name}</span>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      if (status === "Enabled") {
        return <Check className="h-4 w-4 text-green-500" />
      }
      if (status === "Unmanaged") {
        return <Check className="h-4 w-4 text-muted-foreground" />
      }
      return <X className="h-4 w-4 text-red-500" />
    },
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "requirements",
    header: "Requirements",
    cell: ({ row, table }) => {
      const reqs = row.getValue("requirements") as ModRequirement[] | undefined
      if (!reqs || reqs.length === 0) return null

      const allMods = table.options.data as Mod[]

      return (
        <div className="flex max-w-[300px] flex-col gap-1">
          {reqs.map((r) => {
            const exists = allMods.some((m) => m.nexusId === r.modId)
            const isExternal = r.externalRequirement
            const href =
              r.url ||
              `https://www.nexusmods.com/skyrimspecialedition/mods/${r.modId}`

            let colorClass = exists
              ? "text-blue-500 dark:text-blue-400"
              : "text-red-500 dark:text-red-400"
            if (isExternal) {
              colorClass = "text-orange-500 dark:text-orange-400"
            }

            return (
              <a
                key={r.modId || r.modName}
                href={href}
                target="_blank"
                rel="noreferrer"
                className={`truncate text-xs hover:underline ${colorClass}`}
                title={r.modName}
              >
                {r.modName}
              </a>
            )
          })}
        </div>
      )
    },
  },
  {
    accessorKey: "version",
    header: "Version",
    cell: ({ row }) => {
      const version = row.getValue("version") as string | undefined
      const newestVersion = row.original.newestVersion
      
      if (!version) return null
      
      const isOutdated = newestVersion && version !== newestVersion
      
      return (
        <span 
          className={isOutdated ? 'font-medium text-red-500 dark:text-red-400' : ''}
          title={isOutdated ? `Latest: ${newestVersion}` : undefined}
        >
          {version}
        </span>
      )
    }
  },
]
