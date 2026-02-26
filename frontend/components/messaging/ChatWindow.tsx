"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { Loading } from "@/components/common/Loading";
import { getConversation } from "@/actions/conversations";

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    username: string;
    avatar?: string;
  };
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
}

interface ChatWindowProps {
  conversationId: string;
}

export const ChatWindow = ({ conversationId }: ChatWindowProps) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const { conversation: conv } = await getConversation(
          Number(conversationId),
        );
        setConversation({
          id: String(conv.id),
          otherUser: {
            id: String(conv.match_id),
            username: `ユーザー ${conv.match_id}`,
          },
          unreadCount: 0,
        });
      } catch (error) {
        console.error("会話取得エラー:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [conversationId]);

  if (loading) return <Loading message="チャットを読み込み中..." />;

  if (!conversation) {
    return (
      <div className="text-center text-gray-500 py-12">
        会話が見つかりません
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200">
        {conversation.otherUser.avatar ? (
          <Image
            src={conversation.otherUser.avatar}
            alt={conversation.otherUser.username}
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white">
            {conversation.otherUser.username[0]}
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">
            {conversation.otherUser.username}
          </h3>
          <p className="text-xs text-gray-500">オンライン</p>
        </div>
        <Link
          href={`/ar-session?conversation_id=${conversationId}`}
          className="flex items-center gap-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          🥽 ARチャット
        </Link>
        <button className="text-2xl ml-1">⋯</button>
      </div>

      {/* メッセージリスト */}
      <div className="flex-1 overflow-hidden">
        <MessageList conversationId={conversationId} />
      </div>

      {/* メッセージ入力 */}
      <MessageInput conversationId={conversationId} />
    </div>
  );
};
