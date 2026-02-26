"use client";

import { Canvas } from "@react-three/fiber";
import { Gltf, OrbitControls, Stage } from "@react-three/drei";
import { Suspense, useRef, useState, useCallback, useEffect } from "react";
import {
  XR,
  createXRStore,
  IfInSessionMode,
  useXRHitTest,
  XRDomOverlay,
} from "@react-three/xr";
import { useSearchParams } from "next/navigation";
import * as THREE from "three";
import { aiTranscribe, aiChat, aiSpeech } from "../../actions/ai";
import { createArSession } from "../../actions/ar-sessions";
import {
  ActionCableClient,
  type AiResponseChunk,
} from "../../lib/websocket/cable";

// ─── XRストア（emulate:false でVRエミュレーターを無効化） ──────────────────
const store = createXRStore({ emulate: false });

// ─── 3Dモデル一覧 ─────────────────────────────────────────────────────────
const MODELS = [
  { id: "nimo_anime", label: "Nimo (Anime)", src: "/models/nimo_anime.glb" },
  { id: "nimo", label: "Nimo", src: "/models/nimo.glb" },
  { id: "avatar", label: "Avatar", src: "/models/avatar.glb" },
] as const;

type ModelId = (typeof MODELS)[number]["id"];

// ─── 会話履歴エントリ ─────────────────────────────────────────────────────
export type TranscriptEntry = {
  role: "user" | "assistant";
  text: string;
};

const _hitMatrix = new THREE.Matrix4();

