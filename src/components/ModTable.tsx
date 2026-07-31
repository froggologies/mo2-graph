import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getColumns } from "./ModColumns"
import type { Mod } from "@/types"

interface ModTableProps {
  mods: Mod[]
  showAlwaysEnabled: boolean
  setShowAlwaysEnabled: (show: boolean) => void
}

export function ModTable({ mods, showAlwaysEnabled, setShowAlwaysEnabled }: ModTableProps) {
  const [sorting, setSorting] = React.useState<any>([{ id: "priority", desc: false }])
  const [columnFilters, setColumnFilters] = React.useState<any>([])
  const [columnVisibility, setColumnVisibility] = React.useState<any>({})

  const filteredMods = React.useMemo(() => {
    if (showAlwaysEnabled) return mods
    return mods.filter((m) => m.status !== "Always Enabled")
  }, [mods, showAlwaysEnabled])

  const columns = React.useMemo(() => getColumns(), [])

  const table = useReactTable({
    data: filteredMods,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 px-2 py-1 border-b shrink-0 bg-muted/30">
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-muted-foreground">Mods List</span>
          <span className="text-xs text-muted-foreground">({mods.length})</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Input
            placeholder="Filter mods by name..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
            className="max-w-[180px] h-7 text-xs"
          />
          <Button
            size="sm"
            variant={showAlwaysEnabled ? "default" : "outline"}
            onClick={() => setShowAlwaysEnabled(!showAlwaysEnabled)}
          >
            Always Enabled: {showAlwaysEnabled ? "Show" : "Hide"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                Columns <ChevronDown className="ml-2 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex-1 p-0 overflow-auto">
        <div className="border-b">
          <Table className="w-full border-collapse">
            <TableHeader className="sticky top-0 z-10 shadow-sm bg-muted">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className="h-8 border-x border-b border-border/50 px-2 py-1 text-xs font-semibold text-foreground bg-muted"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="border-x border-b border-border/50 px-2 py-1 text-xs align-top"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-sm">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
