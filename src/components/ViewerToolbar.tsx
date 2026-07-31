import * as React from "react"
import { Button } from "@/components/ui/button"
import { Moon, Sun, AlertTriangle } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ViewerToolbarProps {
  handle: any
  profiles: string[]
  selectedProfile: string
  onSelectProfile: (p: string) => void
  onPickFolder: () => void
  onLoadMods: () => void
  onSyncNexus: () => void
  isSyncing: boolean
  showUnmanaged: boolean
  onToggleUnmanaged: (v: boolean) => void
  isDarkMode: boolean
  metaIniBlocked?: boolean
  hasMods?: boolean
}

export function ViewerToolbar({
  handle,
  profiles,
  selectedProfile,
  onSelectProfile,
  onPickFolder,
  onLoadMods,
  onSyncNexus,
  isSyncing,
  showUnmanaged,
  onToggleUnmanaged,
  isDarkMode,
  metaIniBlocked,
  hasMods,
}: ViewerToolbarProps) {
  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.contains("dark")
    if (isDark) {
      document.documentElement.classList.remove("dark")
      localStorage.theme = "light"
    } else {
      document.documentElement.classList.add("dark")
      localStorage.theme = "dark"
    }
  }

  const mo2FolderName = handle?.name || "MO2"
  const psScript = `$mo2Dir = "C:\\Path\\To\\${mo2FolderName}"
$modsDir = Join-Path $mo2Dir "mods"
$cacheDir = Join-Path $mo2Dir "meta_cache"

New-Item -ItemType Directory -Force -Path $cacheDir | Out-Null

Get-ChildItem -Path $modsDir -Directory | ForEach-Object {
    $metaIni = Join-Path $_.FullName "meta.ini"
    if (Test-Path $metaIni) {
        $targetDir = Join-Path $cacheDir $_.Name
        New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
        Copy-Item -Path $metaIni -Destination (Join-Path $targetDir "meta.txt") -Force
    }
}
Write-Host "meta.txt cache created successfully!"`

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(psScript)
      alert("Script copied to clipboard!")
    } catch (err) {
      console.error("Failed to copy", err)
    }
  }

  return (
    <div className="flex w-full items-center gap-2 px-2 py-1 border-b bg-background shrink-0 z-10 relative">
      <h1 className="text-sm font-bold mr-2">MO2 Graph</h1>
      <Button size="sm" variant="outline" onClick={onPickFolder}>
        Select MO2 Folder
      </Button>
      {handle && (
        <span className="text-xs text-muted-foreground truncate max-w-[200px]">{handle.name}</span>
      )}
      {profiles.length > 0 && (
        <>
          <Select
            value={selectedProfile}
            onValueChange={(val) => onSelectProfile(val ?? "")}
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

          {metaIniBlocked && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="destructive" className="ml-2 gap-1 flex items-center">
                  <AlertTriangle className="w-4 h-4" />
                  Windows Sync Blocked
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Windows File Access Blocked</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm mt-4 break-words">
                  <p>
                    Your browser's security settings explicitly block reading <code className="bg-muted px-1 py-0.5 rounded">.ini</code> files on Windows. We cannot read the Nexus IDs from your mods automatically.
                  </p>
                  <p>
                    To fix this, we can create a temporary cache folder named <code className="bg-muted px-1 py-0.5 rounded">meta_cache</code> inside your MO2 folder. The app will automatically look for <code className="bg-muted px-1 py-0.5 rounded">meta.txt</code> files there.
                  </p>
                  <p className="font-semibold">Instructions:</p>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Copy the PowerShell script below.</li>
                    <li>Change <code className="bg-muted px-1 py-0.5 rounded">"C:\Path\To\{mo2FolderName}"</code> to your actual MO2 installation path.</li>
                    <li>Open PowerShell and run the script.</li>
                    <li>Come back here and click <strong>Load</strong> again.</li>
                  </ol>
                  
                  <div className="relative group">
                    <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto whitespace-pre-wrap break-all">
                      {psScript}
                    </pre>
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={copyScript}
                    >
                      Copy Script
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
