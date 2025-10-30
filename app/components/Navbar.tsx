'use client';


import React from 'react';
import { Search, Download, ZoomIn, ZoomOut, Maximize2, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

import ThemeToggle from "./theme-toggle";
export default function Navbar() {
return (
<header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
{/* Left: Logo + App Name */}
<div className="flex items-center gap-3">
<div className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-md">
J
</div>
<span className="text-lg font-semibold tracking-tight select-none">JSON Tree</span>
</div>


{/* Right: Controls */}
<div className="flex items-center gap-2">
{/* Search box */}
<div className="relative hidden md:block">
<Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
<input
type="text"
placeholder="Search..."
className="pl-8 pr-3 py-1.5 text-sm rounded-md border border-input bg-muted/30 dark:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary transition"
/>
</div>


{/* Toolbar buttons */}
<Button variant="ghost" size="icon" title="Download JSON">
<Download className="w-4 h-4" />
</Button>


<Button variant="ghost" size="icon" title="Zoom In">
<ZoomIn className="w-4 h-4" />
</Button>


<Button variant="ghost" size="icon" title="Zoom Out">
<ZoomOut className="w-4 h-4" />
</Button>


<Button variant="ghost" size="icon" title="Fit View">
<Maximize2 className="w-4 h-4" />
</Button>
<ThemeToggle />


{/* Shortcuts Dropdown Placeholder */}
<Button variant="outline" size="sm" className="flex items-center gap-1">
<Keyboard className="w-4 h-4" />
<span className="hidden sm:inline">Shortcuts</span>
</Button>
</div>
</header>
);
}