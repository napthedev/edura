import Link from "next/link";
import LanguageSwitcher from "@/components/language-switcher";

export default function AuthHeader() {
  return (
    <header className="sticky top-0 z-50 border-gray-100 border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="font-bold text-2xl text-black">Edura</div>
          </Link>

          {/* Desktop CTA Buttons */}
          <div className="items-center space-x-4">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}
