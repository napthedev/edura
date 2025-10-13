"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ModeToggle() {
  // Theme is locked to light mode. Render a non-interactive indicator.
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Light theme (locked)"
      title="Light theme (locked)"
    >
      <Sun className="h-[1.2rem] w-[1.2rem]" />
    </Button>
  );
}
