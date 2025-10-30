'use client';

import React, { useEffect, useRef, useState } from 'react';
import EditorPanel from './EditorCanvas';
import TreeCanvas from './TreeCanvas';
import { ReactFlowProvider } from 'reactflow';
import { useAppSelector } from '@/redux/store/hooks';
import { selectIsEditorOpen } from '@/redux/ui/slice';

const STORAGE_KEY = 'split-left-width';
const MIN_PCT = 15;
const MAX_PCT = 85;

export default function SplitCanvas() {
  // SERVER-SAFE default value — do NOT access window/localStorage here
  const [leftWidth, setLeftWidth] = useState<number>(45);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isEditorOpen = useAppSelector(selectIsEditorOpen);

  const dragging = useRef(false);
  const splitterRef = useRef<HTMLDivElement | null>(null);

  // whether layout is horizontal (side-by-side) or vertical (stacked)
  const [isHorizontal, setIsHorizontal] = useState<boolean>(() => {
    // initial safe guess for SSR (will be corrected after hydration)
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 768;
  });

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

    // ensure initial isHorizontal matches viewport
    const check = () => setIsHorizontal(window.innerWidth >= 768);
    check();
  }, []);

  // persist width (writing is fine — doesn't affect SSR)
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(leftWidth));
    } catch { }
  }, [leftWidth]);

  // clamp leftWidth when container resizes or orientation changes
  useEffect(() => {
    const onResize = () => {
      setIsHorizontal(window.innerWidth >= 768);
      setLeftWidth((p) => Math.min(MAX_PCT, Math.max(MIN_PCT, p)));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Make sure dragging stops if pointer is released outside the splitter
  useEffect(() => {
    const onPointerUpWindow = () => {
      dragging.current = false;
    };
    window.addEventListener('pointerup', onPointerUpWindow);
    return () => window.removeEventListener('pointerup', onPointerUpWindow);
  }, []);

  // pointer handlers (use currentTarget)
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch { }
    splitterRef.current = e.currentTarget as HTMLDivElement;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    let pct: number;
    if (isHorizontal) {
      const x = e.clientX - rect.left;
      pct = (x / rect.width) * 100;
    } else {
      // vertical / stacked layout: treat top area as "left"
      const y = e.clientY - rect.top;
      pct = (y / rect.height) * 100;
    }

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
    } catch { }
  };

  // keyboard support (arrow keys adapt to orientation)
  const onSplitterKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = 2;
    if (isHorizontal) {
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
    } else {
      // vertical (top/bottom) mapping
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setLeftWidth((p) => Math.max(MIN_PCT, Math.min(MAX_PCT, Math.round((p - step) * 100) / 100)));
      } else if (e.key === 'ArrowDown') {
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
        setLeftWidth((p) => Math.max(MIN_PCT, Math.min(MAX_PCT, p - 10)));
      } else if (e.key === 'PageDown') {
        e.preventDefault();
        setLeftWidth((p) => Math.max(MIN_PCT, Math.min(MAX_PCT, p + 10)));
      }
    }
  };

  // compute style values depending on orientation
  const firstStyle = isHorizontal ? { width: `${leftWidth}%` } : { height: `${leftWidth}%` };
  const secondStyle = isHorizontal ? { width: `${100 - leftWidth}%` } : { height: `${100 - leftWidth}%` };

  return (
    <div className="h-full bg-background text-foreground">
      <main
        id="split-root"
        className={`flex h-[calc(100vh-64px)] ${isHorizontal ? 'flex-col md:flex-row' : 'flex-col'}`}
        style={{ minHeight: 0 }}
      >
        {isEditorOpen ? (
          <aside
            style={firstStyle}
            className={`flex ${isHorizontal ? 'flex-col border-r border-border' : 'flex-col border-b border-border'}`}
          >
            <div className="flex-1 min-h-0">
              <EditorPanel />
            </div>
          </aside>
        ) : null}

        {isEditorOpen ? (
          <div
            role="separator"
            aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
            aria-valuemin={MIN_PCT}
            aria-valuemax={MAX_PCT}
            aria-valuenow={Math.round(leftWidth)}
            tabIndex={0}
            ref={splitterRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onKeyDown={onSplitterKeyDown}
            className={`${
              isHorizontal ? 'w-2 cursor-col-resize' : 'h-2 cursor-row-resize'
            } bg-transparent hover:bg-border flex items-center justify-center`}
            style={{ touchAction: 'none' }}
            aria-label={isHorizontal ? 'Resize panels horizontally' : 'Resize panels vertically'}
          >
            {/* visual bar */}
            {isHorizontal ? (
              <div className="w-0.5 h-24 bg-border rounded" />
            ) : (
              <div className="h-0.5 w-24 bg-border rounded" />
            )}
          </div>
        ) : null}

        <section
          style={secondStyle}
          className="flex-1 flex flex-col min-h-0"
          
        >
          <div className="flex-1 min-h-0" ref={containerRef}>
            <ReactFlowProvider>
              <TreeCanvas containerRef={containerRef} />
            </ReactFlowProvider>
          </div>
        </section>
      </main>
    </div>
  );
}
