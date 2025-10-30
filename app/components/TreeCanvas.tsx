'use client';

import React, { useEffect, useMemo } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Node as RFNode,
    Edge as RFEdge,
    ReactFlowProvider,
    useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { useTheme } from 'next-themes';
import * as htmlToImage from 'html-to-image';
import { useAppSelector } from '@/redux/store/hooks';
import { selectTreeModel } from '@/redux/json/slice';
import { selectDownloadImageCounter, selectFitViewCounter, selectZoomDelta, selectZoomRequestId } from '@/redux/ui/slice';
import { selectLayoutDirection } from '@/redux/ui/slice';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 50;

// Dagre layout helper
function dagreLayout(nodes: RFNode[], edges: RFEdge[], direction: 'TB' | 'LR' = 'TB') {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({
        rankdir: direction, // TB = top→bottom
        nodesep: 40,        // horizontal spacing between nodes
        ranksep: 150,       // vertical spacing between levels
        marginx: 20,
        marginy: 20,
    }); // 'TB' = top->bottom, 'LR' = left->right

    nodes.forEach((n) => {
        g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });

    edges.forEach((e) => {
        g.setEdge(e.source, e.target);
    });

    dagre.layout(g);

    const positioned = nodes.map((n) => {
        const nodeWithPos = g.node(n.id);
        if (!nodeWithPos) return n;
        // Dagre gives center coordinates — convert to top-left based coordinates used by React Flow
        return {
            ...n,
            position: { x: nodeWithPos.x - NODE_WIDTH / 2, y: nodeWithPos.y - NODE_HEIGHT / 2 },
            // lock the node so reactflow doesn't override it by default
            dragHandle: undefined,
            data: n.data,
        } as RFNode;
    });

    return positioned;
}

