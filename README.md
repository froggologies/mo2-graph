# MO2 Graph

A browser-based tool for visualizing [Mod Organizer 2](https://www.modorganizer.org/) mod lists and their dependency graphs. Point it at your MO2 installation folder, pick a profile, and instantly see how your mods relate to each other.

## Features

- **Mod List Table** — sortable, filterable table showing priority, name, status, category, version, and requirements for every mod in the selected profile.
- **Dependency Graph** — interactive node graph (powered by React Flow + dagre) that visualizes mod-to-mod dependency relationships.
  - Disabled mods are shown in gray; missing dependencies are highlighted in red.
  - Node widths dynamically fit their label text.
- **Nexus Mods Sync** — fetches mod metadata (category, version, latest version) from the Nexus Mods API and caches it in `localStorage`.
  - Outdated versions are flagged in red in the table.
- **Resizable Panes** — drag the handle between the table and graph to adjust their sizes.
- **Responsive Layout** — horizontal (side-by-side) on `lg`+ screens; vertical (stacked) on smaller viewports.
- **Dark Mode** — toggle between light and dark themes, persisted across sessions.
- **Fully Client-Side** — all file reading uses the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API); no server or backend required.

## Tech Stack

| Layer         | Technology                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------ |
| Framework     | [Astro](https://astro.build/) 7 + [React](https://react.dev/) 19                                 |
| Styling       | [Tailwind CSS](https://tailwindcss.com/) 4                                                       |
| UI Components | [shadcn/ui](https://ui.shadcn.com/) (Base UI)                                                    |
| Table         | [@tanstack/react-table](https://tanstack.com/table)                                              |
| Graph         | [@xyflow/react](https://reactflow.dev/) (React Flow) + [dagre](https://github.com/dagrejs/dagre) |
| Language      | TypeScript 6                                                                                     |

## Getting Started

### Prerequisites

- Node.js ≥ 22.12.0
- pnpm (recommended)

### Install & Run

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

Open [http://localhost:4321](http://localhost:4321) in your browser.

### Build for Production

```bash
pnpm build
pnpm preview
```

## Usage

1. Click **Select MO2 Folder** and pick your Mod Organizer 2 installation directory.
2. Choose a profile from the dropdown and click **Load**.
3. The table and dependency graph will populate automatically.
4. _(Optional)_ Click **Sync Nexus** to fetch mod metadata from Nexus Mods (requires an API key prompt on first use).

## License

AGPL-3.0
