"use client";

import Link from "next/link";

export const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            Link Persona
   </h1>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/discover" className="text-gray-600 hover:text-gray-900">
            マッチング
          </Link>
          <Link href="/messages" className="text-gray-600 hover:text-gray-900">
            メッセージ
          </Link>
          <Link href="/profile" className="text-gray-600 hover:text-gray-900">
            プロフィール
          </Link>
        </nav>
      </div>
    </header>
  );
};
