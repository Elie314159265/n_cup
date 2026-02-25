"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Gltf } from "@react-three/drei";
import { Suspense, useState, useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { XR, createXRStore } from "@react-three/xr";
import { useSearchParams } from "next/navigation";
import { aiTranscribe, aiChat, aiSpeech } from "../../actions/ai";
import { createArSession } from "../../actions/ar-sessions";
import {
  ActionCableClient,
  type AiResponseChunk,
} from "../../lib/websocket/cable";

// ─── XRストア ─────────────────────────────────────────────────────────────
const store = createXRStore({ emulate: false });
const MODELS = [
  { id: "nimo_anime", label: "Nimo (Anime)", src: "/models/nimo_anime.glb" },
  { id: "nimo", label: "Nimo", src: "/models/nimo.glb" },
  { id: "avatar", label: "Avatar", src: "/models/female.glb" },
] as const;

type ModelId = (typeof MODELS)[number]["id"];

// ─── 会話履歴エントリ ─────────────────────────────────────────────────────
export type TranscriptEntry = {
  role: "user" | "assistant";
  text: string;
};

// ─── 音声会話フック（実API版） ────────────────────────────────────────────
function useVoiceChat(arSessionId: number | null) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  // Action Cable ストリーミング用のバッファ
  const [streamingText, setStreamingText] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const cableRef = useRef<ActionCableClient | null>(null);

  // AiResponseChannel の WebSocket 購読
  useEffect(() => {
    if (!arSessionId) return;
    const cable = new ActionCableClient();
    cableRef.current = cable;
    const unsub = cable.subscribe<AiResponseChunk>(
      "AiResponseChannel",
      { ar_session_id: arSessionId },
      (chunk) => {
        if (chunk.type === "ai_response_chunk" && chunk.text_chunk) {
          setStreamingText((prev) => prev + chunk.text_chunk);
        }
        if (chunk.type === "ai_response_done") {
          setStreamingText("");
        }
      },
    );
    return () => {
      unsub();
      cable.disconnect();
    };
  }, [arSessionId]);

  // 音量解析して再生する共通ヘルパー
  const playAudioUrl = useCallback((url: string) => {
    const audio = new Audio(url);
    let audioContext: AudioContext | null = null;

    const cleanup = () => {
      setIsPlaying(false);
      setAudioVolume(0);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      audioContext?.close();
    };

    try {
      audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const source = audioContext.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioVolume(avg);
        if (!audio.paused && !audio.ended) {
          animFrameRef.current = requestAnimationFrame(tick);
        }
      };

      setIsPlaying(true);
      audio.play().then(tick).catch(cleanup);
      audio.onended = cleanup;
    } catch {
      setIsPlaying(true);
      audio.play().catch(cleanup);
      audio.onended = cleanup;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (isPlaying || isProcessing) return;
    try {
      setMicError(null);
      chunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      setMicError("マイクの許可が必要です");
    }
  }, [isPlaying, isProcessing]);

  const stopRecordingAndRespond = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    mediaRecorderRef.current = null;
    setIsRecording(false);

    recorder.onstop = async () => {
      setIsProcessing(true);
      try {
        // ── 1. 音声 → テキスト (Transcribe) ──────────────────────────────
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        const ext = recorder.mimeType.includes("mp4") ? "mp4" : "webm";
        const audioFile = new File([blob], `voice.${ext}`, {
          type: recorder.mimeType,
        });

        let userText: string;
        try {
          const result = await aiTranscribe(audioFile, "ja-JP");
          userText = result.text;
        } catch (e) {
          console.error("[Transcribe]", e);
          setMicError("音声認識に失敗しました");
          return;
        }
        setTranscript((prev) => [...prev, { role: "user", text: userText }]);

        // ── 2. テキスト → AI応答 (Bedrock) ───────────────────────────────
        let aiText: string;
        try {
          if (!arSessionId) throw new Error("No arSessionId");
          const result = await aiChat({
            ar_session_id: arSessionId,
            message: userText,
          });
          aiText = result.response.text;
        } catch (e) {
          console.error("[AiChat]", e);
          setMicError("AI応答の取得に失敗しました");
          return;
        }
        setTranscript((prev) => [...prev, { role: "assistant", text: aiText }]);

        // ── 3. テキスト → 音声 (Polly) ───────────────────────────────────
        let audioUrl: string;
        try {
          const result = await aiSpeech({
            text: aiText,
            voice_id: "Mizuki",
            engine: "neural",
          });
          audioUrl = result.audio_url;
        } catch (e) {
          console.error("[AiSpeech]", e);
          setMicError("音声合成に失敗しました");
          return;
        }

        // ── 4. 音声再生 ───────────────────────────────────────────────────
        playAudioUrl(audioUrl);
      } catch (e) {
        console.error("[VoiceChat]", e);
        setMicError("エラーが発生しました");
      } finally {
        setIsProcessing(false);
      }
    };

    recorder.stop();
    recorder.stream.getTracks().forEach((t) => t.stop());
  }, [arSessionId, playAudioUrl]);

  return {
    isRecording,
    isPlaying,
    isProcessing,
    audioVolume,
    micError,
    transcript,
    streamingText,
    startRecording,
    stopRecordingAndRespond,
  };
}

