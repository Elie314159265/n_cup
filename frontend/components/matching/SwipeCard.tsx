"use client";

import React from "react";

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
  return (
    <div className="relative w-full h-96 bg-white rounded-2xl shadow-2xl overflow-hidden">
      {/* プロフィール画像 */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50">
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
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
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
      <div className="absolute top-4 right-4 flex gap-3">
        <button
          onClick={onPass}
          className="w-12 h-12 rounded-full bg-white/80 hover:bg-white shadow-lg flex items-center justify-center text-2xl transition-all"
        >
          ✕
        </button>
        <button
          onClick={onLike}
          className="w-12 h-12 rounded-full bg-pink-500 hover:bg-pink-600 shadow-lg flex items-center justify-center text-2xl transition-all"
        >
          ❤️
        </button>
      </div>
    </div>
  );
};
