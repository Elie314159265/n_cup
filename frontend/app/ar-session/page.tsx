"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Link2, AlertTriangle, Scan, MessageCircle } from "lucide-react";
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
  const conversationId = conversationIdStr
    ? parseInt(conversationIdStr, 10)
    : null;

  const [partnerProfile, setPartnerProfile] = useState<MatchPartner | null>(
    null,
  );
  const [arSession, setArSession] = useState<ArSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentViseme, setCurrentViseme] = useState("sil");

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
      <div className="page-bg min-h-screen flex items-center justify-center">
        <div className="card p-10 text-center max-w-sm">
          <Link2 size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 text-sm">会話が見つかりません</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-bg min-h-screen flex items-center justify-center">
        <div className="card p-10 text-center">
          <div
            className="w-10 h-10 rounded-full mx-auto mb-4"
            style={{
              border: "3px solid transparent",
              borderTopColor: "#8b5cf6",
              borderRightColor: "#ec4899",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p className="text-gray-500 text-sm">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="page-bg min-h-screen flex items-center justify-center">
        <div className="card p-10 text-center max-w-sm">
          <AlertTriangle size={32} className="mx-auto mb-3 text-red-400" />
          <p className="text-red-500 text-sm font-semibold">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="page-bg min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="icon-box mx-auto mb-4">
              <Scan size={20} />
            </div>
            <h1 className="text-2xl font-black gradient-text mb-1">
              AR空間での会話
            </h1>
            <p className="text-gray-500 text-sm">
              環境を選んで、
              {partnerProfile?.display_name ?? "AIアバター"}
              との会話を開始しましょう
            </p>
          </div>

          {isCreatingSession ? (
            <div className="card p-10 flex items-center justify-center">
              <div className="text-center">
                <div
                  className="w-10 h-10 rounded-full mx-auto mb-4"
                  style={{
                    border: "3px solid transparent",
                    borderTopColor: "#8b5cf6",
                    borderRightColor: "#ec4899",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <p className="text-gray-500 text-sm">セッションを作成中...</p>
              </div>
            </div>
          ) : (
            <AREnvironmentSelector onSelect={handleEnvironmentSelect} />
          )}
        </div>
      </div>
    );
  }

  const partnerName = partnerProfile?.display_name ?? "AIアバター";
  const partnerVoiceId =
    partnerProfile?.gender === "male" ? "Takumi" : "Mizuki";

  return (
    <div className="page-bg min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AR表示エリア */}
          <div>
            <h2 className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-3 flex items-center gap-1">
              <Scan size={12} /> AR空間
            </h2>
            <div className="card overflow-hidden">
              <AvatarViewer
                isSpeaking={isSpeaking}
                currentViseme={currentViseme}
              />
            </div>
          </div>

          {/* 音声チャット */}
          <div>
            <h2 className="text-xs font-bold text-pink-500 uppercase tracking-widest mb-3 flex items-center gap-1">
              <MessageCircle size={12} /> 会話
            </h2>
            <div className="card p-6">
              {arSession && (
                <VoiceChatInterface
                  arSessionId={arSession.session_token}
                  partnerName={partnerName}
                  partnerVoiceId={partnerVoiceId}
                  conversationId={conversationId}
                  onEnd={() => router.push("/matches")}
                  onVisemeChange={(viseme) => {
                    setCurrentViseme(viseme);
                    setIsSpeaking(viseme !== "sil");
                  }}
                />
              )}
            </div>
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
