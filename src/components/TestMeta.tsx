export function TestMeta() {
  const testFolder = async () => {
    try {
      console.log("Requesting directory picker...")
      const dirHandle = await (window as any).showDirectoryPicker()
      console.log(`Picked directory: ${dirHandle.name}`)

      console.log("Iterating entries...")
      const entries = []
      for await (const entry of dirHandle.values()) {
        entries.push(entry)
      }
      console.log(`Found ${entries.length} entries.`)

      for (const entry of entries) {
        if (entry.kind === "directory") {
          console.log(`\nChecking directory: ${entry.name}`)
          try {
            const fileHandle = await entry.getFileHandle("meta.txt")
            console.log(`Successfully got handle for meta.txt in ${entry.name}`)

            const file = await fileHandle.getFile()
            console.log(`File size: ${file.size} bytes`)

            const text = await file.text()
            console.log(`File starts with: ${text.substring(0, 50)}...`)
            break // Stop after first successful directory to avoid spam
          } catch (e: any) {
            console.error(
              `Failed to get meta.ini in ${entry.name}: ${e.name} - ${e.message}`
            )
          }
        }
      }
    } catch (e: any) {
      console.error(`Top level error: ${e.name} - ${e.message}`)
    }
  }

  return (
    <div className="flex h-screen flex-col gap-4 p-8 font-mono text-sm">
      <h1 className="text-xl font-bold">Test meta.ini Access</h1>
      <p>
        Select your MO2 `mods` folder directly to test. Check browser console
        for output.
      </p>
      <button
        onClick={testFolder}
        className="rounded bg-primary px-4 py-2 text-primary-foreground"
      >
        Select Mods Folder
      </button>
    </div>
  )
}
