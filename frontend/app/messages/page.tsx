"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ConversationList } from "@/components/messaging/ConversationList";
import { ChatWindow } from "@/components/messaging/ChatWindow";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";

interface LikedUser {
  id: string;
  username: string;
  image?: string;
}

interface Conversation {
  id: string;
  partner: {
    id: string;
    username: string;
    image: string;
    isOnline?: boolean;
    isAi?: boolean;
  };
  lastMessage: string;
  unreadCount: number;
  updatedAt: string;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  type: "text" | "image" | "audio";
  isRead: boolean;
}

interface RequestUser {
  id: string;
  username: string;
  age: number;
  interests: string;
  compatibility: number;
  image: string;
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
    bio: "週末はよくキャンプに行きます。自然が好きです。",
    message: "DIYについて語りましょう！",
  },
];

const DUMMY_CONVERSATIONS: Conversation[] = [
  {
    id: "c1",
    partner: {
      id: "u1",
      username: "さくら",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
      isOnline: true,
    },
    lastMessage: "今度の週末、空いてますか？",
    unreadCount: 2,
    updatedAt: "2023-10-25T10:30:00",
  },
  {
    id: "c2",
    partner: {
      id: "u2",
      username: "AIアバター（ミカ）",
      image:
        "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=400&h=400&fit=crop",
      isAi: true,
    },
    lastMessage: "はじめまして！ミカです。よろしくお願いします。",
    unreadCount: 0,
    updatedAt: "2023-10-24T18:00:00",
  },
  {
    id: "c3",
    partner: {
      id: "u3",
      username: "ケンジ",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
      isOnline: false,
    },
    lastMessage: "了解です！",
    unreadCount: 0,
    updatedAt: "2023-10-23T09:15:00",
  },
];

