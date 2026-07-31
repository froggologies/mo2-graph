import { useMemo, useEffect } from "react"
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import ELK from "elkjs/lib/elk.bundled.js"
import type { Mod } from "@/types"

interface ModGraphProps {
  mods: Mod[]
  isDarkMode: boolean
}

const nodeHeight = 36
const charWidth = 7 // approximate px per character at text-xs
const nodePadding = 24

const elk = new ELK()

const elkOptions = {
  "elk.algorithm": "layered",
  "elk.direction": "DOWN",
  "elk.spacing.nodeNode": "20",
  "elk.layered.spacing.nodeNodeBetweenLayers": "50",
  "elk.edgeRouting": "ORTHOGONAL",
}

const getNodeWidth = (label: string) => {
  return Math.max(80, Math.min(300, label.length * charWidth + nodePadding))
}

const getLayoutedElements = async (nodes: any[], edges: any[]) => {
  const graph = {
    id: "root",
    layoutOptions: elkOptions,
    children: nodes.map((node) => ({
      id: node.id,
      width: node.style?.width || 120,
      height: nodeHeight,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  }

  const layoutedGraph = await elk.layout(graph)

  const layoutedNodes = nodes.map((node) => {
    const layoutedNode = layoutedGraph.children?.find((n) => n.id === node.id)
    return {
      ...node,
      position: {
        x: layoutedNode?.x ?? 0,
        y: layoutedNode?.y ?? 0,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}

export function ModGraph({ mods, isDarkMode }: ModGraphProps) {
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: any[] = []
    const edgesList: any[] = []
    const connectedNodeIds = new Set<string>()

    const modsByNexusId = new Map<string, Mod>()
    mods.forEach((mod) => {
      if (mod.nexusId) modsByNexusId.set(mod.nexusId, mod)
    })

    const missingRequirements = new Map<string, string>() // modId -> modName

    mods.forEach((mod) => {
      if (mod.requirements && mod.requirements.length > 0) {
        mod.requirements.forEach((req) => {
          if (!req.externalRequirement) {
            const reqMod = modsByNexusId.get(req.modId)
            edgesList.push({
              id: `e-${req.modId}-${mod.nexusId}`,
              source: req.modId,
              target: mod.nexusId!,
              animated: true,
              markerEnd: {
                type: MarkerType.ArrowClosed,
              },
            })
            connectedNodeIds.add(mod.nexusId!)
            connectedNodeIds.add(req.modId)

            if (!reqMod) {
              missingRequirements.set(req.modId, req.modName)
            }
          }
        })
      }
    })

    mods.forEach((mod) => {
      if (mod.nexusId && connectedNodeIds.has(mod.nexusId)) {
        const isDisabled = mod.status === "Disabled"
        const borderColor = isDisabled ? "#9ca3af" : undefined
        const bgColor = isDisabled ? "#f3f4f6" : undefined
        const textColor = isDisabled ? "#9ca3af" : undefined
        const darkBgColor = isDisabled ? "#374151" : undefined
        const darkTextColor = isDisabled ? "#6b7280" : undefined

        nodes.push({
          id: mod.nexusId,
          data: { label: mod.name },
          position: { x: 0, y: 0 },
          className: "text-xs rounded shadow-sm",
          style: {
            width: getNodeWidth(mod.name),
            height: nodeHeight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "4px 8px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontSize: "11px",
            ...(isDisabled
              ? {
                  backgroundColor: isDarkMode ? darkBgColor : bgColor,
                  borderColor: borderColor,
                  color: isDarkMode ? darkTextColor : textColor,
                  opacity: 0.6,
                }
              : {}),
          },
        })
      }
    })

    // Add missing requirement nodes (red)
    missingRequirements.forEach((name, modId) => {
      if (!modsByNexusId.has(modId)) {
        const label = `⚠ ${name}`
        nodes.push({
          id: modId,
          data: { label },
          position: { x: 0, y: 0 },
          className: "text-xs rounded shadow-sm",
          style: {
            width: getNodeWidth(label),
            height: nodeHeight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "4px 8px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontSize: "11px",
            backgroundColor: isDarkMode ? "#7f1d1d" : "#fef2f2",
            borderColor: "#ef4444",
            color: isDarkMode ? "#fca5a5" : "#dc2626",
            border: "2px solid #ef4444",
          },
        })
      }
    })

    return { initialNodes: nodes, initialEdges: edgesList }
  }, [mods, isDarkMode])

  const [nodes, setNodes, onNodesChange] = useNodesState<any>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([])

  useEffect(() => {
    if (initialNodes.length === 0) return

    getLayoutedElements(initialNodes, initialEdges).then(
      ({ nodes: layoutedNodes, edges: layoutedEdges }) => {
        setNodes([...layoutedNodes])
        setEdges([...layoutedEdges])
      }
    )
  }, [initialNodes, initialEdges, setNodes, setEdges])

  if (nodes.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
        No dependency graph available yet. Sync Nexus Data to view.
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        colorMode={isDarkMode ? "dark" : "light"}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}
