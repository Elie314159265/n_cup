"use client";

import { useState } from "react";
import { SwipeCard } from "@/components/matching/SwipeCard";
import { MatchingFilter } from "@/components/matching/MatchingFilter";

interface Profile {
  id: string;
  username: string;
  age: number;
  interests: string;
  image?: string;
  compatibility: number;
}

const DUMMY_PROFILES: Profile[] = [
  {
    id: "1",
    username: "さくら",
    age: 24,
    interests: "読書・カフェ巡り・旅行",
    compatibility: 92,
  },
  {
    id: "2",
    username: "ゆうた",
    age: 27,
    interests: "登山・写真撮影・料理",
    compatibility: 85,
  },
  {
    id: "3",
    username: "はな",
    age: 22,
    interests: "アニメ・ゲーム・音楽フェス",
    compatibility: 78,
  },
  {
    id: "4",
    username: "けんじ",
    age: 29,
    interests: "サッカー・映画・筋トレ",
    compatibility: 70,
  },
  {
    id: "5",
    username: "みな",
    age: 25,
    interests: "ヨガ・スイーツ・海外ドラマ",
    compatibility: 88,
  },
];

export default function DiscoverPage() {
  const [filters, setFilters] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleFilter = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleLike = () => {
    console.log("Liked:", DUMMY_PROFILES[currentIndex].username);
    setCurrentIndex((prev) => prev + 1);
  };

  const handlePass = () => {
    console.log("Passed:", DUMMY_PROFILES[currentIndex].username);
    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          気になる相手を探す
        </h1>
        <p className="text-gray-600">
          スワイプしてあなたの理想の人を見つけましょう
        </p>
      </div>

      {/* フィルター */}
      <div className="mb-8 flex justify-center">
        <MatchingFilter onFilter={handleFilter} />
      </div>

      {/* スワイプカード */}
      <div className="flex flex-col items-center gap-6">
        {currentIndex < DUMMY_PROFILES.length ? (
          <>
            <div className="w-full max-w-sm">
              <SwipeCard
                profile={DUMMY_PROFILES[currentIndex]}
                onLike={handleLike}
                onPass={handlePass}
              />
            </div>
            <div className="text-sm text-gray-500">
              {currentIndex + 1} / {DUMMY_PROFILES.length}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-12 text-center">
            <div>
              <p className="text-2xl mb-4">🎉</p>
              <p className="text-gray-600">全て確認しました！</p>
              <p className="text-sm text-gray-500 mt-2">
                明日もまたチェックしてね
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
