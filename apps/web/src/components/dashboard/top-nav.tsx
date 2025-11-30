"use client";

import { MessageSquare, Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import UserMenu from "@/components/user-menu";
import LanguageSwitcher from "@/components/language-switcher";
import { NotificationDropdown } from "@/components/notification/notification-dropdown";
import { useTranslations } from "next-intl";

interface TopNavProps {
  onMenuClick?: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const t = useTranslations("Dashboard");

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-white px-6">
      <button
        onClick={onMenuClick}
        className="md:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("searchPlaceholder")}
            className="w-full bg-slate-50 pl-9 md:w-[300px] lg:w-[400px] border-none"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100">
          <Search className="h-5 w-5 md:hidden" />
        </button>
        <NotificationDropdown />
        <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100">
          <MessageSquare className="h-5 w-5" />
        </button>
        <div className="h-6 w-px bg-slate-200" />
        <LanguageSwitcher />
        <UserMenu />
      </div>
    </header>
  );
}
