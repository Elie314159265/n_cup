"use client";

import React, { useState, useEffect } from "react";

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
    null
  );
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    // プロフィール切り替え時に右側からスワイプインさせる
    setIsResetting(true);
    setDragOffset({ x: 1000, y: 0 }); // 一旦右側に配置
    setIsAnimating(false);

    const timer = setTimeout(() => {
      setIsResetting(false);
      setDragOffset({ x: 0, y: 0 }); // アニメーションしながら中央へ
    }, 50);
    return () => clearTimeout(timer);
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

  return (
    <div
      className="relative w-full h-96 bg-white rounded-2xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none"
      style={{
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
      {/* スタンプ */}
      <div
        className="absolute top-10 left-1/2 -translate-x-1/2 border-4 border-green-500 rounded-lg p-2 transform -rotate-12 z-10 pointer-events-none"
        style={{ opacity: opacityLike }}
      >
        <span className="text-4xl font-bold text-green-500 uppercase">
          LIKE
        </span>
      </div>
      <div
        className="absolute top-10 left-1/2 -translate-x-1/2 border-4 border-red-500 rounded-lg p-2 transform rotate-12 z-10 pointer-events-none"
        style={{ opacity: opacityPass }}
      >
        <span className="text-4xl font-bold text-red-500 uppercase">爆破</span>
      </div>

      {/* プロフィール画像 */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 pointer-events-none">
        {profile.image ? (
          <img
            src={profile.image}
            alt={profile.username}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-pink-300 to-purple-300 flex items-center justify-center">
            <span className="text-6xl">👤</span>
          </div>
        )}
      </div>

      {/* プロフィール情報 */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white pointer-events-none">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">{profile.username}</h2>
            <p className="text-lg opacity-90">{profile.age}歳</p>
            <p className="text-sm opacity-75 mt-2">{profile.interests}</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-75">相性</p>
            <p className="text-2xl font-bold text-pink-400">
              {profile.compatibility}%
            </p>
          </div>
        </div>
      </div>

      {/* アクションボタン */}
      <div
        className="absolute top-4 right-4 flex gap-3"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      ></div>
    </div>
  );
};
