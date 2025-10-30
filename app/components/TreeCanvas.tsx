'use client';

import React, { useEffect, useMemo } from 'react';
import ReactFlow, {
    addEdge,
    Background,
    Controls,
    MiniMap,
    Node as RFNode,
    Edge as RFEdge,
    useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useAppSelector } from '@/redux/store/hooks'; // adjust path if needed
import { selectTreeModel } from '@/redux/json/slice'; // adjust path if needed

// Layout constants — tweak to taste
const COLUMN_WIDTH = 220;
const ROW_HEIGHT = 80;
const NODE_WIDTH = 160;
const NODE_HEIGHT = 48;

/**
 * Simple deterministic layout:
 * - depth is computed from the path (root = 0, dot/bracket separators increase depth)
 * - nodes at the same depth are stacked vertically
 */
function computePositions(nodes: { id: string; path: string }[]) {
    const depthBuckets: Record<number, string[]> = {};

    for (const n of nodes) {
        // compute depth: count dots + bracket openings
        const depth =
            n.path === 'root'
                ? 0
                : (n.path.match(/\./g)?.length ?? 0) + (n.path.match(/\[/g)?.length ?? 0);
        if (!depthBuckets[depth]) depthBuckets[depth] = [];
        depthBuckets[depth].push(n.id);
    }

    // compute y index for each id
    const positions: Record<string, { x: number; y: number }> = {};
    Object.keys(depthBuckets)
        .map((k) => Number(k))
        .sort((a, b) => a - b)
        .forEach((depth) => {
            const bucket = depthBuckets[depth];
            bucket.forEach((id, idx) => {
                const x = depth * COLUMN_WIDTH + 20; // 20px padding
                const y = idx * ROW_HEIGHT + 20;
                positions[id] = { x, y };
            });
        });

    return positions;
}

export default function TreeCanvas() {
    // read tree from redux
    const tree = useAppSelector((s) => s.jsonTree?.tree);
    const rf = useReactFlow();

    // memoize mapping to avoid recalculation on unrelated renders
    const { nodes: rfNodes, edges: rfEdges } = useMemo(() => {
        if (!tree || !tree.nodes || tree.nodes.length === 0) {
            return { nodes: [], edges: [] };
        }

        // prepare simplified node list for depth computation
        const simpleNodes = tree.nodes.map((n) => ({ id: n.id, path: n.path }));

        const positions = computePositions(simpleNodes);

        // Convert to React Flow nodes
        const nodes: RFNode[] = tree.nodes.map((n) => {
            const pos = positions[n.id] ?? { x: 0, y: 0 };
            return {
                id: n.id,
                data: {
                    label: (
                        <div className="flex flex-col">
                            <div className="font-medium text-sm truncate">{n.label}</div>
                            {n.valuePreview ? (
                                <div className="text-xs text-muted-foreground truncate">{n.valuePreview}</div>
                            ) : null}
                        </div>
                    ),
                },
                position: pos,
                style: {
                    width: NODE_WIDTH,
                    height: NODE_HEIGHT,
                    padding: 8,
                    borderRadius: 8,
                },
                // you can set `type` to custom node types later
            } as RFNode;
        });

        // Convert to React Flow edges
        const edges: RFEdge[] = (tree.edges || []).map((e) => {
            return {
                id: e.id,
                source: e.source,
                target: e.target,
                animated: false,
                label: e.label,
                style: { strokeWidth: 1.5 },
            } as RFEdge;
        });

        return { nodes, edges };
    }, [tree]);

    // Fit view whenever nodes change (debounced internally by reactflow)
    useEffect(() => {
        if (!rf || !rf.fitView) return;
        if (rfNodes.length === 0) return;
        // slight timeout to allow layout to apply
        const t = setTimeout(() => {
            try {
                rf.fitView({ padding: 0.1 });
            } catch (err) {
                // ignore
            }
        }, 150);
        return () => clearTimeout(t);
    }, [rf, rfNodes.length]);

    if (!tree || !tree.nodes || tree.nodes.length === 0) {
        return (
            <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground p-6">
                <div className="max-w-sm text-center">
                    <div className="text-lg font-medium mb-2">No data to visualize</div>
                    <div>Paste JSON in the editor on the left to see a tree visualization here.</div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full">
            <ReactFlow nodes={rfNodes} edges={rfEdges} fitView>
                <Background gap={16} />
                <MiniMap zoomable pannable nodeStrokeWidth={2} />
                <Controls />
            </ReactFlow>
        </div>
    );
}
