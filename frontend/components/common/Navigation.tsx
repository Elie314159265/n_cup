"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const Navigation = () => {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
      <div className="flex items-center justify-around h-16">
        <Link
          href="/discover"
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 ${
            isActive("/discover") ? "text-pink-500" : "text-gray-600"
          }`}
        >
          <span className="text-xl">❤️</span>
          <span className="text-xs">マッチング</span>
        </Link>
        <Link
          href="/messages"
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 ${
            isActive("/messages") ? "text-pink-500" : "text-gray-600"
          }`}
        >
          <span className="text-xl">💬</span>
          <span className="text-xs">メッセージ</span>
        </Link>
        <Link
          href="/profile"
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 ${
            isActive("/profile") ? "text-pink-500" : "text-gray-600"
          }`}
        >
          <span className="text-xl">👤</span>
          <span className="text-xs">プロフィール</span>
        </Link>
      </div>
    </nav>
  );
};
