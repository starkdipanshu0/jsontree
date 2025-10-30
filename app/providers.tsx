'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"        // toggles `class="dark"` on html element
      defaultTheme="system"    // use system preference by default
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}