function pickColorsForType(type: string, isDark: boolean) {
    // hex palette tuned for both themes
    const palette: Record<string, { light: { bg: string; border: string; text: string }; dark: { bg: string; border: string; text: string } }> = {
        object: {
            light: { bg: '#ede9fe', border: '#7c3aed', text: '#1f2937' }, // purple-ish
            dark: { bg: '#2a2250', border: '#8b5cf6', text: '#f8fafc' },
        },
        array: {
            light: { bg: '#ecfdf5', border: '#059669', text: '#064e3b' }, // green
            dark: { bg: '#07221a', border: '#34d399', text: '#ecfeff' },
        },
        primitive: {
            light: { bg: '#fff7ed', border: '#f97316', text: '#7c2d12' }, // orange
            dark: { bg: '#2b1608', border: '#fb923c', text: '#fff7ed' },
        },
        nullish: {
            light: { bg: '#f3f4f6', border: '#9ca3af', text: '#374151' }, // gray
            dark: { bg: '#111827', border: '#374151', text: '#cbd5e1' },
        },
        unknown: {
            light: { bg: '#f8fafc', border: '#94a3b8', text: '#0f172a' },
            dark: { bg: '#0b1220', border: '#475569', text: '#e6eef8' },
        },
    };

    const key =
        type === 'object' ? 'object' : type === 'array' ? 'array' : type === 'null' ? 'nullish' : type === 'unknown' ? 'unknown' : 'primitive';

    return isDark ? palette[key].dark : palette[key].light;
}
type Props = {
    containerRef?: React.RefObject<HTMLDivElement | null> // wrapper DOM node to capture
};
export default function TreeCanvas({ containerRef }: Props) {
    const tree = useAppSelector((s) => s.jsonTree?.tree);
    const downloadCounter = useAppSelector(selectDownloadImageCounter);
    const { theme, systemTheme } = useTheme();
    const currentTheme = theme === 'system' ? systemTheme : theme;
    const isDark = currentTheme === 'dark';
    const layoutDirection = useAppSelector(selectLayoutDirection) ?? 'TB';
    useEffect(() => {
        console.log('[TreeCanvas] layoutDirection from store ->', layoutDirection);
    }, [layoutDirection]);
    const rf = useReactFlow()

    // prepare react-flow nodes/edges from our tree model
    const { rfNodes, rfEdges } = useMemo(() => {
        if (!tree || !tree.nodes || tree.nodes.length === 0) return { rfNodes: [], rfEdges: [] };

        const nodes: RFNode[] = tree.nodes.map((n) => {
            // pick colors based on node.type
            const colors = pickColorsForType(n.type, isDark);

            // ensure readable text color usage
            const label = (
                <div className="flex flex-col" style={{ color: colors.text }}>
                    <div style={{ fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.label}</div>
                    {n.valuePreview ? (
                        <div style={{ fontSize: 11, opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.valuePreview}</div>
                    ) : null}
                </div>
            );

            const sourcePos = layoutDirection === 'LR' ? 'right' : 'bottom';
            const targetPos = layoutDirection === 'LR' ? 'left' : 'top';

            return {
                id: n.id,
                data: { label },
                position: { x: 0, y: 0 }, // dagre will set real positions
                sourcePosition: sourcePos,
                targetPosition: targetPos,
                style: {
                    width: NODE_WIDTH,
                    height: NODE_HEIGHT,
                    background: colors.bg,
                    border: `2px solid ${colors.border}`,
                    color: colors.text,
                    borderRadius: 8,
                    boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.6)' : '0 1px 4px rgba(16,24,40,0.04)',
                },
            } as RFNode;
        });

        const edges: RFEdge[] = (tree.edges || []).map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            animated: false,
            style: { strokeWidth: 1.2, stroke: isDark ? '#9ca3af' : '#374151', opacity: 0.9 },
        }));

        return { rfNodes: nodes, rfEdges: edges };
    }, [tree, isDark]);

    // compute dagre positions (memoized)
    const positionedNodes = useMemo(() => {
        if (rfNodes.length === 0) return [];
        console.log('[TreeCanvas] calling dagreLayout with direction=', layoutDirection);
        const out = dagreLayout(rfNodes, rfEdges, layoutDirection);
        console.log('[TreeCanvas] positionedNodes sample positions:', out.slice(0, 5).map(n => ({ id: n.id, pos: n.position })));
        return out;
    }, [rfNodes, rfEdges, layoutDirection]);


    // Fit view whenever nodes change
    useEffect(() => {
        if (!rf || !rf.fitView) return;
        if (positionedNodes.length === 0) return;
        const t = setTimeout(() => {
            try {
                rf.fitView({ padding: 0.12 });
            } catch { }
        }, 150);
        return () => clearTimeout(t);
    }, [rf, positionedNodes.length]);
    // Download image handler — listens to downloadCounter increments
    // NOTE: downloadCounter should be 0 initially; TreeCanvas will react when it changes
    useEffect(() => {
        console.log('[TreeCanvas] downloadCounter effect run', { downloadCounter, containerRef: !!containerRef?.current, isDark });
        if (!containerRef?.current) {
            console.warn('[TreeCanvas] containerRef.current is null — nothing to capture');
            return;
        }
        if (!downloadCounter) {
            console.log('[TreeCanvas] downloadCounter is falsy (initial) — ignoring');
            return;
        }

        let cancelled = false;

        const capture = async () => {
            try {
                console.log('[TreeCanvas] starting capture — container bbox:', containerRef.current!.getBoundingClientRect());
                // optional: ensure controls hidden
                const controls = containerRef.current!.querySelector('.react-flow__controls') as HTMLElement | null;
                if (controls) {
                    console.log('[TreeCanvas] hiding controls for capture');
                    controls.style.visibility = 'hidden';
                }

                // call html-to-image
                const start = performance.now();
                const dataUrl = await htmlToImage.toPng(containerRef.current!, {
                    backgroundColor: isDark ? '#0b1220' : '#ffffff',
                    quality: 0.95,
                    pixelRatio: 2,
                });
                const took = Math.round(performance.now() - start);
                console.log(`[TreeCanvas] html-to-image succeeded in ${took}ms, dataUrl length: ${dataUrl.length}`);

                if (cancelled) {
                    console.warn('[TreeCanvas] cancelled after capture, skipping download');
                    return;
                }

                // create blob for safer handling
                const blob = await (await fetch(dataUrl)).blob();
                console.log('[TreeCanvas] blob created', blob.size, blob.type);

                // download via object URL (safer cross-browser)
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                const now = new Date();
                const filename = `json-tree-${now.toISOString().replace(/[:.]/g, '-')}.png`;
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                link.remove();
                // revoke after slight delay
                setTimeout(() => URL.revokeObjectURL(url), 2000);
                console.log('[TreeCanvas] download link triggered, filename=', filename);

                if (controls) {
                    controls.style.visibility = ''; // restore
                }
            } catch (err) {
                console.error('[TreeCanvas] capture failed:', err);
                // user-visible failure
                try { window.alert('Export failed — check console for details'); } catch { }
            }
        };

        const timer = setTimeout(() => {
            void capture();
        }, 120);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [downloadCounter, containerRef, isDark]);

    return (
        <div className="h-full w-full">
            <ReactFlowProvider>
                <InnerFlow nodes={positionedNodes} edges={rfEdges} isDark={isDark} />
            </ReactFlowProvider>
        </div>
    );
}


