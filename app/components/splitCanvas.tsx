'use client';

import React, { JSX, useRef, useState } from 'react';
import EditorPanel from './EditorCanvas';
// import Navbar from './navbar';
// import EditorPanel from './EditorPanel';
// import TreeCanvas from './TreeCanvas';

export default function SplitCanvas(): JSX.Element {
  const [leftWidth, setLeftWidth] = useState<number>(45); // percent
  const dragging = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const container = document.getElementById('split-root');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let pct = (x / rect.width) * 100;
    if (pct < 15) pct = 15;
    if (pct > 85) pct = 85;
    setLeftWidth(pct);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    dragging.current = false;
    try { (e.target as Element).releasePointerCapture(e.pointerId); } catch (err) {}
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      

      <main id="split-root" className="flex h-[calc(100vh-64px)]">
        {/* Editor panel (left) */}
        <aside style={{ width: `${leftWidth}%` }} className="flex flex-col border-r border-border">
          {/* <div className="p-3 border-b border-border">
            <div className="text-sm font-medium">Editor</div>
            <div className="text-xs text-muted-foreground">Monaco Editor</div>
          </div> */}
          <div className="flex-1">
            <EditorPanel/>
          </div>
        </aside>

        {/* Splitter */}
        <div
          role="separator"
          aria-orientation="vertical"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="w-2 cursor-col-resize bg-transparent hover:bg-border flex items-center justify-center"
          style={{ touchAction: 'none' }}
        >
          <div className="w-0.5 h-24 bg-border rounded"></div>
        </div>

        {/* Tree canvas (right) */}
        <section style={{ width: `${100 - leftWidth}%` }} className="flex-1 flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="text-sm font-medium">Visualizer</div>
            <div className="text-xs text-muted-foreground">React Flow Canvas</div>
          </div>
          <div className="flex-1">
            {/* <TreeCanvas /> */}
          </div>
        </section>
      </main>
    </div>
  );
}
