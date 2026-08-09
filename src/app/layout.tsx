import type { Metadata } from "next";
import { Inter, Noto_Sans_Bengali, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClientLayoutWrapper } from "./ClientLayoutWrapper";

/**
 * Latin UI face. Inter is metric-stable at the small sizes this ERP relies on
 * (12-14px table and form text) and pairs cleanly with Noto Sans Bengali.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Bangla companion face. VisaTek is Bangla-first, so Bangla must NOT fall back
 * to a Latin font — Latin faces render Bangla conjuncts and matras badly.
 * Declared after Inter in the font stack so Latin glyphs still resolve to Inter
 * while Bangla codepoints resolve here.
 */
const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-noto-bengali",
  subsets: ["bengali", "latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VisaTek ERP",
  description: "Enterprise Grade VisaTek Logistics & Finance ERP Hub",
  icons: {
    icon: "/visatek_glove_favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bn-BD"
      className={`${inter.variable} ${notoSansBengali.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
      </body>
    </html>
  );
}
