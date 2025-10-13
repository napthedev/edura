"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  React.useEffect(() => {
    try {
      // Ensure the light class is applied and dark is removed so any persisted
      // theme in localStorage or system preference cannot override the app.
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } catch (e) {
      // ignore (e.g., during server-side rendering)
    }
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
