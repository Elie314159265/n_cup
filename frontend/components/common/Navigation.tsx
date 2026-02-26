"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, MessageCircle, User } from "lucide-react";

export const Navigation = () => {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { href: "/discover", label: "マッチング", Icon: Flame },
    { href: "/messages", label: "メッセージ", Icon: MessageCircle },
    { href: "/profile", label: "プロフィール", Icon: User },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 md:hidden"
      style={{
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors"
            >
              <span
                className="flex items-center justify-center w-9 h-9 rounded-2xl transition-all"
                style={
                  active
                    ? { background: "linear-gradient(135deg,#ec4899,#8b5cf6)" }
                    : {}
                }
              >
                <Icon
                  size={20}
                  className="transition-colors"
                  style={{ color: active ? "#fff" : "#9ca3af" }}
                />
              </span>
              <span
                className="text-[10px] font-semibold tracking-wide transition-colors"
                style={{ color: active ? "#ec4899" : "#9ca3af" }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
