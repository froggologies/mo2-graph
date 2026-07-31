import { useState, useCallback } from "react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ModGraph } from "./ModGraph"
import { ViewerToolbar } from "./ViewerToolbar"
import { ModTable } from "./ModTable"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useTheme } from "@/hooks/use-theme"
import { loadMo2Mods } from "@/lib/mo2"
import { syncNexusModsData } from "@/lib/nexus"
import type { Mod } from "@/types"

export function MO2Viewer() {
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const { isDarkMode } = useTheme()
  const [handle, setHandle] = useState<any>(null)
  const [profiles, setProfiles] = useState<string[]>([])
  const [selectedProfile, setSelectedProfile] = useState<string>("")
  const [mods, setMods] = useState<Mod[]>([])
  const [showUnmanaged, setShowUnmanaged] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [metaIniBlocked, setMetaIniBlocked] = useState(false)

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
        const targetProfile = profileNames.includes("Default")
          ? "Default"
          : profileNames[0]
        setSelectedProfile(targetProfile)
        handleLoadMods(dirHandle, targetProfile)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleLoadMods = useCallback(
    async (targetHandle?: any, targetProfile?: string) => {
      const currentHandle = targetHandle || handle
      const currentProfile = targetProfile || selectedProfile
      if (!currentHandle || !currentProfile) return
      try {
        const { mods: resultMods, metaIniBlocked: blocked } = await loadMo2Mods(
          currentHandle,
          currentProfile
        )
        setMods(resultMods)
        setMetaIniBlocked(blocked)
      } catch (e) {
        console.error(e)
        alert("Error loading mods. Check console for details.")
      }
    },
    [handle, selectedProfile]
  )

  const handleSyncNexus = async () => {
    setIsSyncing(true)
    try {
      const updatedMods = await syncNexusModsData(mods)
      setMods([...updatedMods])
    } catch (e) {
      console.error("Sync Nexus error:", e)
      alert(
        `Failed to sync with Nexus: ${e instanceof Error ? e.message : String(e)}. Check console.`
      )
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      <ViewerToolbar
        handle={handle}
        profiles={profiles}
        selectedProfile={selectedProfile}
        onSelectProfile={setSelectedProfile}
        onPickFolder={pickFolder}
        onLoadMods={() => handleLoadMods()}
        onSyncNexus={handleSyncNexus}
        isSyncing={isSyncing}
        showUnmanaged={showUnmanaged}
        onToggleUnmanaged={setShowUnmanaged}
        isDarkMode={isDarkMode}
        metaIniBlocked={metaIniBlocked}
        hasMods={mods.length > 0}
      />

      {mods.length > 0 ? (
        <ResizablePanelGroup
          orientation={isDesktop ? "horizontal" : "vertical"}
          className="min-h-0 flex-1 overflow-hidden"
        >
          <ResizablePanel defaultSize={65} minSize={20}>
            <ModTable
              mods={mods}
              showUnmanaged={showUnmanaged}
              setShowUnmanaged={setShowUnmanaged}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={35} minSize={20} collapsible={true}>
            <div className="flex h-full flex-col overflow-hidden">
              <div className="flex shrink-0 items-center border-b bg-muted/30 px-2 py-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  Dependency Graph
                </span>
              </div>
              <div className="relative flex-1">
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
