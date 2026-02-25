"use client";

import { useState } from "react";
import { ConversationList } from "@/components/messaging/ConversationList";
import { ChatWindow } from "@/components/messaging/ChatWindow";

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">メッセージ</h1>
        <p className="text-gray-600">マッチングした相手とチャット</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
        {/* 会話リスト */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-y-auto">
          <ConversationList onSelectConversation={setSelectedConversation} />
        </div>

        {/* チャットウィンドウ */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <ChatWindow conversationId={selectedConversation} />
          ) : (
            <div className="bg-white rounded-lg shadow h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p className="text-lg">会話を選択してください</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
