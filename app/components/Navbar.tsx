'use client';

import React from 'react';
import { Search, Download, ZoomIn, ZoomOut, Maximize2, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from './theme-toggle';
import { useAppDispatch } from '@/redux/store/hooks';
import { requestDownloadImage, requestFitView, requestZoom } from '@/redux/ui/slice';

export default function Navbar() {
  const dispatch = useAppDispatch();
  // small no-op handlers (replace later with real actions)
  const noop = () => {};

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
            placeholder="Search..."
            aria-label="Search nodes"
            className="pl-8 pr-3 py-1.5 text-sm rounded-md border border-input bg-muted/30 dark:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary transition w-64"
          />
        </div>

        {/* Toolbar buttons: icon-only on small screens, icon+label on md+ */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Download JSON" title="Download JSON" onClick={() => dispatch(requestDownloadImage())}>
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

          {/* Theme toggle (shadcn) */}
          <ThemeToggle />

          {/* Shortcuts dropdown placeholder — replace with menu/popover later */}
          <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={noop} aria-label="Shortcuts" title="Shortcuts">
            <Keyboard className="w-4 h-4" />
            <span className="hidden sm:inline">Shortcuts</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
