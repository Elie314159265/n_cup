"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";

interface VoiceChatInterfaceProps {
  arSessionId: string;
  partnerName?: string;
}

export const VoiceChatInterface = ({
  arSessionId,
  partnerName = "AIアバター",
}: VoiceChatInterfaceProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [error, setError] = useState("");

  const handleStartListening = async () => {
    setIsListening(true);
    setError("");

    try {
      // Web Speech APIを使用
      const SpeechRecognition =
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).SpeechRecognition ||
                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "ja-JP";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = async (event: any) => {
        const text = Array.from(event.results)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((result: any) => result[0].transcript)
          .join("");

        setTranscript(text);
        await sendToAI(text);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        setError(`音声認識エラー: ${event.error}`);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (_err) {
      setError("音声入力に対応していません");
      setIsListening(false);
    }
  };

  const sendToAI = async (userMessage: string) => {
    setIsResponding(true);

    try {
      const response = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ar_session_id: arSessionId,
          message: userMessage,
        }),
      });

      const data = await response.json();
      setAiResponse(data.response);

      // 音声出力
      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audio.play();
      }
    } catch (_err) {
      setError("AI応答取得エラー");
    } finally {
      setIsResponding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ステータス表示 */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-6 border border-pink-200">
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          {partnerName}と会話中
        </h2>
        {isListening && (
          <div className="flex items-center gap-2 text-blue-600">
            <span className="animate-pulse">🎤</span>
            <span>聞き取り中...</span>
          </div>
        )}
        {isResponding && (
          <div className="flex items-center gap-2 text-purple-600">
            <span className="animate-spin">⏳</span>
            <span>思考中...</span>
          </div>
        )}
        {!isListening && !isResponding && (
          <div className="text-gray-600">準備完了</div>
        )}
      </div>

      {/* トランスクリプト表示 */}
      {transcript && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-gray-600 mb-1">あなた</p>
          <p className="text-gray-900">{transcript}</p>
        </div>
      )}

      {/* AI応答表示 */}
      {aiResponse && (
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-sm text-gray-600 mb-1">{partnerName}</p>
          <p className="text-gray-900">{aiResponse}</p>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <p className="text-red-900">{error}</p>
        </div>
      )}

      {/* コントロール */}
      <div className="flex gap-4">
        <Button
          onClick={handleStartListening}
          disabled={isListening || isResponding}
          className="flex-1"
        >
          {isListening ? "聞き取り中..." : "🎤 話しかける"}
        </Button>
        <Button variant="secondary" className="flex-1">
          ⏹️ 終了
        </Button>
      </div>
    </div>
  );
};