// ─── 音量波形バー ──────────────────────────────────────────────────────────
function WaveformBars({ volume }: { volume: number }) {
  const heights = [0.4, 0.7, 1.0, 0.8, 0.6, 0.9, 0.5];
  return (
    <div className="flex items-center gap-1 h-9">
      {heights.map((base, i) => (
        <div
          key={i}
          style={{
            height: Math.max(6, base * (8 + (volume / 255) * 28)),
          }}
          className="w-[5px] rounded bg-[#a78bfa] transition-[height] duration-100 ease-in-out"
        />
      ))}
    </div>
  );
}

// ─── 3Dシーン（AR/非AR共通・IfInSessionMode なし） ──────────────────────
function SceneContent({
  modelSrc,
  placed,
  placedPosition,
  cameraStateRef,
}: {
  modelSrc: string;
  placed: boolean;
  placedPosition: THREE.Vector3 | null;
  cameraStateRef: React.MutableRefObject<{
    pos: THREE.Vector3;
    dir: THREE.Vector3;
  } | null>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame(() => {
    // placed 後は位置を一切変更しない（静的 position prop で描画）
    if (placed) return;

    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const pos = camera.position.clone();

    // 外部からボタン押下時に参照できるようカメラ状態を保存
    cameraStateRef.current = { pos: pos.clone(), dir: dir.clone() };

    // プレビュー: カメラ正面2m・目線より少し下に追従
    if (groupRef.current) {
      const previewPos = pos.clone().addScaledVector(dir, 2);
      previewPos.y -= 0.8;
      groupRef.current.position.copy(previewPos);
    }
  });

  return (
    <>
      <ambientLight intensity={2} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} />
      {placed && placedPosition ? (
        // 固定後: 静的な世界座標に配置（フレーム更新なし → 世界に固定）
        <group
          position={[placedPosition.x, placedPosition.y, placedPosition.z]}
        >
          <Suspense fallback={null}>
            <Gltf src={modelSrc} scale={0.6} />
          </Suspense>
        </group>
      ) : (
        // プレビュー中: useFrame で追従する group を使う
        <group ref={groupRef}>
          <Suspense fallback={null}>
            <Gltf src={modelSrc} scale={0.6} />
          </Suspense>
        </group>
      )}
    </>
  );
}

