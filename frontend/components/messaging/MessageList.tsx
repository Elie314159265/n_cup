"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Loading } from "@/components/common/Loading";

interface Message {
  id: string;
  sender: "user" | "other";
  content: string;
  timestamp: Date;
  type: "text" | "image" | "voice";
  mediaUrl?: string;
}

interface MessageListProps {
  conversationId: string;
}

export const MessageList = ({ conversationId }: MessageListProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `/api/v1/conversations/${conversationId}/messages`
        );
        const data = await response.json();
        setMessages(data.messages || []);
      } catch (error) {
        console.error("メッセージ取得エラー:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) return <Loading message="メッセージを読み込み中..." />;

  return (
    <div className="flex flex-col gap-4 overflow-y-auto max-h-96 p-4 bg-gray-50 rounded-lg">
      {messages.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p>メッセージがありません</p>
        </div>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                message.sender === "user"
                  ? "bg-pink-500 text-white rounded-br-none"
                  : "bg-white text-gray-900 rounded-bl-none border border-gray-200"
              }`}
            >
              {message.type === "text" && <p>{message.content}</p>}
              {message.type === "image" && (
                <Image
                  src={message.mediaUrl!}
                  alt="shared"
                  width={0}
                  height={0}
                  sizes="100vw"
                  style={{ width: "100%", height: "auto" }}
                  className="rounded"
                />
              )}
              {message.type === "voice" && (
                <audio src={message.mediaUrl} controls className="w-full" />
              )}
              <p className="text-xs opacity-75 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