/** inner component uses useReactFlow safely inside provider */
function InnerFlow({ nodes, edges, isDark }: { nodes: RFNode[]; edges: RFEdge[]; isDark: boolean }) {
    const rf = useReactFlow();

    useEffect(() => {
        if (!rf || nodes.length === 0) return;
        const t = setTimeout(() => {
            try {
                rf.fitView({ padding: 0.12 });
            } catch (err) {
                // ignore
            }
        }, 150);
        return () => clearTimeout(t);
    }, [rf, nodes.length]);



    // --- respond to Fit View requests from Navbar ---
    const fitViewCounter = useAppSelector(selectFitViewCounter);
    useEffect(() => {
        if (!rf) return;
        if (!fitViewCounter) return; // initial 0 ignored
        try {
            rf.fitView({ padding: 0.12 });
        } catch (err) {
            console.warn('fitView request failed', err);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fitViewCounter]); // note: depend only on the counter

    // --- respond to Zoom requests from Navbar ---
    const zoomRequestId = useAppSelector(selectZoomRequestId);
    const zoomDelta = useAppSelector(selectZoomDelta);
    useEffect(() => {
        if (!rf) return;
        if (!zoomRequestId) return;
        // zoomDelta should be +1 or -1: prefer calling zoomIn/zoomOut
        try {
            if ((zoomDelta ?? 0) > 0) {
                rf.zoomIn?.();
            } else if ((zoomDelta ?? 0) < 0) {
                rf.zoomOut?.();
            } else {
                // if delta is 0, optionally do nothing or call setViewport
            }
        } catch (err) {
            console.warn('zoom request failed', err);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [zoomRequestId]); // react when id changes



    if (nodes.length === 0) {
        return (
            <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground p-6">
                <div className="max-w-sm text-center">
                    <div className="text-lg font-medium mb-2">No data to visualize</div>
                    <div>Paste JSON in the editor on the left to see the tree here.</div>
                </div>
            </div>
        );
    }

    // MiniMap color mapping uses same type-to-color function.
    const nodeColor = (node: { id: string }) => {
        // nodes prop doesn't include type here, try to find from nodes array
        const n = nodes.find((x) => x.id === node.id);
        if (!n) return isDark ? '#94a3b8' : '#475569';
        // extract the background style set earlier
        const bg = (n.style as any)?.background;
        return bg ?? (isDark ? '#94a3b8' : '#475569');
    };

    return (
        <ReactFlow nodes={nodes} edges={edges} fitView attributionPosition="bottom-left">
            <Background gap={16} />
            <MiniMap zoomable pannable nodeStrokeWidth={2} nodeColor={nodeColor} maskColor={isDark ? '#05060aAA' : '#f8fafcAA'} />
            <Controls />
        </ReactFlow>
    );
}
