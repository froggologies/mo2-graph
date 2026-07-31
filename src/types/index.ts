export interface ModRequirement {
  modName: string
  modId: string
  externalRequirement?: boolean
  url?: string
}

export interface Mod {
  priority: number
  name: string
  status: "Unmanaged" | "Enabled" | "Disabled"
  nexusId?: string
  category?: string
  requirements?: ModRequirement[]
  version?: string
  newestVersion?: string
}
