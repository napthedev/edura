"use client";

import Cookies from "js-cookie";
import { Languages } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const languages = [
  { code: "vi", name: "Tiếng Việt" },
  { code: "en", name: "English" },
];

const COOKIE_EXPIRY_DAYS = 365;

export default function LanguageSwitcher() {
  const t = useTranslations("Languages");

  const handleLanguageChange = (locale: string) => {
    // Set a cookie to store the language preference
    Cookies.set("locale", locale, { expires: COOKIE_EXPIRY_DAYS, path: "/" });
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="outline">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">{t("language") || "Language"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
          >
            {t(language.code as "vi" | "en") || language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
