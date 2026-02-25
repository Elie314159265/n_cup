"use client";

import React, { useState, useEffect } from "react";
import { SwipeCard } from "./SwipeCard";
import { Loading } from "@/components/common/Loading";

interface Profile {
  id: string;
  username: string;
  age: number;
  interests: string;
  image?: string;
  compatibility: number;
}

interface SwipeContainerProps {
  onLike?: (profile: Profile) => void;
  onPass?: (profile: Profile) => void;
}

export const SwipeContainer = ({ onLike, onPass }: SwipeContainerProps) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await fetch("/api/v1/discover");
        const data = await response.json();
        setProfiles(data.profiles || []);
      } catch (error) {
        console.error("プロフィール取得エラー:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  const handleLike = async () => {
    const profile = profiles[currentIndex];
    try {
      await fetch("/api/v1/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liked_user_id: profile.id }),
      });
      onLike?.(profile);
    } catch (error) {
      console.error("いいねエラー:", error);
    }
    moveToNext();
  };

  const handlePass = () => {
    onPass?.(profiles[currentIndex]);
    moveToNext();
  };

  const moveToNext = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (loading) return <Loading message="プロフィールを読み込み中..." />;

  if (profiles.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-600">
        <p>表示するプロフィールがありません</p>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <div>
          <p className="text-2xl mb-4">🎉</p>
          <p className="text-gray-600">全て確認しました！</p>
          <p className="text-sm text-gray-500 mt-2">明日もまたチェックしてね</p>
        </div>
      </div>
    );
  }

  const profile = profiles[currentIndex];

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full max-w-sm">
        <SwipeCard profile={profile} onLike={handleLike} onPass={handlePass} />
      </div>

      <div className="text-sm text-gray-500">
        {currentIndex + 1} / {profiles.length}
      </div>
    </div>
  );
};
