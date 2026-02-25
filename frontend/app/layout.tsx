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
        suppressHydrationWarning
      >
        <Header />
        <main className="min-h-screen pb-20 md:pb-0">{children}</main>
        <Navigation />
        {/* Variant Launch AR SDK: iOSでのWebXR ARポリフィル。
            ⚠️ ドメインエラーが出る場合は https://launchar.app のプロジェクト設定で
               ngrok URL (*.ngrok-free.app 等) を Allowed Domains に追加してください */}
        <Script src="https://launchar.app/sdk/v1?key=1fKLxRkwDhlDqTTEhwQs2bboGFO372oa&redirect=true" />
      </body>
    </html>
  );
}
