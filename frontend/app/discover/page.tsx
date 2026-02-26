"use client";

import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import Link from "next/link";
import { SwipeCard } from "@/components/matching/SwipeCard";
import { Explosion } from "@/components/discover/bomb/Explosion";
import { HeartExplosion } from "@/components/discover/match/Heart";
import { Bomb, Heart, CheckCircle2, Send, Search } from "lucide-react";
import { ExplosionOverlay } from "@/components/discover/bomb/Explosion";
import {
  MatchingFilter,
  FilterOptions,
} from "@/components/matching/MatchingFilter";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { getDiscover, sendLike } from "@/actions/matching";

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
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop",
  },
  {
    id: "2",
    username: "ゆうた",
    age: 27,
    interests: "登山・写真撮影・料理",
    compatibility: 85,
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop",
  },
  {
    id: "3",
    username: "はな",
    age: 22,
    interests: "アニメ・ゲーム・音楽フェス",
    compatibility: 78,
    image:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=600&fit=crop",
  },
  {
    id: "4",
    username: "けんじ",
    age: 29,
    interests: "サッカー・映画・筋トレ",
    compatibility: 70,
    image:
      "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=600&fit=crop",
  },
  {
    id: "5",
    username: "みな",
    age: 25,
    interests: "ヨガ・スイーツ・海外ドラマ",
    compatibility: 88,
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=600&fit=crop",
  },
];

export default function DiscoverPage() {
  const [, setFilters] = useState<FilterOptions>({});
  const [profiles, setProfiles] = useState(DUMMY_PROFILES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [showExplosion, setShowExplosion] = useState(false);
  const [showHeart, setShowHeart] = useState(false);

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
    setShowHeart(true);
    setTimeout(() => {
      setIsModalOpen(true);
    }, 1200);
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
    console.log("Passed:", profiles[currentIndex].username);
    setShowExplosion(true);
  };

  const handleExplosionComplete = () => {
    setShowExplosion(false);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleHeartComplete = () => {
    setShowHeart(false);
  };

  return (
    <div className="page-bg min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 爆発エフェクト（左スワイプ時） */}
        {showExplosion && (
          <ExplosionOverlay
            partnerName={profiles[currentIndex]?.username}
            onComplete={handleExplosionComplete}
            zIndex={50}
          />
        )}
        {/* ハートエフェクト（右スワイプ時） */}
        {showHeart && (
          <div className="fixed inset-0 z-50 pointer-events-none">
            <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
              <HeartExplosion onComplete={handleHeartComplete} />
            </Canvas>
          </div>
        )}

        <div className="text-center mb-10">
          <h1 className="text-3xl font-black gradient-text mb-2">
            気になる相手を探す
          </h1>
          <p className="text-gray-500 text-sm mb-4">
            スワイプしてあなたの理想の人を見つけましょう
          </p>
          <Link
            href="/ar-discover"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              boxShadow: "0 4px 16px rgba(124,58,237,0.4)",
            }}
          >
            📷 ARで見る
          </Link>
        </div>

        {/* フィルター */}
        <div className="mb-8 flex justify-center">
          <MatchingFilter onFilter={handleFilter} />
        </div>

        {/* スワイプカード */}
        <div className="flex flex-col items-center gap-6">
          {currentIndex < profiles.length ? (
            <>
              <div className="relative w-full max-w-sm">
                <SwipeCard
                  profile={profiles[currentIndex]}
                  onLike={handleLike}
                  onPass={handlePass}
                />
              </div>
              <div className="flex items-center justify-between w-full max-w-xs px-4">
                <div className="flex flex-col items-center">
                  <span
                    className="text-2xl font-black"
                    style={{
                      color: "#ef4444",
                      textShadow: "0 0 12px rgba(239,68,68,0.4)",
                    }}
                  >
                    ←
                  </span>
                  <span className="text-xs font-bold text-red-400 tracking-wider flex items-center gap-0.5">
                    <Bomb size={11} /> BOMB
                  </span>
                </div>
                <div
                  className="card-sm px-4 py-1.5 text-xs font-bold"
                  style={{ color: "#8b5cf6" }}
                >
                  {currentIndex + 1} / {profiles.length}
                </div>
                <div className="flex flex-col items-center">
                  <span
                    className="text-2xl font-black"
                    style={{
                      color: "#10b981",
                      textShadow: "0 0 12px rgba(16,185,129,0.4)",
                    }}
                  >
                    →
                  </span>
                  <span className="text-xs font-bold text-emerald-500 tracking-wider flex items-center gap-0.5">
                    LIKE <Heart size={11} />
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="card p-10 text-center">
              <CheckCircle2
                size={36}
                className="mx-auto mb-3 text-violet-400"
              />
              <p className="font-bold text-gray-700 text-lg">
                全て確認しました！
              </p>
              <p className="text-sm text-gray-400 mt-2">
                明日もまたチェックしてね
              </p>
            </div>
          )}
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={handleSendRequest}
          title="メッセージを送信"
        >
          <div className="space-y-4">
            <p className="text-gray-500 text-sm">
              相手に一言メッセージを送りましょう！
            </p>
            <textarea
              className="w-full p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all"
              style={{
                border: "1px solid rgba(139,92,246,0.25)",
                background: "rgba(245,243,255,0.8)",
              }}
              rows={4}
              placeholder="例：はじめまして！趣味が合いそうなのでお話ししたいです。"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button onClick={handleSendRequest} className="w-full">
              <Send size={14} className="mr-1.5" /> マッチング依頼送信
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
