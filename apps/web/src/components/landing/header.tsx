"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { mockData } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import UserMenu from "../user-menu";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const currentUser = null; // Replace with actual user authentication logic

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="sticky top-0 z-50 border-gray-100 border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <div className="font-bold text-2xl text-black">
              {mockData.siteName}
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden items-center space-x-8 md:flex">
            <a
              className="font-medium text-gray-700 transition-colors hover:text-black"
              href="#demo"
            >
              Demo
            </a>
            <a
              className="font-medium text-gray-700 transition-colors hover:text-black"
              href="#features"
            >
              Features
            </a>
            <a
              className="font-medium text-gray-700 transition-colors hover:text-black"
              href="#testimonials"
            >
              Testimonials
            </a>
            <a
              className="font-medium text-gray-700 transition-colors hover:text-black"
              href="#pricing"
            >
              Pricing
            </a>
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden items-center space-x-4 md:flex">
            {!currentUser ? (
              <>
                <Button
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  variant="outline"
                  onClick={() => (window.location.href = "/landing")}
                >
                  Sign In
                </Button>
                <Button className="bg-black text-white hover:bg-gray-800">
                  Start Free Trial
                </Button>
              </>
            ) : (
              <>
                <UserMenu />
              </>
            )}
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
              href="#home"
            >
              Home
            </a>
            <a
              className="block font-medium text-gray-700 transition-colors hover:text-black"
              href="#instructors"
            >
              Teachers
            </a>
            <a
              className="block font-medium text-gray-700 transition-colors hover:text-black"
              href="#pricing"
            >
              Pricing
            </a>
            <a
              className="block font-medium text-gray-700 transition-colors hover:text-black"
              href="#about"
            >
              About
            </a>

            <div className="space-y-3 border-gray-100 border-t pt-4">
              {!currentUser ? (
                <>
                  <Button
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                    variant="outline"
                    onClick={() => (window.location.href = "/landing")}
                  >
                    Sign In
                  </Button>
                  <Button className="w-full bg-black text-white hover:bg-gray-800">
                    Start Free Trial
                  </Button>
                </>
              ) : (
                <UserMenu />
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
