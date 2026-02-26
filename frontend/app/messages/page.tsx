"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { User, Heart, Mail, MessageCircle, Bomb, Send } from "lucide-react";
import { ConversationList } from "@/components/messaging/ConversationList";
import { ChatWindow } from "@/components/messaging/ChatWindow";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { ExplosionOverlay } from "@/components/discover/bomb/Explosion";
import { MatchingCelebration } from "@/components/discover/bomb/MatchingCelebration";
import { getMatches } from "@/actions/matching";
import { getConversations } from "@/actions/conversations";

interface LikedUser {
  id: string;
  username: string;
  image?: string;
}

interface RequestUser {
  id: string;
  username: string;
  age: number;
  interests: string;
  compatibility: number;
  image?: string;
  bio: string;
  message: string;
}

const DUMMY_REQUESTS = [
  {
    id: "r1",
    username: "あや",
    age: 23,
    interests: "映画鑑賞・料理",
    compatibility: 88,
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    bio: "はじめまして！映画と美味しいものが大好きです。よろしくお願いします！",
    message: "はじめまして！映画の趣味が合いそうですね。ぜひお話ししたいです！",
  },
  {
    id: "r2",
    username: "なお",
    age: 28,
    interests: "キャンプ・DIY",
    compatibility: 75,
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    bio: "週末はよくキャンプに行きます。自然が好きです。",
    message: "DIYについて語りましょう！",
  },
];

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [likedUsers, setLikedUsers] = useState<LikedUser[]>([]);
  const [requests, setRequests] = useState(DUMMY_REQUESTS);
  const [selectedRequest, setSelectedRequest] = useState<RequestUser | null>(
    null,
  );
  const [showExplosion, setShowExplosion] = useState(false);
  const [pendingRejectId, setPendingRejectId] = useState<string | null>(null);
  const [explodingPartnerName, setExplodingPartnerName] = useState<string>("");
  const [showMatchingCelebration, setShowMatchingCelebration] = useState(false);
  const [matchingPartnerName, setMatchingPartnerName] = useState<string>("");

  useEffect(() => {
    // ローカルストレージからいいねしたユーザーを取得（デモ用フォールバック）
    const users = JSON.parse(localStorage.getItem("likedUsers") || "[]");
    setTimeout(() => setLikedUsers(users), 0);

    // マッチング一覧を取得
    getMatches()
      .then(({ matches }) => {
        // matched済みのユーザーをマッチング待ちリストに追加
        const matchedUsers: LikedUser[] = matches.map((m) => ({
          id: String(m.partner.id),
          username: m.partner.display_name ?? m.partner.username,
          image: m.partner.avatar_url ?? undefined,
        }));
        if (matchedUsers.length > 0) setLikedUsers(matchedUsers);
      })
      .catch(() => {
        // バックエンド未対応のためスキップ
      });

    // 会話一覧を取得（ConversationListコンポーネント内で個別に取得するためここではスキップ）
    getConversations().catch(() => {
      // バックエンド未対応のためスキップ
    });
  }, []);

  const handleApprove = (id: string) => {
    const req = requests.find((r) => r.id === id);
    setRequests((prev) => prev.filter((r) => r.id !== id));
    setSelectedRequest(null);
    setMatchingPartnerName(req?.username ?? "");
    setShowMatchingCelebration(true);
  };

  const handleReject = (id: string) => {
    const req = requests.find((r) => r.id === id);
    setExplodingPartnerName(req?.username ?? "");
    setPendingRejectId(id);
    setShowExplosion(true);
  };

  const handleExplosionComplete = () => {
    setShowExplosion(false);
    if (pendingRejectId) {
      setRequests((prev) => prev.filter((r) => r.id !== pendingRejectId));
      setPendingRejectId(null);
    }
    setSelectedRequest(null);
  };

  return (
    <div className="page-bg min-h-screen">
      {/* 爆発エフェクト */}
      {showExplosion && (
        <ExplosionOverlay
          partnerName={explodingPartnerName}
          onComplete={handleExplosionComplete}
        />
      )}
      {/* マッチング成立エフェクト */}
      {showMatchingCelebration && (
        <MatchingCelebration
          partnerName={matchingPartnerName}
          onComplete={() => setShowMatchingCelebration(false)}
        />
      )}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black gradient-text mb-1">メッセージ</h1>
          <p className="text-gray-500 text-sm">マッチングした相手とチャット</p>
        </div>

        {/* マッチング待ちリスト */}
        <div className="mb-6">
          <h2 className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Heart size={11} /> マッチング待ち
          </h2>
          <div className="card p-4 min-h-27.5">
            {likedUsers.length > 0 ? (
              <div className="flex gap-6 overflow-x-auto pb-2">
                {likedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col items-center min-w-18"
                  >
                    <div
                      className="w-14 h-14 rounded-2xl bg-gray-100 overflow-hidden mb-2 shadow-sm relative"
                      style={{ border: "2px solid rgba(236,72,153,0.3)" }}
                    >
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt={user.username}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User size={22} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-600 font-medium truncate w-full text-center">
                      {user.username}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                まだ「いいね」した相手がいません
              </div>
            )}
          </div>
        </div>

        {/* マッチング依頼リスト */}
        <div className="mb-6">
          <h2 className="text-xs font-bold text-pink-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Mail size={11} /> マッチング依頼{" "}
            {requests.length > 0 && (
              <span
                className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-black"
                style={{
                  background: "linear-gradient(135deg,#ec4899,#8b5cf6)",
                }}
              >
                {requests.length}
              </span>
            )}
          </h2>
          <div className="card p-4 min-h-27.5">
            {requests.length > 0 ? (
              <div className="flex gap-6 overflow-x-auto pb-2">
                {requests.map((req) => (
                  <button
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className="flex flex-col items-center min-w-18 group"
                  >
                    <div
                      className="w-14 h-14 rounded-2xl bg-gray-100 overflow-hidden mb-2 shadow-sm group-hover:shadow-md transition-all relative"
                      style={{ border: "2px solid rgba(139,92,246,0.3)" }}
                    >
                      {req.image ? (
                        <Image
                          src={req.image}
                          alt={req.username}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User size={22} className="text-gray-400" />
                        </div>
                      )}
                      <div
                        className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white"
                        style={{
                          background: "linear-gradient(135deg,#ec4899,#8b5cf6)",
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 font-medium truncate w-full text-center">
                      {req.username}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                新しい依頼はありません
              </div>
            )}
          </div>
        </div>

        {/* 会話エリア */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
          <div className="lg:col-span-1 card overflow-y-auto">
            <ConversationList
              onSelectConversation={(id) => setSelectedConversation(id)}
            />
          </div>
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <ChatWindow conversationId={selectedConversation} />
            ) : (
              <div className="card h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <MessageCircle
                    size={32}
                    className="mx-auto mb-3 text-gray-200"
                  />
                  <p className="text-sm font-medium">会話を選択してください</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* プロフィール詳細モーダル */}
        <Modal
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          title="プロフィール詳細"
        >
          {selectedRequest && (
            <div className="flex flex-col items-center">
              <div
                className="w-28 h-28 rounded-2xl bg-gray-100 overflow-hidden mb-4 shadow-md relative"
                style={{ border: "4px solid white" }}
              >
                {selectedRequest.image ? (
                  <Image
                    src={selectedRequest.image}
                    alt={selectedRequest.username}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={36} className="text-gray-300" />
                  </div>
                )}
              </div>
              <h3 className="text-xl font-black gradient-text">
                {selectedRequest.username}
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                {selectedRequest.age}歳
              </p>

              {selectedRequest.message && (
                <div
                  className="w-full p-4 rounded-xl relative mb-5"
                  style={{
                    background: "rgba(236,72,153,0.07)",
                    border: "1px solid rgba(236,72,153,0.18)",
                  }}
                >
                  <div
                    className="absolute -top-3 left-4 px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{
                      background: "linear-gradient(135deg,#ec4899,#8b5cf6)",
                      color: "white",
                    }}
                  >
                    メッセージ
                  </div>
                  <p className="text-gray-700 mt-1 text-sm">
                    &quot;{selectedRequest.message}&quot;
                  </p>
                </div>
              )}

              <div className="w-full space-y-3 mb-7 text-left">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 mb-1">趣味</p>
                  <p className="text-gray-800 text-sm">
                    {selectedRequest.interests}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 mb-1">
                    自己紹介
                  </p>
                  <p className="text-gray-800 text-sm">{selectedRequest.bio}</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400">相性</span>
                  <span className="text-lg font-black gradient-text">
                    {selectedRequest.compatibility}%
                  </span>
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <Button
                  variant="secondary"
                  onClick={() => handleReject(selectedRequest.id)}
                  className="flex-1 justify-center"
                >
                  <Bomb size={16} />
                  BOMB
                </Button>
                <Button
                  onClick={() => handleApprove(selectedRequest.id)}
                  className="flex-1 justify-center"
                >
                  <Send size={16} />
                  承認する
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
