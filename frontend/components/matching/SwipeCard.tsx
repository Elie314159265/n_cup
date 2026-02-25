"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { User } from "lucide-react";

interface Profile {
  id: string;
  username: string;
  age: number;
  interests: string;
  image?: string;
  compatibility: number;
}

interface SwipeCardProps {
  profile: Profile;
  onLike: () => void;
  onPass: () => void;
}

export const SwipeCard = ({ profile, onLike, onPass }: SwipeCardProps) => {
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    // プロフィール切り替え時に右側からスワイプインさせる
    const timer = setTimeout(() => {
      setIsResetting(true);
      setDragOffset({ x: 1000, y: 0 }); // 一旦右側に配置
      setIsAnimating(false);
    }, 0);

    const timer2 = setTimeout(() => {
      setIsResetting(false);
      setDragOffset({ x: 0, y: 0 }); // アニメーションしながら中央へ
    }, 50);
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [profile]);

  const handleStart = (clientX: number, clientY: number) => {
    if (isAnimating) return;
    setDragStart({ x: clientX, y: clientY });
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!dragStart || isAnimating) return;
    const x = clientX - dragStart.x;
    const y = clientY - dragStart.y;
    setDragOffset({ x, y });
  };

  const handleEnd = () => {
    if (!dragStart || isAnimating) return;

    const threshold = 100;
    if (dragOffset.x > threshold) {
      setIsAnimating(true);
      setDragOffset({ x: 1000, y: dragOffset.y });
      setTimeout(() => onLike(), 200);
    } else if (dragOffset.x < -threshold) {
      setIsAnimating(true);
      setDragOffset({ x: -1000, y: dragOffset.y });
      setTimeout(() => onPass(), 200);
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
    setDragStart(null);
  };

  const rotate = dragOffset.x * 0.05;
  const opacityLike = Math.min(Math.max(dragOffset.x / 100, 0), 1);
  const opacityPass = Math.min(Math.max(-dragOffset.x / 100, 0), 1);

  const interestTags = profile.interests.split("・");

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none shadow-2xl"
      style={{
        height: "500px",
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotate}deg)`,
        transition:
          dragStart || isResetting ? "none" : "transform 0.3s ease-out",
      }}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseUp={handleEnd}
      onMouseLeave={() => dragStart && handleEnd()}
      onTouchStart={(e) =>
        handleStart(e.touches[0].clientX, e.touches[0].clientY)
      }
      onTouchMove={(e) =>
        handleMove(e.touches[0].clientX, e.touches[0].clientY)
      }
      onTouchEnd={handleEnd}
    >
      {/* 背景・画像エリア */}
      {profile.image ? (
        <Image
          src={profile.image}
          alt={profile.username}
          fill
          className="object-cover"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 flex items-center justify-center">
          <User size={80} className="text-white/60" />
        </div>
      )}

      {/* グラデーションオーバーレイ */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

      {/* 相性スコアバッジ（右上） */}
      <div className="absolute top-4 right-4 z-10 pointer-events-none">
        <div
          className="backdrop-blur-sm rounded-2xl px-3 py-1.5 text-white font-bold text-sm"
          style={{ background: "rgba(236,72,153,0.75)" }}
        >
          {profile.compatibility}% MATCH
        </div>
      </div>

      {/* LIKE スタンプ */}
      <div
        className="absolute top-10 left-6 border-4 border-emerald-400 rounded-xl px-3 py-1 transform -rotate-12 z-10 pointer-events-none"
        style={{ opacity: opacityLike }}
      >
        <span className="text-3xl font-black text-emerald-400 uppercase tracking-wider">
          LIKE
        </span>
      </div>

      {/* 爆破スタンプ */}
      <div
        className="absolute top-10 right-6 border-4 border-rose-400 rounded-xl px-3 py-1 transform rotate-12 z-10 pointer-events-none"
        style={{ opacity: opacityPass }}
      >
        <span className="text-3xl font-black text-rose-400 uppercase tracking-wider">
          BOMB
        </span>
      </div>

      {/* プロフィール情報（下部） */}
      <div className="absolute bottom-0 left-0 right-0 p-5 pointer-events-none">
        {/* 名前・年齢 */}
        <div className="flex items-end justify-between mb-2">
          <div>
            <h2 className="text-2xl font-bold text-white leading-tight">
              {profile.username}
            </h2>
            <p className="text-white/80 text-base font-medium">
              {profile.age}歳
            </p>
          </div>
        </div>

        {/* インタレストタグ */}
        <div className="flex flex-wrap gap-1.5">
          {interestTags.map((tag, i) => (
            <span
              key={i}
              className="text-xs font-medium text-white/90 rounded-full px-2.5 py-1"
              style={{
                background: "rgba(255,255,255,0.18)",
                backdropFilter: "blur(8px)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
