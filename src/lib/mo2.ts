import type { Mod } from "@/types"

export async function loadMo2Mods(currentHandle: any, currentProfile: string): Promise<Mod[]> {
  const profilesHandle = await currentHandle.getDirectoryHandle("profiles")
  const profileHandle = await profilesHandle.getDirectoryHandle(currentProfile)

  let modlistHandle
  try {
    modlistHandle = await profileHandle.getFileHandle("modlist.txt")
  } catch {
    throw new Error("modlist.txt not found in this profile.")
  }

  const modlistFile = await modlistHandle.getFile()
  let modlistText = await modlistFile.text()
  
  // Remove BOM if present
  modlistText = modlistText.replace(/^\uFEFF/, "")

  const lines = modlistText
    .split(/\r?\n/)
    .map((l: string) => l.trim())
    .filter((l: string) => l && !l.startsWith("#"))

  const modMap = new Map<string, { priority: number; status: string; isSeparator?: boolean; originalName: string }>()
  let priority = 0

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]
    let status = "Disabled"
    let name = line.substring(1)

    if (line.startsWith("*")) {
      status = "Unmanaged"
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

    let isSeparator = false
    if (name.startsWith("Separator ")) {
      isSeparator = true
    }

    modMap.set(name.toLowerCase(), { priority: priority++, status, isSeparator, originalName: name })
  }

  const modsHandle = await currentHandle.getDirectoryHandle("mods")
  const resultMods: Mod[] = []

  const cachedData = localStorage.getItem("mo2_nexus_cache")
  const nexusCache = cachedData ? JSON.parse(cachedData) : {}

  for await (const entry of modsHandle.values()) {
    if (entry.kind === "directory") {
      const modDirHandle = await modsHandle.getDirectoryHandle(entry.name)
      let nexusId: string | undefined
      let version: string | undefined
      let newestVersion: string | undefined
      
      try {
        const metaFileHandle = await modDirHandle.getFileHandle("meta.ini")
        const metaFile = await metaFileHandle.getFile()
        const metaText = await metaFile.text()
        const modidMatch = metaText.match(/^modid=(.*)$/m)
        nexusId = modidMatch ? modidMatch[1].trim() : undefined

        const versionMatch = metaText.match(/^version=(.*)$/m)
        version = versionMatch ? versionMatch[1].trim() : undefined
        
        const newestVersionMatch = metaText.match(/^newestVersion=(.*)$/m)
        newestVersion = newestVersionMatch ? newestVersionMatch[1].trim() : undefined
      } catch (e) {
        // No meta.ini or failed to read, proceed without nexus metadata
      }

      const cacheEntry = nexusId ? nexusCache[nexusId] : undefined

      const modInfo = modMap.get(entry.name.toLowerCase())
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
          isSeparator: modInfo.isSeparator,
        })
        modMap.delete(entry.name.toLowerCase())
      } else {
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
    }
  }

  for (const [lowerName, info] of modMap.entries()) {
    if (info.status === "Unmanaged" || info.isSeparator) {
      resultMods.push({
        priority: info.priority,
        name: info.originalName,
        status: info.status as any,
        isSeparator: info.isSeparator,
      })
    }
  }

  resultMods.sort((a, b) => a.priority - b.priority)
  return resultMods
}