// ─── 音声会話フック（実API版） ────────────────────────────────────────────
function useVoiceChat(arSessionId: string | null) {
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

// ─── AR配置コンポーネント ─────────────────────────────────────────────────
function ARPlacementModel({
  src,
  selectedModel,
  setSelectedModel,
  isRecording,
  isPlaying,
  isProcessing,
  audioVolume,
  micError,
  transcript,
  streamingText,
  onStartRecording,
  onStopRecording,
}: {
  src: string;
  selectedModel: ModelId;
  setSelectedModel: (id: ModelId) => void;
  isRecording: boolean;
  isPlaying: boolean;
  isProcessing: boolean;
  audioVolume: number;
  micError: string | null;
  transcript: TranscriptEntry[];
  streamingText: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [placed, setPlaced] = useState(false);
  const hasHit = useRef(false);

  // ヒットテスト: 地面を検出してモデル・リングを追従させる
  useXRHitTest((results, getWorldMatrix) => {
    if (placed) return;
    if (results.length === 0) {
      hasHit.current = false;
      if (groupRef.current) groupRef.current.visible = false;
      if (ringRef.current) ringRef.current.visible = false;
      return;
    }
    getWorldMatrix(_hitMatrix, results[0]);
    hasHit.current = true;
    const pos = new THREE.Vector3().setFromMatrixPosition(_hitMatrix);
    if (groupRef.current) {
      groupRef.current.position.copy(pos);
      groupRef.current.quaternion.setFromRotationMatrix(_hitMatrix);
      groupRef.current.visible = true;
    }
    if (ringRef.current) {
      ringRef.current.position.set(pos.x, pos.y + 0.001, pos.z);
      ringRef.current.visible = true;
    }
  }, "viewer");

  const handlePlace = () => {
    if (!placed && hasHit.current) {
      if (ringRef.current) ringRef.current.visible = false;
      setPlaced(true);
    }
  };

  return (
    <>
      {/* 地面検出リングマーカー */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.07, 0.09, 32]} />
        <meshBasicMaterial color="#a78bfa" side={THREE.DoubleSide} />
      </mesh>

      {/* 3Dモデル本体 */}
      <group ref={groupRef} visible={false} onClick={handlePlace}>
        <Suspense fallback={null}>
          <Gltf src={src} scale={0.6} />
        </Suspense>
      </group>

      {/* ARオーバーレイUI */}
      <XRDomOverlay>
        {/* モデル切り替えボタン */}
        <div className="fixed top-5 left-1/2 -translate-x-1/2 flex gap-2 bg-black/55 px-3 py-2 rounded-full backdrop-blur">
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
              className="px-[14px] py-[6px] text-white rounded-full text-[13px] cursor-pointer"
            >
              {m.label}
            </button>
          ))}
        </div>

        {!placed ? (
          /* ── 配置前: 配置ボタン ── */
          <div className="fixed bottom-[60px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <button
              onClick={handlePlace}
              className="px-9 py-[14px] bg-[#7c3aed] text-white border-none rounded-full text-base font-bold cursor-pointer shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
            >
              ここに配置
            </button>
            <span className="text-white/85 text-xs [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
              地面を向けてボタンを押すか、モデルをタップ
            </span>
          </div>
        ) : (
          /* ── 配置後: 音声会話UI ── */
          <div className="fixed bottom-9 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
            {/* ステータステキスト */}
            <div className="text-white text-sm font-medium [text-shadow:0_1px_4px_rgba(0,0,0,0.9)] bg-black/50 py-[6px] px-[18px] rounded-full backdrop-blur whitespace-nowrap">
              {isPlaying
                ? "💬 相手が話しています..."
                : isProcessing
                  ? "⏳ 処理中..."
                  : isRecording
                    ? "🎤 話してください..."
                    : "押して話す"}
            </div>

            {/* 再生中の音量波形 */}
            {isPlaying && <WaveformBars volume={audioVolume} />}

            {/* 会話履歴パネル */}
            {(transcript.length > 0 || streamingText) && (
              <div className="max-h-[200px] overflow-y-auto w-[min(360px,88vw)] bg-black/65 rounded-xl px-[14px] py-[10px] backdrop-blur-[10px] flex flex-col gap-[6px]">
                {transcript.map((entry, i) => (
                  <div
                    key={i}
                    className={`text-[13px] ${
                      entry.role === "user"
                        ? "text-[#c4b5fd] text-right"
                        : "text-[#e5e7eb] text-left"
                    }`}
                  >
                    <span
                      style={{
                        background:
                          entry.role === "user"
                            ? "rgba(124,58,237,0.45)"
                            : "rgba(255,255,255,0.12)",
                      }}
                      className="px-[10px] py-1 rounded-lg inline-block max-w-[90%]"
                    >
                      {entry.text}
                    </span>
                  </div>
                ))}
                {streamingText && (
                  <div className="text-[#e5e7eb] text-[13px]">
                    <span className="bg-white/[0.12] px-[10px] py-1 rounded-lg inline-block max-w-[90%]">
                      {streamingText}
                      <span className="opacity-60">▌</span>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* マイクボタン */}
            <button
              onPointerDown={onStartRecording}
              onPointerUp={onStopRecording}
              onPointerLeave={() => {
                if (isRecording) onStopRecording();
              }}
              disabled={isPlaying || isProcessing}
              style={{
                background: isRecording
                  ? "#ef4444"
                  : isPlaying || isProcessing
                    ? "#6b7280"
                    : "#7c3aed",
                border: isRecording
                  ? "4px solid rgba(252,165,165,0.6)"
                  : "4px solid rgba(255,255,255,0.25)",
                boxShadow: isRecording
                  ? "0 0 0 14px rgba(239,68,68,0.2), 0 4px 24px rgba(0,0,0,0.4)"
                  : "0 4px 24px rgba(0,0,0,0.4)",
                WebkitTapHighlightColor: "transparent",
              }}
              className={`w-20 h-20 rounded-full text-white text-[32px] flex items-center justify-center outline-none transition-all duration-150 ease-in-out ${
                isPlaying || isProcessing
                  ? "cursor-not-allowed"
                  : "cursor-pointer"
              }`}
            >
              {isProcessing ? "⏳" : "🎤"}
            </button>

            {/* エラー表示 */}
            {micError && (
              <div className="bg-[rgba(200,0,0,0.85)] text-white py-2 px-4 rounded-lg text-[13px]">
                {micError}
              </div>
            )}
          </div>
        )}
      </XRDomOverlay>
    </>
  );
}

// ─── Canvas内コンテンツ ───────────────────────────────────────────────────
function SceneContent({
  modelSrc,
  selectedModel,
  setSelectedModel,
  voiceChat,
}: {
  modelSrc: string;
  selectedModel: ModelId;
  setSelectedModel: (id: ModelId) => void;
  voiceChat: ReturnType<typeof useVoiceChat>;
}) {
  return (
    <>
      {/* ── AR モード ── */}
      <IfInSessionMode allow="immersive-ar">
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 8, 5]} intensity={1} castShadow />
        <ARPlacementModel
          key={modelSrc}
          src={modelSrc}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          isRecording={voiceChat.isRecording}
          isPlaying={voiceChat.isPlaying}
          isProcessing={voiceChat.isProcessing}
          audioVolume={voiceChat.audioVolume}
          micError={voiceChat.micError}
          transcript={voiceChat.transcript}
          streamingText={voiceChat.streamingText}
          onStartRecording={voiceChat.startRecording}
          onStopRecording={voiceChat.stopRecordingAndRespond}
        />
      </IfInSessionMode>

      {/* ── 非AR プレビューモード ── */}
      <IfInSessionMode deny="immersive-ar">
        <Stage
          key={modelSrc}
          intensity={0.5}
          environment="city"
          adjustCamera={false}
        >
          <Suspense fallback={null}>
            <Gltf src={modelSrc} scale={1} position={[0, -1, 0]} />
          </Suspense>
        </Stage>
        <OrbitControls
          makeDefault
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 1.75}
        />
      </IfInSessionMode>
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
  const [arSessionId, setArSessionId] = useState<string | null>(
    arSessionIdParam ?? null,
  );
  const [sessionError, setSessionError] = useState<string | null>(() =>
    !arSessionIdParam && !conversationId
      ? "conversation_id が指定されていません。マッチング画面から再度お試しください。"
      : null,
  );

  const modelSrc = MODELS.find((m) => m.id === selectedModel)!.src;
  const voiceChat = useVoiceChat(arSessionId);

  // conversationId があれば ARセッションを自動作成
  useEffect(() => {
    if (arSessionId || !conversationId) return;
    createArSession({
      conversation_id: Number(conversationId),
      environment_type: "ar",
    })
      .then((res) => setArSessionId(res.ar_session.session_token))
      .catch(() =>
        setSessionError(
          "ARセッションの作成に失敗しました。再読み込みしてください。",
        ),
      );
  }, [arSessionId, conversationId]);

  const handleEnterAR = async () => {
    setArError(null);
    try {
      await store.enterAR();
    } catch {
      setArError(
        "AR起動失敗。Android Chrome + ARCore 等のWebXR AR対応デバイスが必要です。",
      );
    }
  };

  return (
    <div className="w-screen h-screen bg-[#0a0a0a] relative touch-none">
      {/* Three.js Canvas */}
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        style={{ position: "absolute", inset: 0 }}
      >
        <XR store={store}>
          <SceneContent
            modelSrc={modelSrc}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            voiceChat={voiceChat}
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

      {/* AR開始ボタン（常時表示・エラーハンドリング付き） */}
      <button
        onClick={handleEnterAR}
        className="fixed bottom-12 left-1/2 -translate-x-1/2 z-20 px-10 py-[14px] bg-[#7c3aed] text-white border-none rounded-full text-base font-bold cursor-pointer shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
      >
        📷 ARで表示
      </button>

      {/* エラーメッセージ */}
      {(arError || sessionError) && (
        <div className="fixed bottom-[120px] left-1/2 -translate-x-1/2 z-20 bg-[rgba(200,0,0,0.85)] text-white py-[10px] px-5 rounded-xl text-[13px] max-w-[80vw] text-center">
          {arError ?? sessionError}
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