// ─── ページ内部（useSearchParams使用） ────────────────────────────────────
function ArPageInner() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("conversation_id");
  const arSessionIdParam = searchParams.get("ar_session_id");

  const [selectedModel, setSelectedModel] = useState<ModelId>("nimo_anime");
  const [arError, setArError] = useState<string | null>(null);
  const [arSessionId, setArSessionId] = useState<number | null>(
    arSessionIdParam ? Number(arSessionIdParam) : null,
  );
  const [inAR, setInAR] = useState(false); // AR起動済み（配置前）
  const [placed, setPlaced] = useState(false); // 配置確定済み
  const [placedPosition, setPlacedPosition] = useState<THREE.Vector3 | null>(
    null,
  );
  // SceneContent 内のカメラ状態を受け取るための共有 ref
  const cameraStateRef = useRef<{
    pos: THREE.Vector3;
    dir: THREE.Vector3;
  } | null>(null);

  const modelSrc = MODELS.find((m) => m.id === selectedModel)!.src;
  const voiceChat = useVoiceChat(arSessionId);

  // conversationId があれば ARセッションを自動作成
  useEffect(() => {
    if (arSessionId || !conversationId) return;
    createArSession({
      conversation_id: Number(conversationId),
      environment_type: "ar",
    })
      .then((res) => setArSessionId(res.ar_session.id))
      .catch(() => console.warn("ARセッション作成失敗"));
  }, [arSessionId, conversationId]);

  const handleEnterAR = async () => {
    setArError(null);
    setInAR(false);
    setPlaced(false);
    setPlacedPosition(null);
    cameraStateRef.current = null;
    try {
      await store.enterAR();
      setInAR(true); // AR起動成功 → まず追従モードで表示
    } catch (e) {
      console.error("[enterAR]", e);
      setArError(
        "AR起動失敗。launchar.app の Allowed Domains にこのURLを追加してください。",
      );
    }
  };

  return (
    <div className="w-screen h-screen bg-[#0a0a0a] relative touch-none">
      {/* Three.js Canvas - IfInSessionMode なし・常にモデルを描画 */}
      <Canvas
        camera={{ position: [0, 0, 0.01], fov: 70 }}
        gl={{ alpha: true, antialias: true }}
        style={{ position: "absolute", inset: 0 }}
      >
        <XR store={store}>
          <SceneContent
            modelSrc={modelSrc}
            placed={placed}
            placedPosition={placedPosition}
            cameraStateRef={cameraStateRef}
          />
        </XR>
      </Canvas>

      {/* モデル選択UI */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 flex gap-2 bg-black/60 px-3 py-2 rounded-full backdrop-blur">
        {MODELS.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedModel(m.id)}
            style={{
              background: selectedModel === m.id ? "#7c3aed" : "transparent",
              border:
                selectedModel === m.id
                  ? "1px solid #7c3aed"
                  : "1px solid rgba(255,255,255,0.3)",
            }}
            className="px-[14px] py-[6px] text-white rounded-full text-[13px] cursor-pointer transition-all duration-150"
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* AR未起動: ARで表示ボタン */}
      {!inAR && !placed && (
        <button
          onClick={handleEnterAR}
          className="fixed bottom-12 left-1/2 -translate-x-1/2 z-20 px-10 py-[14px] bg-[#7c3aed] text-white border-none rounded-full text-base font-bold cursor-pointer shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
        >
          📷 ARで表示
        </button>
      )}

      {/* AR起動済み・配置前: カメラを向けて固定ボタン */}
      {inAR && !placed && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
          <button
            onClick={() => {
              // ボタン押下時点のカメラ向き正面2mをワールド座標として確定
              const state = cameraStateRef.current;
              if (state) {
                const p = state.pos.clone().addScaledVector(state.dir, 2);
                p.y -= 0.8;
                setPlacedPosition(p);
              }
              setPlaced(true);
            }}
            className="px-10 py-[14px] bg-[#7c3aed] text-white border-none rounded-full text-base font-bold cursor-pointer shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
          >
            ここに固定する
          </button>
          <span className="text-white text-xs [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
            置きたい場所にカメラを向けてボタンを押してください
          </span>
        </div>
      )}

      {/* AR開始後: 音声会話UI */}
      {placed && (
        <div className="fixed bottom-9 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3">
          <div className="text-white text-sm font-medium bg-black/50 py-2 px-5 rounded-full backdrop-blur whitespace-nowrap [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]">
            {voiceChat.isPlaying
              ? "💬 話しています..."
              : voiceChat.isProcessing
                ? "⏳ 処理中..."
                : voiceChat.isRecording
                  ? "🎤 話してください..."
                  : "押して話す"}
          </div>
          {voiceChat.isPlaying && (
            <WaveformBars volume={voiceChat.audioVolume} />
          )}
          <button
            onPointerDown={voiceChat.startRecording}
            onPointerUp={voiceChat.stopRecordingAndRespond}
            onPointerLeave={() => {
              if (voiceChat.isRecording) voiceChat.stopRecordingAndRespond();
            }}
            disabled={voiceChat.isPlaying || voiceChat.isProcessing}
            style={{
              background: voiceChat.isRecording
                ? "#ef4444"
                : voiceChat.isPlaying || voiceChat.isProcessing
                  ? "#6b7280"
                  : "#7c3aed",
              border: voiceChat.isRecording
                ? "4px solid rgba(252,165,165,0.6)"
                : "4px solid rgba(255,255,255,0.25)",
              WebkitTapHighlightColor: "transparent",
            }}
            className="w-20 h-20 rounded-full text-white text-[32px] flex items-center justify-center outline-none"
          >
            {voiceChat.isProcessing ? "⏳" : "🎤"}
          </button>
          {voiceChat.micError && (
            <div className="bg-red-700/85 text-white py-2 px-4 rounded-lg text-[13px]">
              {voiceChat.micError}
            </div>
          )}
        </div>
      )}

      {/* エラーメッセージ */}
      {arError && (
        <div className="fixed bottom-[120px] left-1/2 -translate-x-1/2 z-20 bg-red-700/85 text-white py-3 px-5 rounded-xl text-[13px] max-w-[80vw] text-center">
          {arError}
        </div>
      )}
    </div>
  );
}

// ─── ページ（Suspenseラッパー） ────────────────────────────────────────────
export default function ArPage() {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen bg-[#0a0a0a] flex items-center justify-center text-white text-lg">
          読み込み中...
        </div>
      }
    >
      <ArPageInner />
    </Suspense>
  );
}
