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
    if (name.endsWith("_separator")) {
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
      const modDirHandle = entry
      let nexusId: string | undefined
      let version: string | undefined
      let newestVersion: string | undefined
      
      try {
        if (typeof (modDirHandle as any).requestPermission === "function") {
          await (modDirHandle as any).requestPermission({ mode: "read" })
        }
        const metaFileHandle = await modDirHandle.getFileHandle("meta.ini")
        const metaFile = await metaFileHandle.getFile()
        const buffer = await metaFile.arrayBuffer()
        const uint8Array = new Uint8Array(buffer)
        
        let metaText = ""
        if (uint8Array.length >= 2 && uint8Array[0] === 0xff && uint8Array[1] === 0xfe) {
          metaText = new TextDecoder("utf-16le").decode(buffer)
        } else if (uint8Array.length >= 2 && uint8Array[0] === 0xfe && uint8Array[1] === 0xff) {
          metaText = new TextDecoder("utf-16be").decode(buffer)
        } else {
          metaText = new TextDecoder("utf-8").decode(buffer)
          if (metaText.indexOf("\x00") !== -1) {
            metaText = new TextDecoder("utf-16le").decode(buffer)
          }
        }

        const modidMatch = metaText.match(/^modid=(.*)$/m)
        nexusId = modidMatch ? modidMatch[1].trim() : undefined

        const versionMatch = metaText.match(/^version=(.*)$/m)
        version = versionMatch ? versionMatch[1].trim() : undefined
        
        const newestVersionMatch = metaText.match(/^newestVersion=(.*)$/m)
        newestVersion = newestVersionMatch ? newestVersionMatch[1].trim() : undefined
      } catch (e) {
        console.warn(`No meta.ini or failed to read for ${entry.name}`, e)
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
