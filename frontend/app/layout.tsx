import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Header } from "@/components/common/Header";
import { Navigation } from "@/components/common/Navigation";
import Script from "next/script";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LinkPersona",
  description: "LinkPersona - AI-powered matching application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >

        <Header />
        <main className="min-h-screen pb-20 md:pb-0">{children}</main>
        <Navigation />
        <Script src="https://launchar.app/sdk/v1?key=1fKLxRkwDhlDqTTEhwQs2bboGFO372oa&redirect=true"></Script>

      </body>
    </html>
  );
}
