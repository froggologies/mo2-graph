import type { Mod } from "@/types"

export async function syncNexusModsData(mods: Mod[]): Promise<Mod[]> {
  const updatedMods = [...mods]
  const batchSize = 10
  const cachedData = localStorage.getItem("mo2_nexus_cache")
  const nexusCache = cachedData ? JSON.parse(cachedData) : {}

  const validMods = updatedMods.filter(m => m.nexusId && m.nexusId !== "0" && m.nexusId !== "-1")
  console.log(`Syncing Nexus data for ${validMods.length} out of ${updatedMods.length} mods`)
  if (validMods.length === 0) {
    alert("No mods with valid Nexus IDs found. Check if meta.ini is being read properly.")
    return updatedMods
  }

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
          console.error(`Failed to fetch for ${mod.name} (Nexus ID: ${mod.nexusId}):`, e)
        }
      })
    )
    localStorage.setItem("mo2_nexus_cache", JSON.stringify(nexusCache))
  }
  return updatedMods
}
