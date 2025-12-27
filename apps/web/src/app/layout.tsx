import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "../index.css";
import Providers from "@/components/providers";
import { NextIntlClientProvider } from "next-intl";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Edura",
  description: "Edura",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${nunito.variable} antialiased`}>
        <NextIntlClientProvider>
          <Providers>
            <div className="min-h-screen">{children}</div>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
