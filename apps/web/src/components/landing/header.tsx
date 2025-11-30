"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import UserMenu from "../user-menu";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "../language-switcher";
import Link from "next/link";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const currentUser = null; // Replace with actual user authentication logic
  const t = useTranslations("Header");

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="sticky top-0 z-50 border-gray-100 border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <div className="font-bold text-2xl text-black">Edura</div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden items-center space-x-8 md:flex">
            <a
              className="font-medium text-gray-700 transition-colors hover:text-black"
              href="#demo"
            >
              {t("demo")}
            </a>
            <a
              className="font-medium text-gray-700 transition-colors hover:text-black"
              href="#features"
            >
              {t("features")}
            </a>
            <a
              className="font-medium text-gray-700 transition-colors hover:text-black"
              href="#testimonials"
            >
              {t("testimonials")}
            </a>
            <a
              className="font-medium text-gray-700 transition-colors hover:text-black"
              href="#pricing"
            >
              {t("pricing")}
            </a>
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden items-center space-x-4 md:flex">
            <Link href="/login">
              <Button
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                variant="outline"
              >
                {t("signin")}
              </Button>
            </Link>
            <Link href="/contact">
              <Button className="bg-black text-white hover:bg-gray-800">
                {t("contactUs")}
              </Button>
            </Link>
            <LanguageSwitcher />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              className="p-2"
              onClick={toggleMenu}
              size="sm"
              variant="ghost"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-gray-100 border-t bg-white md:hidden">
          <div className="space-y-4 px-4 py-6">
            <a
              className="block font-medium text-gray-700 transition-colors hover:text-black"
              href="#demo"
            >
              {t("demo")}
            </a>
            <a
              className="block font-medium text-gray-700 transition-colors hover:text-black"
              href="#features"
            >
              {t("features")}
            </a>
            <a
              className="block font-medium text-gray-700 transition-colors hover:text-black"
              href="#testimonials"
            >
              {t("testimonials")}
            </a>
            <a
              className="block font-medium text-gray-700 transition-colors hover:text-black"
              href="#pricing"
            >
              {t("pricing")}
            </a>

            <div className="space-y-3 border-gray-100 border-t pt-4">
              <Button
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                variant="outline"
                onClick={() => (window.location.href = "/landing")}
              >
                {t("signin")}
              </Button>
              <Link href="/contact">
                <Button className="w-full bg-black text-white hover:bg-gray-800">
                  {t("contactUs")}
                </Button>
              </Link>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
