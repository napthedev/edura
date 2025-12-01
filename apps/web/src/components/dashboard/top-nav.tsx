"use client";

import { Menu } from "lucide-react";
import UserMenu from "@/components/user-menu";
import LanguageSwitcher from "@/components/language-switcher";
import { NotificationDropdown } from "@/components/notification/notification-dropdown";

interface TopNavProps {
  onMenuClick?: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-white px-6">
      <button
        onClick={onMenuClick}
        className="md:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>
      <div className="flex flex-1 items-center gap-4"></div>
      <div className="flex items-center gap-4">
        <NotificationDropdown />
        <div className="h-6 w-px bg-slate-200" />
        <LanguageSwitcher />
        <UserMenu />
      </div>
    </header>
  );
}
