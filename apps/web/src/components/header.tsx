"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./language-switcher";

export default function Header() {
  const t = useTranslations("Header");

  const links = [
    { to: "/", label: t("home") },
    { to: "/dashboard", label: t("dashboard") },
    { to: "/todos", label: t("todos") },
  ] as const;

  return (
    <div>
      <div className="flex flex-row items-center justify-between px-2 py-1">
        <nav className="flex gap-4 text-lg">
          {links.map(({ to, label }) => (
            <Link href={to} key={to}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
        </div>
      </div>
      <hr />
    </div>
  );
}
