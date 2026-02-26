"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/common/Button";
import { aiChat, aiSpeech } from "@/actions/ai";
import { endConversation } from "@/actions/conversations";
import type { Viseme } from "@/types/ai";

type Step = "idle" | "listening" | "thinking" | "speaking" | "error";

type ConversationTurn = {
  user: string;
  ai: string;
};

interface VoiceChatInterfaceProps {
  arSessionId: string;
  partnerName?: string;
  partnerVoiceId?: string;
  conversationId?: number;
  onEnd?: () => void;
  onVisemeChange?: (viseme: string) => void;
}

// binary search: currentTimeMs 以下で最後の viseme を返す
function findCurrentViseme(visemes: Viseme[], currentTimeMs: number): string {
  if (visemes.length === 0) return "sil";
  let lo = 0;
  let hi = visemes.length - 1;
  let result = visemes[0].value;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (visemes[mid].time <= currentTimeMs) {
      result = visemes[mid].value;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return result;
}

export const VoiceChatInterface = ({
  arSessionId,
  partnerName = "AIアバター",
  partnerVoiceId = "Mizuki",
  conversationId,
  onEnd,
  onVisemeChange,
}: VoiceChatInterfaceProps) => {
  const [step, setStep] = useState<Step>("idle");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<ConversationTurn[]>([]);
  const [isEnding, setIsEnding] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const finalTranscriptRef = useRef("");
  const rafRef = useRef<number | null>(null);
  const visemesRef = useRef<Viseme[]>([]);

  const stopVisemeLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    onVisemeChange?.("sil");
  }, [onVisemeChange]);

  const startVisemeLoop = useCallback(
    (audio: HTMLAudioElement, visemes: Viseme[]) => {
      visemesRef.current = visemes;
      const tick = () => {
        const currentTimeMs = audio.currentTime * 1000;
        onVisemeChange?.(findCurrentViseme(visemesRef.current, currentTimeMs));
        if (!audio.paused && !audio.ended) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [onVisemeChange],
  );

  useEffect(() => {
    return () => stopVisemeLoop();
  }, [stopVisemeLoop]);

  const processAiResponse = useCallback(
    async (userText: string) => {
      setStep("thinking");

      try {
        console.log("[VoiceChat] ユーザー発言:", userText);

        // Bedrock でAI応答生成
        const chatRes = await aiChat({
          ar_session_id: arSessionId,
          message: userText,
        });
        const aiText = chatRes.response.text;
        console.log("[VoiceChat] AI応答:", aiText);

        // 音声合成（失敗しても会話は続ける）
        let audioUrl: string | null = null;
        let visemes: Viseme[] = [];
        try {
          const speechRes = await aiSpeech({
            text: aiText,
            voice_id: partnerVoiceId,
            engine: "neural",
          });
          audioUrl = speechRes.audio_url;
          visemes = speechRes.visemes ?? [];
          console.log("[VoiceChat] 音声URL:", audioUrl, "visemes:", visemes.length);
        } catch {
          // Polly失敗 → テキストのみ表示
          console.warn("[VoiceChat] Polly音声合成失敗 → テキストのみ表示");
        }

        setHistory((prev) => [...prev, { user: userText, ai: aiText }]);
        setInterimTranscript("");

        if (audioUrl) {
          setStep("speaking");
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          audio.onplaying = () => startVisemeLoop(audio, visemes);
          audio.onended = () => { stopVisemeLoop(); setStep("idle"); };
          audio.onerror = () => { stopVisemeLoop(); setStep("idle"); };
          await audio.play();
        } else {
          setStep("idle");
        }
      } catch {
        setError("AI応答の取得に失敗しました。もう一度お試しください。");
        setStep("error");
      }
    },
    [arSessionId, partnerVoiceId, startVisemeLoop, stopVisemeLoop],
  );

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("このブラウザは音声入力に対応していません（Chrome推奨）");
      return;
    }

    finalTranscriptRef.current = "";
    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      if (final) finalTranscriptRef.current += final;
      setInterimTranscript(finalTranscriptRef.current + interim);
    };

    recognition.onend = () => {
      const text = finalTranscriptRef.current.trim();
      if (text) {
        processAiResponse(text);
      } else {
        setStep("idle");
        setInterimTranscript("");
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") {
        setStep("idle");
        setInterimTranscript("");
        return;
      }
      setError(`音声認識エラー: ${event.error}`);
      setStep("error");
    };

    recognition.start();
    setStep("listening");
    setError("");
  }, [processAiResponse]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const handleEnd = useCallback(async () => {
    setIsEnding(true);
    recognitionRef.current?.stop();
    audioRef.current?.pause();

    if (conversationId) {
      try {
        await endConversation(conversationId);
      } catch {
        // 終了APIが失敗しても画面遷移は行う
      }
    }

    onEnd?.();
  }, [conversationId, onEnd]);

  const isBusy = step === "thinking" || step === "speaking";

  return (
    <div className="space-y-4">
      {/* ステータス表示 */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 border border-pink-200">
        <p className="text-sm font-semibold text-gray-700 mb-1">
          {partnerName}と会話中
        </p>
        {step === "idle" && (
          <p className="text-gray-500 text-sm">ボタンを押して話しかけてください</p>
        )}
        {step === "listening" && (
          <div className="flex items-center gap-2 text-blue-600">
            <span className="animate-pulse text-lg">🎤</span>
            <span className="text-sm">聞き取り中…（話し終わると自動で送信）</span>
          </div>
        )}
        {step === "thinking" && (
          <div className="flex items-center gap-2 text-purple-600">
            <span className="animate-spin inline-block">⏳</span>
            <span className="text-sm">{partnerName}が考えています…</span>
          </div>
        )}
        {step === "speaking" && (
          <div className="flex items-center gap-2 text-green-600">
            <span className="animate-pulse text-lg">🔊</span>
            <span className="text-sm">{partnerName}が話しています…</span>
          </div>
        )}
      </div>

      {/* リアルタイム文字起こし（listening中） */}
      {(step === "listening" || step === "thinking") && interimTranscript && (
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <p className="text-xs text-blue-700 mb-1">
            {step === "listening" ? "あなた（認識中）" : "あなた"}
          </p>
          <p className="text-gray-800 text-sm">{interimTranscript}</p>
        </div>
      )}

      {/* エラー表示 */}
      {step === "error" && (
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <p className="text-red-800 text-sm">{error}</p>
          <button
            onClick={() => setStep("idle")}
            className="mt-2 text-xs text-red-600 underline"
          >
            再試行
          </button>
        </div>
      )}

      {/* 会話履歴 */}
      {history.length > 0 && (
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {history.map((turn, i) => (
            <div key={i} className="space-y-2">
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <p className="text-xs font-semibold text-blue-700 mb-1">あなた</p>
                <p className="text-gray-800 text-sm">{turn.user}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                <p className="text-xs font-semibold text-purple-700 mb-1">
                  {partnerName}
                </p>
                <p className="text-gray-800 text-sm">{turn.ai}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* コントロールボタン */}
      <div className="flex gap-3 pt-2">
        {step === "listening" ? (
          <Button onClick={stopListening} variant="danger" className="flex-1">
            ⏹️ 送信
          </Button>
        ) : (
          <Button
            onClick={startListening}
            disabled={isBusy || isEnding}
            loading={isBusy}
            className="flex-1"
          >
            🎤 話しかける
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={handleEnd}
          disabled={isEnding}
          loading={isEnding}
          className="flex-1"
        >
          終了
        </Button>
      </div>
    </div>
  );
};
