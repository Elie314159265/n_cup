"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";
import { sendMessage } from "@/actions/conversations";

interface MessageInputProps {
  conversationId: string;
  onSend?: (message: string) => void;
}

export const MessageInput = ({ conversationId, onSend }: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;

    setSending(true);
    try {
      await sendMessage(Number(conversationId), {
        message_type: "text",
        content: message,
      });
      onSend?.(message);
      setMessage("");
    } catch (error) {
      console.error("メッセージ送信エラー:", error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 p-4 bg-white border-t border-gray-200">
      <div className="flex gap-2">
        <button className="text-2xl hover:opacity-70">🖼️</button>
        <button className="text-2xl hover:opacity-70">🎤</button>
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="メッセージを入力..."
        rows={1}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
      />

      <Button onClick={handleSend} loading={sending} disabled={!message.trim()}>
        送信
      </Button>
    </div>
  );
};
