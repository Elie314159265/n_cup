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
    <div style={{ display: "flex", alignItems: "center", gap: 4, height: 36 }}>
      {heights.map((base, i) => (
        <div
          key={i}
          style={{
            width: 5,
            borderRadius: 4,
            background: "#a78bfa",
            height: Math.max(6, base * (8 + (volume / 255) * 28)),
            transition: "height 0.1s ease",
          }}
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
        <div
          style={{
            position: "fixed",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 8,
            background: "rgba(0,0,0,0.55)",
            padding: "8px 12px",
            borderRadius: 999,
            backdropFilter: "blur(8px)",
          }}
        >
          {MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedModel(m.id)}
              style={{
                padding: "6px 14px",
                background: selectedModel === m.id ? "#7c3aed" : "transparent",
                color: "#fff",
                border:
                  selectedModel === m.id
                    ? "1px solid #7c3aed"
                    : "1px solid rgba(255,255,255,0.3)",
                borderRadius: 999,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {!placed ? (
          /* ── 配置前: 配置ボタン ── */
          <div
            style={{
              position: "fixed",
              bottom: 60,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <button
              onClick={handlePlace}
              style={{
                padding: "14px 36px",
                background: "#7c3aed",
                color: "#fff",
                border: "none",
                borderRadius: 999,
                fontSize: 16,
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
              }}
            >
              ここに配置
            </button>
            <span
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 12,
                textShadow: "0 1px 3px rgba(0,0,0,0.9)",
              }}
            >
              地面を向けてボタンを押すか、モデルをタップ
            </span>
          </div>
        ) : (
          /* ── 配置後: 音声会話UI ── */
          <div
            style={{
              position: "fixed",
              bottom: 36,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            {/* ステータステキスト */}
            <div
              style={{
                color: "#fff",
                fontSize: 14,
                fontWeight: 500,
                textShadow: "0 1px 4px rgba(0,0,0,0.9)",
                background: "rgba(0,0,0,0.5)",
                padding: "6px 18px",
                borderRadius: 999,
                backdropFilter: "blur(8px)",
                whiteSpace: "nowrap",
              }}
            >
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
              <div
                style={{
                  maxHeight: 200,
                  overflowY: "auto",
                  width: "min(360px, 88vw)",
                  background: "rgba(0,0,0,0.65)",
                  borderRadius: 12,
                  padding: "10px 14px",
                  backdropFilter: "blur(10px)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {transcript.map((entry, i) => (
                  <div
                    key={i}
                    style={{
                      color: entry.role === "user" ? "#c4b5fd" : "#e5e7eb",
                      fontSize: 13,
                      textAlign: entry.role === "user" ? "right" : "left",
                    }}
                  >
                    <span
                      style={{
                        background:
                          entry.role === "user"
                            ? "rgba(124,58,237,0.45)"
                            : "rgba(255,255,255,0.12)",
                        padding: "4px 10px",
                        borderRadius: 8,
                        display: "inline-block",
                        maxWidth: "90%",
                      }}
                    >
                      {entry.text}
                    </span>
                  </div>
                ))}
                {streamingText && (
                  <div style={{ color: "#e5e7eb", fontSize: 13 }}>
                    <span
                      style={{
                        background: "rgba(255,255,255,0.12)",
                        padding: "4px 10px",
                        borderRadius: 8,
                        display: "inline-block",
                        maxWidth: "90%",
                      }}
                    >
                      {streamingText}
                      <span style={{ opacity: 0.6 }}>▌</span>
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
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: isRecording
                  ? "#ef4444"
                  : isPlaying || isProcessing
                    ? "#6b7280"
                    : "#7c3aed",
                border: isRecording
                  ? "4px solid rgba(252,165,165,0.6)"
                  : "4px solid rgba(255,255,255,0.25)",
                color: "#fff",
                fontSize: 32,
                cursor: isPlaying || isProcessing ? "not-allowed" : "pointer",
                boxShadow: isRecording
                  ? "0 0 0 14px rgba(239,68,68,0.2), 0 4px 24px rgba(0,0,0,0.4)"
                  : "0 4px 24px rgba(0,0,0,0.4)",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                outline: "none",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {isProcessing ? "⏳" : "🎤"}
            </button>

            {/* エラー表示 */}
            {micError && (
              <div
                style={{
                  background: "rgba(200,0,0,0.85)",
                  color: "#fff",
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: 13,
                }}
              >
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
  const [arSessionId, setArSessionId] = useState<number | null>(
    arSessionIdParam ? Number(arSessionIdParam) : null,
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
      .then((res) => setArSessionId(res.ar_session.id))
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
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#0a0a0a",
        position: "relative",
        touchAction: "none",
      }}
    >
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
      <div
        style={{
          position: "absolute",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          display: "flex",
          gap: 8,
          background: "rgba(0,0,0,0.6)",
          padding: "8px 12px",
          borderRadius: 999,
          backdropFilter: "blur(8px)",
        }}
      >
        {MODELS.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedModel(m.id)}
            style={{
              padding: "6px 14px",
              background: selectedModel === m.id ? "#7c3aed" : "transparent",
              color: "#fff",
              border:
                selectedModel === m.id
                  ? "1px solid #7c3aed"
                  : "1px solid rgba(255,255,255,0.3)",
              borderRadius: 999,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* AR開始ボタン（常時表示・エラーハンドリング付き） */}
      <button
        onClick={handleEnterAR}
        style={{
          position: "fixed",
          bottom: 48,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 20,
          padding: "14px 40px",
          background: "#7c3aed",
          color: "#fff",
          border: "none",
          borderRadius: 999,
          fontSize: 16,
          fontWeight: "bold",
          cursor: "pointer",
          boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
        }}
      >
        📷 ARで表示
      </button>

      {/* エラーメッセージ */}
      {(arError || sessionError) && (
        <div
          style={{
            position: "fixed",
            bottom: 120,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20,
            background: "rgba(200,0,0,0.85)",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: 12,
            fontSize: 13,
            maxWidth: "80vw",
            textAlign: "center",
          }}
        >
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
        <div
          style={{
            width: "100vw",
            height: "100vh",
            background: "#0a0a0a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 18,
          }}
        >
          読み込み中...
        </div>
      }
    >
      <ArPageInner />
    </Suspense>
  );
}