const DUMMY_MESSAGES: Record<string, Message[]> = {
  c1: [
    {
      id: "m1",
      senderId: "u1",
      content: "はじめまして！マッチングありがとうございます。",
      timestamp: "2023-10-25T10:00:00",
      type: "text",
      isRead: true,
    },
    {
      id: "m2",
      senderId: "me",
      content: "こちらこそ！趣味が合いそうだなと思っていいねしました。",
      timestamp: "2023-10-25T10:05:00",
      type: "text",
      isRead: true,
    },
    {
      id: "m3",
      senderId: "u1",
      content: "嬉しいです！カフェ巡りがお好きなんですよね？",
      timestamp: "2023-10-25T10:10:00",
      type: "text",
      isRead: true,
    },
    {
      id: "m4",
      senderId: "u1",
      content: "今度の週末、空いてますか？",
      timestamp: "2023-10-25T10:30:00",
      type: "text",
      isRead: false,
    },
  ],
  c2: [
    {
      id: "m1",
      senderId: "u2",
      content: "はじめまして！ミカです。よろしくお願いします。",
      timestamp: "2023-10-24T18:00:00",
      type: "text",
      isRead: true,
    },
  ],
  c3: [
    {
      id: "m1",
      senderId: "me",
      content: "こんにちは",
      timestamp: "2023-10-23T09:00:00",
      type: "text",
      isRead: true,
    },
    {
      id: "m2",
      senderId: "u3",
      content: "了解です！",
      timestamp: "2023-10-23T09:15:00",
      type: "text",
      isRead: true,
    },
  ],
};

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [likedUsers, setLikedUsers] = useState<LikedUser[]>([]);
  const [requests, setRequests] = useState(DUMMY_REQUESTS);
  const [selectedRequest, setSelectedRequest] = useState<RequestUser | null>(
    null
  );

  useEffect(() => {
    // ローカルストレージからいいねしたユーザーを取得
    const users = JSON.parse(localStorage.getItem("likedUsers") || "[]");
    setTimeout(() => setLikedUsers(users), 0);
  }, []);

  const handleApprove = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    setSelectedRequest(null);
    alert("マッチングしました！");
  };

  const handleReject = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    setSelectedRequest(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">メッセージ</h1>
        <p className="text-gray-600">マッチングした相手とチャット</p>
      </div>

      {/* マッチング待ちリスト */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">マッチング待ち</h2>
        <div className="bg-white rounded-lg shadow p-4 min-h-[120px]">
          {likedUsers.length > 0 ? (
            <div className="flex gap-6 overflow-x-auto pb-2">
              {likedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col items-center min-w-[80px]"
                >
                  <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden mb-2 border-2 border-pink-200 shadow-sm relative">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.username}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        👤
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-gray-700 font-medium truncate w-full text-center">
                    {user.username}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              まだ「いいね」した相手がいません
            </div>
          )}
        </div>
      </div>

      {/* マッチング依頼リスト */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          マッチング依頼{" "}
          <span className="text-sm font-normal text-gray-500">
            ({requests.length})
          </span>
        </h2>
        <div className="bg-white rounded-lg shadow p-4 min-h-[120px]">
          {requests.length > 0 ? (
            <div className="flex gap-6 overflow-x-auto pb-2">
              {requests.map((req) => (
                <button
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className="flex flex-col items-center min-w-[80px] group"
                >
                  <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden mb-2 border-2 border-purple-200 shadow-sm group-hover:border-purple-400 transition-colors relative relative">
                    {req.image ? (
                      <Image
                        src={req.image}
                        alt={req.username}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        👤
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
                  </div>
                  <span className="text-sm text-gray-700 font-medium truncate w-full text-center">
                    {req.username}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              新しい依頼はありません
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
        {/* 会話リスト */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-y-auto">
          <ConversationList
            conversations={DUMMY_CONVERSATIONS}
            onSelectConversation={setSelectedConversation}
            selectedId={selectedConversation}
          />
        </div>

        {/* チャットウィンドウ */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <ChatWindow
              conversationId={selectedConversation}
              messages={DUMMY_MESSAGES[selectedConversation] || []}
              partner={
                DUMMY_CONVERSATIONS.find((c) => c.id === selectedConversation)
                  ?.partner
              }
            />
          ) : (
            <div className="bg-white rounded-lg shadow h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p className="text-lg">会話を選択してください</p>
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
            <div className="w-32 h-32 rounded-full bg-gray-100 overflow-hidden mb-4 border-4 border-white shadow-lg relative">
              {selectedRequest.image ? (
                <Image
                  src={selectedRequest.image}
                  alt={selectedRequest.username}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">
                  👤
                </div>
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {selectedRequest.username}
            </h3>
            <p className="text-gray-600 mb-4">{selectedRequest.age}歳</p>

            {/* メッセージ表示 */}
            {selectedRequest.message && (
              <div className="w-full bg-pink-50 p-4 rounded-lg border border-pink-100 relative mb-6">
                <div className="absolute -top-3 left-4 bg-pink-100 text-pink-600 text-xs px-2 py-1 rounded-full font-bold">
                  メッセージ
                </div>
                <p className="text-gray-800 mt-1">
                  &quot;{selectedRequest.message}&quot;
                </p>
              </div>
            )}

            <div className="w-full space-y-4 mb-8 text-left">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">趣味</p>
                <p className="text-gray-800">{selectedRequest.interests}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">自己紹介</p>
                <p className="text-gray-800">{selectedRequest.bio}</p>
              </div>
              <div className="flex items-center justify-between bg-pink-50 p-3 rounded-lg">
                <span className="text-sm font-medium text-pink-700">相性</span>
                <span className="text-xl font-bold text-pink-600">
                  {selectedRequest.compatibility}%
                </span>
              </div>
            </div>

            <div className="flex gap-4 w-full">
              <Button
                variant="secondary"
                onClick={() => handleReject(selectedRequest.id)}
                className="flex-1 justify-center"
              >
                💣爆破💣
              </Button>
              <Button
                onClick={() => handleApprove(selectedRequest.id)}
                className="flex-1 justify-center"
              >
                承認する
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
