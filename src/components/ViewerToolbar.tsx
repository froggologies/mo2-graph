import * as React from "react"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTheme } from "@/hooks/use-theme"

interface ViewerToolbarProps {
  handle: any
  profiles: string[]
  selectedProfile: string
  setSelectedProfile: (p: string) => void
  onPickFolder: () => void
  onLoadMods: () => void
  onSyncNexus: () => void
  isSyncing: boolean
  hasMods: boolean
}

export function ViewerToolbar({
  handle,
  profiles,
  selectedProfile,
  setSelectedProfile,
  onPickFolder,
  onLoadMods,
  onSyncNexus,
  isSyncing,
  hasMods,
}: ViewerToolbarProps) {
  const { isDarkMode, toggleDarkMode } = useTheme()

  return (
    <div className="flex w-full items-center gap-2 px-2 py-1 border-b bg-background shrink-0 z-10 relative">
      <h1 className="text-sm font-bold mr-2">MO2 Graph</h1>
      <Button size="sm" variant="outline" onClick={onPickFolder}>
        Select MO2 Folder
      </Button>
      {handle && (
        <span className="text-xs text-muted-foreground">{handle.name}</span>
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
          <Button size="sm" onClick={onLoadMods} variant="secondary">
            Load
          </Button>
          {hasMods && (
            <Button size="sm" onClick={onSyncNexus} disabled={isSyncing}>
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
  )
}
