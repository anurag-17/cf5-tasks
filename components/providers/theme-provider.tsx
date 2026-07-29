"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Single place that configures dark/light mode for the whole app. Swaps the
 * `.dark` class on <html> (see app/globals.css for the palette that reacts
 * to it) — never toggle themes any other way.
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
