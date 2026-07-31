import React, { useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import type { Mod } from '@/types';

interface ModGraphProps {
  mods: Mod[];
  isDarkMode: boolean;
}

const nodeHeight = 36;
const charWidth = 7; // approximate px per character at text-xs
const nodePadding = 24;

const getNodeWidth = (label: string) => {
  return Math.max(80, Math.min(300, label.length * charWidth + nodePadding));
};

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  dagreGraph.setGraph({ rankdir: direction, nodesep: 20, ranksep: 50 });

  nodes.forEach((node) => {
    const w = node.style?.width || 120;
    dagreGraph.setNode(node.id, { width: w, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const w = node.style?.width || 120;
    const newNode = { ...node };

    newNode.position = {
      x: nodeWithPosition.x - w / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return newNode;
  });

  return { nodes: newNodes, edges };
};

export function ModGraph({ mods, isDarkMode }: ModGraphProps) {
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: any[] = [];
    const edgesList: any[] = [];
    const connectedNodeIds = new Set<string>();

    const modsByNexusId = new Map<string, Mod>();
    mods.forEach(mod => {
      if (mod.nexusId) modsByNexusId.set(mod.nexusId, mod);
    });

    const missingRequirements = new Map<string, string>(); // modId -> modName

    mods.forEach(mod => {
      if (mod.requirements && mod.requirements.length > 0) {
        mod.requirements.forEach(req => {
          if (!req.externalRequirement) {
            const reqMod = modsByNexusId.get(req.modId);
            edgesList.push({
              id: `e-${req.modId}-${mod.nexusId}`,
              source: req.modId,
              target: mod.nexusId!,
              animated: true,
              markerEnd: {
                type: MarkerType.ArrowClosed,
              },
            });
            connectedNodeIds.add(mod.nexusId!);
            connectedNodeIds.add(req.modId);

            if (!reqMod) {
              missingRequirements.set(req.modId, req.modName);
            }
          }
        });
      }
    });

    mods.forEach(mod => {
      if (mod.nexusId && connectedNodeIds.has(mod.nexusId)) {
        const isDisabled = mod.status === 'Disabled';
        const borderColor = isDisabled ? '#9ca3af' : undefined;
        const bgColor = isDisabled ? '#f3f4f6' : undefined;
        const textColor = isDisabled ? '#9ca3af' : undefined;
        const darkBgColor = isDisabled ? '#374151' : undefined;
        const darkTextColor = isDisabled ? '#6b7280' : undefined;

        nodes.push({
          id: mod.nexusId,
          data: { label: mod.name },
          position: { x: 0, y: 0 },
          className: 'text-xs rounded shadow-sm',
          style: {
            width: getNodeWidth(mod.name),
            height: nodeHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 8px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: '11px',
            ...(isDisabled ? {
              backgroundColor: isDarkMode ? darkBgColor : bgColor,
              borderColor: borderColor,
              color: isDarkMode ? darkTextColor : textColor,
              opacity: 0.6,
            } : {}),
          }
        });
      }
    });

    // Add missing requirement nodes (red)
    missingRequirements.forEach((name, modId) => {
      if (!modsByNexusId.has(modId)) {
        const label = `⚠ ${name}`;
        nodes.push({
          id: modId,
          data: { label },
          position: { x: 0, y: 0 },
          className: 'text-xs rounded shadow-sm',
          style: {
            width: getNodeWidth(label),
            height: nodeHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 8px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: '11px',
            backgroundColor: isDarkMode ? '#7f1d1d' : '#fef2f2',
            borderColor: '#ef4444',
            color: isDarkMode ? '#fca5a5' : '#dc2626',
            border: '2px solid #ef4444',
          }
        });
      }
    });

    return { initialNodes: nodes, initialEdges: edgesList };
  }, [mods, isDarkMode]);

  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);

  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
    );
    
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full text-muted-foreground text-sm">
        No dependency graph available yet. Sync Nexus Data to view.
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        colorMode={isDarkMode ? 'dark' : 'light'}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
