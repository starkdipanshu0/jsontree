'use client';

import React, { useCallback, useEffect, useMemo } from 'react';
import { Search, Download, ZoomIn, ZoomOut, Maximize2, Keyboard, ArrowRightLeft, Columns } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from './theme-toggle';
import { useAppDispatch, useAppSelector } from '@/redux/store/hooks';
import { requestDownloadImage, requestFitView, requestZoom, selectIsEditorOpen, selectLayoutDirection, selectSearchQuery, setLayoutDirection, setSearchQuery, toggleEditor } from '@/redux/ui/slice';
import debounce from 'lodash.debounce';

export default function Navbar() {
  const dispatch = useAppDispatch();
  const layoutDirection = useAppSelector(selectLayoutDirection);
  const isEditorOpen = useAppSelector(selectIsEditorOpen);
  // small no-op handlers (replace later with real actions)
  const currentSearch = useAppSelector(selectSearchQuery);

  const debouncedDispatch = useMemo(
    () =>
      debounce((val: string) => {
        console.log('[Navbar] debounced dispatch setSearchQuery ->', val);
        dispatch(setSearchQuery(val));
      }, 1000),
    [dispatch]
  );

  // cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedDispatch.cancel();
    };
  }, [debouncedDispatch]);

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      {/* Left: Logo + App Name */}
      <div className="flex items-center gap-3">
        <div
          role="img"
          aria-label="JSON Tree logo"
          className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-md select-none"
        >
          J
        </div>

        <span className="text-lg font-semibold tracking-tight select-none">JSON Tree</span>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-3">
        {/* Search box (visually hidden label for a11y) */}
        <label htmlFor="site-search" className="sr-only">
          Search nodes
        </label>
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" aria-hidden />
          <input
            id="site-search"
            type="text"
            placeholder="Search nodes..."
            aria-label="Search nodes"
            defaultValue={currentSearch ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              console.log('[Navbar] input onChange ->', v);
              debouncedDispatch(v);
            }}
            className="pl-8 pr-3 py-1.5 text-sm rounded-md border border-input bg-muted/30 dark:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary transition w-64"
          />
        </div>

        {/* Toolbar buttons: icon-only on small screens, icon+label on md+ */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Download Tree" title="Download Tree" onClick={() => dispatch(requestDownloadImage())}>
            <Download className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="icon" aria-label="Zoom in" title="Zoom in" onClick={() => dispatch(requestZoom(1))}>
            <ZoomIn className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="icon" aria-label="Zoom out" title="Zoom out" onClick={() => dispatch(requestZoom(-1))}>
            <ZoomOut className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="icon" aria-label="Fit view" title="Fit view" onClick={() => dispatch(requestFitView())}>
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Rotate tree layout"
            title={`Rotate layout (${layoutDirection === 'TB' ? 'Top→Bottom' : 'Left→Right'})`}
            onClick={() => {
              console.log('[Navbar] rotate clicked, current direction:', layoutDirection);
              const next = layoutDirection === 'TB' ? 'LR' : 'TB';
              console.log('[Navbar] dispatching setLayoutDirection(', next, ')');
              dispatch(setLayoutDirection(next));
              dispatch(requestFitView());
            }}
          >
            <ArrowRightLeft className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label={isEditorOpen ? 'Collapse editor' : 'Open editor'}
            title={isEditorOpen ? 'Collapse editor' : 'Open editor'}
            onClick={() => {
              dispatch(toggleEditor());
              dispatch(requestFitView());
            }}
          >
            <Columns className="w-4 h-4" />
          </Button>

          {/* Theme toggle (shadcn) */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
