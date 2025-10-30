'use client';

import React, { useEffect, useRef, useState } from 'react';
import EditorPanel from './EditorCanvas';
import TreeCanvas from './TreeCanvas';
import { ReactFlowProvider } from 'reactflow';

const STORAGE_KEY = 'split-left-width';
const MIN_PCT = 15;
const MAX_PCT = 85;

export default function SplitCanvas() {
  // SERVER-SAFE default value — do NOT access window/localStorage here
  const [leftWidth, setLeftWidth] = useState<number>(45);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const dragging = useRef(false);
  const splitterRef = useRef<HTMLDivElement | null>(null);

  // Load persisted width on client AFTER hydration
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const v = Number(raw);
        if (!Number.isNaN(v)) {
          setLeftWidth(Math.min(MAX_PCT, Math.max(MIN_PCT, v)));
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  // persist width (writing is fine — doesn't affect SSR)
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(leftWidth));
    } catch {}
  }, [leftWidth]);

  // pointer handlers (use currentTarget)
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {}
    splitterRef.current = e.currentTarget as HTMLDivElement;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const container = document.getElementById('split-root');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let pct = (x / rect.width) * 100;
    if (pct < MIN_PCT) pct = MIN_PCT;
    if (pct > MAX_PCT) pct = MAX_PCT;
    setLeftWidth(pct);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    try {
      if (splitterRef.current) {
        splitterRef.current.releasePointerCapture(e.pointerId);
      } else {
        (e.currentTarget as Element).releasePointerCapture(e.pointerId);
      }
    } catch {}
  };

  // keyboard support
  const onSplitterKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = 2;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setLeftWidth((p) => Math.max(MIN_PCT, Math.min(MAX_PCT, Math.round((p - step) * 100) / 100)));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setLeftWidth((p) => Math.max(MIN_PCT, Math.min(MAX_PCT, Math.round((p + step) * 100) / 100)));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setLeftWidth(MIN_PCT);
    } else if (e.key === 'End') {
      e.preventDefault();
      setLeftWidth(MAX_PCT);
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      setLeftWidth((p) => Math.max(MIN_PCT, Math.min(MAX_PCT, p + 10)));
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      setLeftWidth((p) => Math.max(MIN_PCT, Math.min(MAX_PCT, p - 10)));
    }
  };

  return (
    <div className="h-full bg-background text-foreground">
      <main id="split-root" className="flex h-[calc(100vh-64px)]">
        <aside style={{ width: `${leftWidth}%` }} className="flex flex-col border-r border-border">
          <div className="flex-1">
            <EditorPanel />
          </div>
        </aside>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-valuemin={MIN_PCT}
          aria-valuemax={MAX_PCT}
          aria-valuenow={Math.round(leftWidth)}
          tabIndex={0}
          ref={splitterRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onKeyDown={onSplitterKeyDown}
          className="w-2 cursor-col-resize bg-transparent hover:bg-border flex items-center justify-center"
          style={{ touchAction: 'none' }}
        >
          <div className="w-0.5 h-24 bg-border rounded" />
        </div>

        <section style={{ width: `${100 - leftWidth}%` }} className="flex-1 flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="text-sm font-medium">Visualizer</div>
            <div className="text-xs text-muted-foreground">React Flow Canvas</div>
          </div>
          <div className="flex-1" ref={containerRef}>
            <ReactFlowProvider>
              <TreeCanvas  containerRef={containerRef} />
            </ReactFlowProvider>
          </div>
        </section>
      </main>
    </div>
  );
}