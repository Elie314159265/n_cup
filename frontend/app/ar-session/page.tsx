"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { VoiceChatInterface } from "@/components/ai/VoiceChatInterface";
import { AREnvironmentSelector } from "@/components/ar-scene/AREnvironmentSelector";
import { AvatarViewer } from "@/components/ar-scene/AvatarViewer";
import { Loading } from "@/components/common/Loading";

export default function ARSessionPage() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("conversation_id");
  const [arSessionId, setArSessionId] = useState<string | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] =
    useState<string>("cafe");
  const [isStarted, setIsStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [partnerName, setPartnerName] = useState("AIアバター");

  useEffect(() => {
    const initARSession = async () => {
      if (!conversationId) return;

      setLoading(true);
      try {
        const response = await fetch("/api/v1/ar_sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversation_id: conversationId,
            environment_id: selectedEnvironment,
          }),
        });

        const data = await response.json();
        setArSessionId(data.id);
        setPartnerName(data.partner_name || "AIアバター");
      } catch (error) {
        console.error("ARセッション初期化エラー:", error);
      } finally {
        setLoading(false);
      }
    };

    initARSession();
  }, [conversationId, selectedEnvironment]);

  if (!conversationId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-600">
        会話が見つかりません
      </div>
    );
  }

  if (loading) {
    return <Loading message="ARセッションを準備中..." />;
  }

  if (!isStarted) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AR空間での会話
          </h1>
          <p className="text-gray-600">
            環境を選んで、AIアバターとの会話を開始しましょう
          </p>
        </div>

        <AREnvironmentSelector
          onSelect={(envId) => {
            setSelectedEnvironment(envId);
            setIsStarted(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AR表示エリア */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">AR空間</h2>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <AvatarViewer
              avatarData={{
                hairStyle: "long",
                hairColor: "brown",
                skinColor: "light",
                clothing: "casual",
                bodyType: "B",
              }}
            />
          </div>
        </div>

        {/* 音声チャットインターフェース */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">会話</h2>
          <div className="bg-white rounded-lg shadow-lg p-6">
            {arSessionId && (
              <VoiceChatInterface
                arSessionId={arSessionId}
                partnerName={partnerName}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
