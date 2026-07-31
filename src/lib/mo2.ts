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

  for (const [name, info] of modMap.entries()) {
    if (info.status === "Unmanaged") {
      resultMods.push({
        priority: info.priority,
        name: name,
        status: "Unmanaged",
      })
    }
  }

  resultMods.sort((a, b) => a.priority - b.priority)
  return resultMods
}
