import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowUpDown, ChevronDown, ChevronUp, Moon, Sun } from "lucide-react"
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ModGraph } from "./ModGraph"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface ModRequirement {
  modName: string
  modId: string
  externalRequirement?: boolean
  url?: string
}

interface Mod {
  priority: number
  name: string
  status: "Always Enabled" | "Enabled" | "Disabled"
  nexusId?: string
  category?: string
  requirements?: ModRequirement[]
  version?: string
  newestVersion?: string
}

const columns: ColumnDef<Mod>[] = [
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

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }
    const listener = () => setMatches(media.matches)
    media.addEventListener("change", listener)
    return () => media.removeEventListener("change", listener)
  }, [matches, query])
  return matches
}

export function MO2Viewer() {
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const [handle, setHandle] = useState<any>(null)
  const [profiles, setProfiles] = useState<string[]>([])
  const [selectedProfile, setSelectedProfile] = useState<string>("")
  const [mods, setMods] = useState<Mod[]>([])

  const [sorting, setSorting] = useState<SortingState>([
    { id: "priority", desc: false },
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [showAlwaysEnabled, setShowAlwaysEnabled] = useState(true)
  const [isHeaderOpen, setIsHeaderOpen] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [gameName, setGameName] = useState<string>("")
  const [gameId, setGameId] = useState<string>("1704")
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const theme = localStorage.getItem("theme")
    if (theme === "dark" || (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark")
      setIsDarkMode(true)
    } else {
      document.documentElement.classList.remove("dark")
      setIsDarkMode(false)
    }
  }, [])

  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle("dark")
    setIsDarkMode(isDark)
    localStorage.setItem("theme", isDark ? "dark" : "light")
  }

  const filteredMods = React.useMemo(() => {
    if (showAlwaysEnabled) return mods
    return mods.filter((m) => m.status !== "Always Enabled")
  }, [mods, showAlwaysEnabled])

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

  const pickFolder = async () => {
    try {
      const dirHandle = await (window as any).showDirectoryPicker()
      setHandle(dirHandle)

      const profilesHandle = await dirHandle.getDirectoryHandle("profiles", {
        create: false,
      })
      const profileNames = []
      for await (const entry of profilesHandle.values()) {
        if (entry.kind === "directory") {
          profileNames.push(entry.name)
        }
      }
      setProfiles(profileNames)
      if (profileNames.length > 0) {
        setSelectedProfile(profileNames[0])
        if (profileNames.length === 1) {
          loadMods(dirHandle, profileNames[0])
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const loadMods = async (targetHandle?: any, targetProfile?: string) => {
    const currentHandle = targetHandle || handle
    const currentProfile = targetProfile || selectedProfile
    if (!currentHandle || !currentProfile) return
    try {
      const profilesHandle = await currentHandle.getDirectoryHandle("profiles")
      const profileHandle =
        await profilesHandle.getDirectoryHandle(currentProfile)

      let modlistHandle
      try {
        modlistHandle = await profileHandle.getFileHandle("modlist.txt")
      } catch {
        alert("modlist.txt not found in this profile.")
        return
      }

      const modlistFile = await modlistHandle.getFile()
      const modlistText = await modlistFile.text()

      const lines = modlistText
        .split("\n")
        .map((l: string) => l.trim())
        .filter((l: string) => l && !l.startsWith("#"))

      const modMap = new Map<string, { priority: number; status: string }>()
      let priority = 0

      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i]
        let status = "Disabled"
        let name = line.substring(1)

        if (line.startsWith("*")) {
          status = "Always Enabled"
        } else if (line.startsWith("+")) {
          status = "Enabled"
        } else if (line.startsWith("-")) {
          status = "Disabled"
        } else {
          status = "Disabled"
        }

        if (
          line.startsWith("+") ||
          line.startsWith("*") ||
          line.startsWith("-")
        ) {
          name = line.substring(1)
        } else {
          name = line
        }

        modMap.set(name, { priority: priority++, status })
      }

      const modsHandle = await currentHandle.getDirectoryHandle("mods")
      const resultMods: Mod[] = []

      const cachedData = localStorage.getItem("mo2_nexus_cache")
      const nexusCache = cachedData ? JSON.parse(cachedData) : {}

      for await (const entry of modsHandle.values()) {
        if (entry.kind === "directory") {
          const modDirHandle = await modsHandle.getDirectoryHandle(entry.name)
          try {
            const metaFileHandle = await modDirHandle.getFileHandle("meta.ini")
            const metaFile = await metaFileHandle.getFile()
            const metaText = await metaFile.text()
            const modidMatch = metaText.match(/^modid=(.*)$/m)
            const nexusId = modidMatch ? modidMatch[1].trim() : undefined
            const cacheEntry = nexusId ? nexusCache[nexusId] : undefined

            const versionMatch = metaText.match(/^version=(.*)$/m)
            const version = versionMatch ? versionMatch[1].trim() : undefined
            
            const newestVersionMatch = metaText.match(/^newestVersion=(.*)$/m)
            const newestVersion = newestVersionMatch ? newestVersionMatch[1].trim() : undefined

            // Mod has meta.ini, include it
            const modInfo = modMap.get(entry.name)
            if (modInfo) {
              resultMods.push({
                priority: modInfo.priority,
                name: entry.name,
                status: modInfo.status as any,
                nexusId,
                category: cacheEntry?.category,
                requirements: cacheEntry?.requirements,
                version,
                newestVersion,
              })
              modMap.delete(entry.name)
            } else {
              // Mod in mods folder but not in modlist.txt
              resultMods.push({
                priority: -1,
                name: entry.name,
                status: "Disabled",
                nexusId,
                category: cacheEntry?.category,
                requirements: cacheEntry?.requirements,
                version,
                newestVersion,
              })
            }
          } catch {
            // No meta.ini, skip
          }
        }
      }

      // Include always enabled mods from modlist.txt that weren't in mods directory
      for (const [name, info] of modMap.entries()) {
        if (info.status === "Always Enabled") {
          resultMods.push({
            priority: info.priority,
            name: name,
            status: "Always Enabled",
          })
        }
      }

      resultMods.sort((a, b) => a.priority - b.priority)
      setMods(resultMods)
    } catch (e) {
      console.error(e)
      alert("Error loading mods. Check console for details.")
    }
  }

  const syncData = async () => {
    setIsSyncing(true)
    try {
      const updatedMods = [...mods]
      const batchSize = 10
      const cachedData = localStorage.getItem("mo2_nexus_cache")
      const nexusCache = cachedData ? JSON.parse(cachedData) : {}

      for (let i = 0; i < updatedMods.length; i += batchSize) {
        const batch = updatedMods.slice(i, i + batchSize)
        await Promise.all(
          batch.map(async (mod) => {
            if (!mod.nexusId || mod.nexusId === "0" || mod.nexusId === "-1")
              return
            try {
              const res = await fetch("https://api.nexusmods.com/v2/graphql", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  query: `query ExampleQuery($modId: ID!, $gameId: ID!) {
                  mod(modId: $modId, gameId: $gameId) {
                    modCategory { name }
                    modRequirements {
                      nexusRequirements {
                        nodes { modName modId externalRequirement url }
                      }
                    }
                  }
                }`,
                  variables: { modId: mod.nexusId, gameId: "1704" },
                }),
              })
              const json = await res.json()
              const data = json.data?.mod
              if (data) {
                mod.category = data.modCategory?.name
                mod.requirements =
                  data.modRequirements?.nexusRequirements?.nodes
                nexusCache[mod.nexusId] = {
                  category: mod.category,
                  requirements: mod.requirements,
                }
              }
            } catch (e) {
              console.error(`Failed to fetch for ${mod.name}`, e)
            }
          })
        )
        setMods([...updatedMods])
        localStorage.setItem("mo2_nexus_cache", JSON.stringify(nexusCache))
      }
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      <div className="flex w-full items-center gap-2 px-2 py-1 border-b bg-background shrink-0 z-10 relative">
        <h1 className="text-sm font-bold mr-2">MO2 Graph</h1>
        <Button size="sm" variant="outline" onClick={pickFolder}>Select MO2 Folder</Button>
            {handle && (
              <span className="text-xs text-muted-foreground">
                {handle.name}
              </span>
            )}
            {profiles.length > 0 && (
              <>
                <Select
                  value={selectedProfile}
                  onValueChange={(val) => setSelectedProfile(val ?? "")}
                >
                  <SelectTrigger className="w-[160px] h-7 text-xs">
                    <SelectValue placeholder="Select Profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => (
                      <SelectItem key={p} value={p} className="text-xs">
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={loadMods} variant="secondary">
                  Load
                </Button>
                {mods.length > 0 && (
                  <Button size="sm" onClick={syncData} disabled={isSyncing}>
                    {isSyncing ? "Syncing..." : "Sync Nexus"}
                  </Button>
                )}
              </>
            )}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleDarkMode}>
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {mods.length > 0 ? (
        <ResizablePanelGroup orientation={isDesktop ? "horizontal" : "vertical"} className="flex-1 overflow-hidden min-h-0">
          <ResizablePanel defaultSize={65} minSize={20}>
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex items-center gap-2 px-2 py-1 border-b shrink-0 bg-muted/30">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-muted-foreground">Mods List</span>
                  <span className="text-xs text-muted-foreground">({mods.length})</span>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <Input
                    placeholder="Filter mods by name..."
                    value={
                      (table.getColumn("name")?.getFilterValue() as string) ?? ""
                    }
                    onChange={(event) =>
                      table.getColumn("name")?.setFilterValue(event.target.value)
                    }
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
                    <DropdownMenuTrigger
                      render={<Button size="sm" variant="outline" />}
                    >
                      Columns <ChevronDown className="ml-2 h-3 w-3" />
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
                              onCheckedChange={(value) =>
                                column.toggleVisibility(!!value)
                              }
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
                                  : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
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
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={columns.length}
                            className="h-24 text-center text-sm"
                          >
                            No results.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={35} minSize={20} collapsible={true}>
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex items-center px-2 py-1 border-b shrink-0 bg-muted/30">
                <span className="text-xs font-semibold text-muted-foreground">Dependency Graph</span>
              </div>
              <div className="flex-1 relative">
                <ModGraph mods={mods} isDarkMode={isDarkMode} />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          Select a MO2 folder and load a profile to begin.
        </div>
      )}
    </div>
  )
}
