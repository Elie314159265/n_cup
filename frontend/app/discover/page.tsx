"use client";

import { useState } from "react";
import { SwipeCard } from "@/components/matching/SwipeCard";
import { MatchingFilter } from "@/components/matching/MatchingFilter";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState("");

  const handleFilter = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleLike = () => {
    setIsModalOpen(true);
  };

  const handleSendRequest = () => {
    const profile = DUMMY_PROFILES[currentIndex];
    // ローカルストレージに保存（デモ用）
    const likedUsers = JSON.parse(localStorage.getItem("likedUsers") || "[]");
    if (!likedUsers.find((u: Profile) => u.id === profile.id)) {
      likedUsers.push({ ...profile, message });
      localStorage.setItem("likedUsers", JSON.stringify(likedUsers));
    }
    console.log("Liked:", profile.username, "Message:", message);
    setMessage("");
    setIsModalOpen(false);
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
            <div className="relative w-full max-w-sm">
              <SwipeCard
                profile={DUMMY_PROFILES[currentIndex]}
                onLike={handleLike}
                onPass={handlePass}
              />
            </div>
            <div className="flex items-center justify-between w-full max-w-xs px-4">
              <div className="flex flex-col items-center opacity-60">
                <span className="text-3xl font-bold text-red-500">←</span>
                <span className="text-xs font-bold text-red-500">爆破</span>
              </div>
              <div className="text-sm text-gray-500 font-medium">
                {currentIndex + 1} / {DUMMY_PROFILES.length}
              </div>
              <div className="flex flex-col items-center opacity-60">
                <span className="text-3xl font-bold text-green-500">→</span>
                <span className="text-xs font-bold text-green-500">LIKE</span>
              </div>
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

      {/* メッセージ入力モーダル */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleSendRequest}
        title="メッセージを送信"
      >
        <div className="space-y-4">
          <p className="text-gray-600">相手に一言メッセージを送りましょう！</p>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            rows={4}
            placeholder="例：はじめまして！趣味が合いそうなのでお話ししたいです。"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button onClick={handleSendRequest} className="w-full">
            マッチング依頼送信
          </Button>
        </div>
      </Modal>
    </div>
  );
}
