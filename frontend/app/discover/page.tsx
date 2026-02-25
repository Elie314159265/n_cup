"use client";

<<<<<<< HEAD
import { useState } from "react";
import { Canvas } from "@react-three/fiber";
=======
import { useState, useEffect } from "react";
>>>>>>> 9517289d6ad4b007e75b8abba4eb990917e302ed
import { SwipeCard } from "@/components/matching/SwipeCard";
import {
  MatchingFilter,
  FilterOptions,
} from "@/components/matching/MatchingFilter";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
<<<<<<< HEAD
import { Explosion } from "@/components/discover/bomb/Explosion";
=======
import { getDiscover, sendLike } from "@/actions/matching";
>>>>>>> 9517289d6ad4b007e75b8abba4eb990917e302ed

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
  const [, setFilters] = useState<FilterOptions>({});
  const [profiles, setProfiles] = useState(DUMMY_PROFILES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [explosions, setExplosions] = useState<{ id: number }[]>([]);
  const [showFadeOverlay, setShowFadeOverlay] = useState(false);
  const [fadeOpacity, setFadeOpacity] = useState(0);

  // マッチング候補を取得（バックエンド対応後に実データが入る）
  useEffect(() => {
    getDiscover({ limit: 20 })
      .then(({ users }) => {
        if (users.length > 0) {
          setProfiles(
            users.map((u) => ({
              id: String(u.id),
              username: u.profile?.display_name ?? u.username,
              age: u.profile?.age ?? 0,
              interests: u.profile?.interests?.join("・") ?? "",
              image: u.profile?.avatar_url ?? undefined,
              compatibility: u.compatibility_score ?? 0,
            })),
          );
        }
      })
      .catch(() => {
        // バックエンド未対応のためダミーデータを使用
      });
  }, []);

  const handleFilter = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleLike = () => {
    setIsModalOpen(true);
  };

  const handleSendRequest = async () => {
    const profile = profiles[currentIndex];
    // sendLike API を呼び出す
    try {
      await sendLike(Number(profile.id));
    } catch {
      // バックエンド未対応のためローカルに保存（デモ用）
      const likedUsers = JSON.parse(localStorage.getItem("likedUsers") || "[]");
      if (!likedUsers.find((u: Profile) => u.id === profile.id)) {
        likedUsers.push({ ...profile, message });
        localStorage.setItem("likedUsers", JSON.stringify(likedUsers));
      }
    }
    console.log("Liked:", profile.username, "Message:", message);
    setMessage("");
    setIsModalOpen(false);
    setCurrentIndex((prev) => prev + 1);
  };

  const handlePass = () => {
<<<<<<< HEAD
    console.log("Passed:", DUMMY_PROFILES[currentIndex].username);
    setExplosions((prev) => [...prev, { id: Date.now() }]);
  };

  const handleExplosionComplete = () => {
    // 爆発終了時は画面が真っ黒なので、オーバーレイを表示して状態を引き継ぐ
    setShowFadeOverlay(true);
    setFadeOpacity(1);

=======
    console.log("Passed:", profiles[currentIndex].username);
>>>>>>> 9517289d6ad4b007e75b8abba4eb990917e302ed
    setCurrentIndex((prev) => prev + 1);

    // 次のフレームでフェードイン（透明化）を開始
    setTimeout(() => {
      setFadeOpacity(0);
      setTimeout(() => setShowFadeOverlay(false), 1000); // アニメーション完了後に非表示
    }, 50);
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

      {/* 爆発エフェクトオーバーレイ */}
      <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          {explosions.map((explosion) => (
            <Explosion
              key={explosion.id}
              position={[0, 0, 0]}
              color="#ef4444"
              count={40}
              onComplete={handleExplosionComplete}
            />
          ))}
        </Canvas>
      </div>

      {/* フェードイン用オーバーレイ（暗転からの復帰） */}
      {showFadeOverlay && (
        <div
          className="fixed inset-0 z-[60] bg-black pointer-events-none transition-opacity duration-1000 ease-out"
          style={{ opacity: fadeOpacity }}
        />
      )}

      {/* スワイプカード */}
      <div className="flex flex-col items-center gap-6">
<<<<<<< HEAD
        {currentIndex < DUMMY_PROFILES.length && !showFadeOverlay ? (
=======
        {currentIndex < profiles.length ? (
>>>>>>> 9517289d6ad4b007e75b8abba4eb990917e302ed
          <>
            <div className="relative w-full max-w-sm">
              <SwipeCard
                profile={profiles[currentIndex]}
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
                {currentIndex + 1} / {profiles.length}
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
