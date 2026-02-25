"use client";

import { useState, useEffect } from "react";
import { Loading } from "@/components/common/Loading";

interface ConversationItem {
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

interface ConversationListProps {
  onSelectConversation?: (conversationId: string) => void;
}

export const ConversationList = ({
  onSelectConversation,
}: ConversationListProps) => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch("/api/v1/conversations");
        const data = await response.json();
        setConversations(data.conversations || []);
      } catch (error) {
        console.error("会話リスト取得エラー:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  if (loading) return <Loading message="メッセージを読み込み中..." />;

  if (conversations.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        <p>メッセージがありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSelectConversation?.(conv.id)}
          className="w-full p-4 hover:bg-gray-50 border-b border-gray-200 transition-colors text-left"
        >
          <div className="flex items-start gap-3">
            {conv.otherUser.avatar ? (
              <img
                src={conv.otherUser.avatar}
                alt={conv.otherUser.username}
                className="w-12 h-12 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                {conv.otherUser.username[0]}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  {conv.otherUser.username}
                </h3>
                {conv.unreadCount > 0 && (
                  <span className="bg-pink-500 text-white text-xs rounded-full px-2 py-1">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 truncate">
                {conv.lastMessage || "メッセージなし"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {conv.lastMessageTime
                  ? new Date(conv.lastMessageTime).toLocaleTimeString()
                  : ""}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};
