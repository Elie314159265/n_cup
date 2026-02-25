"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { VoiceChatInterface } from "@/components/ai/VoiceChatInterface";
import { AREnvironmentSelector } from "@/components/ar-scene/AREnvironmentSelector";
import { AvatarViewer } from "@/components/ar-scene/AvatarViewer";
import { getConversation } from "@/actions/conversations";
import { getMatches } from "@/actions/matching";
import { createArSession } from "@/actions/ar-sessions";
import type { MatchPartner } from "@/types/matching";
import type { ArSession } from "@/types/ar-session";

function ARSessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationIdStr = searchParams.get("conversation_id");
  const conversationId = conversationIdStr ? parseInt(conversationIdStr, 10) : null;

  const [partnerProfile, setPartnerProfile] = useState<MatchPartner | null>(null);
  const [arSession, setArSession] = useState<ArSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [isStarted, setIsStarted] = useState(false);

  // 会話データとパートナープロフィールを取得
  useEffect(() => {
    if (!conversationId) {
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        const [{ conversation }, { matches }] = await Promise.all([
          getConversation(conversationId),
          getMatches(),
        ]);

        const match = matches.find((m) => m.id === conversation.match_id);
        if (match) {
          setPartnerProfile(match.partner);
        }
      } catch {
        setLoadError("会話情報の取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [conversationId]);

  const handleEnvironmentSelect = async (envId: string) => {
    if (!conversationId) return;
    setIsCreatingSession(true);
    try {
      const { ar_session } = await createArSession({
        conversation_id: conversationId,
        environment_type: envId,
      });
      setArSession(ar_session);
      setIsStarted(true);
    } catch {
      setLoadError("ARセッションの作成に失敗しました");
    } finally {
      setIsCreatingSession(false);
    }
  };

  if (!conversationId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-600">
        会話が見つかりません
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-red-600">
        {loadError}
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AR空間での会話
          </h1>
          <p className="text-gray-600">
            環境を選んで、
            {partnerProfile?.display_name ?? "AIアバター"}
            との会話を開始しましょう
          </p>
        </div>

        {isCreatingSession ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : (
          <AREnvironmentSelector onSelect={handleEnvironmentSelect} />
        )}
      </div>
    );
  }

  const partnerName = partnerProfile?.display_name ?? "AIアバター";
  const partnerVoiceId = partnerProfile?.gender === "male" ? "Takumi" : "Mizuki";

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
            {arSession && (
              <VoiceChatInterface
                arSessionId={arSession.session_token}
                partnerName={partnerName}
                partnerVoiceId={partnerVoiceId}
                conversationId={conversationId}
                onEnd={() => router.push("/matches")}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ARSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      }
    >
      <ARSessionContent />
    </Suspense>
  );
}
