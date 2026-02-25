"use client";

import { Canvas } from "@react-three/fiber";
import { Gltf, OrbitControls, Stage } from "@react-three/drei";
import { Suspense, useRef, useState, useCallback } from "react";

// ─── 3Dモデル一覧 ─────────────────────────────────────────────────────────
const MODELS = [
  { id: "nimo_anime", label: "Nimo (Anime)", src: "/models/nimo_anime.glb" },
  { id: "nimo", label: "Nimo", src: "/models/nimo.glb" },
  { id: "avatar", label: "Avatar", src: "/models/avatar.glb" },
] as const;

type ModelId = (typeof MODELS)[number]["id"];

// ─── 事前に用意した音声ファイル (public/audio/ に配置) ────────────────────
const RESPONSE_AUDIO_FILES = [
  "/audio/response_0.mp3",
  "/audio/response_1.mp3",
  "/audio/response_2.mp3",
];

// ─── 音声会話フック ────────────────────────────────────────────────────────
function useVoiceChat() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0);
  const [responseIndex, setResponseIndex] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const startRecording = useCallback(async () => {
    if (isPlaying) return;
    try {
      setMicError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      setMicError(
        "マイクの許可が必要です（ブラウザのアドレスバー左のアイコンから許可）",
      );
    }
  }, [isPlaying]);

  const stopRecordingAndRespond = useCallback(() => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current = null;
    setIsRecording(false);

    const idx = responseIndex;
    const audioFile = RESPONSE_AUDIO_FILES[idx % RESPONSE_AUDIO_FILES.length];
    const audio = new Audio(audioFile);

    let audioContext: AudioContext | null = null;

    const cleanup = () => {
      setIsPlaying(false);
      setAudioVolume(0);
      setResponseIndex((i) => i + 1);
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
  }, [responseIndex]);

  return {
    isRecording,
    isPlaying,
    audioVolume,
    micError,
    responseIndex,
    startRecording,
    stopRecordingAndRespond,
  };
}

// ─── 音量波形バー ──────────────────────────────────────────────────────────
function WaveformBars({ volume }: { volume: number }) {
  const heights = [0.4, 0.7, 1.0, 0.8, 0.6, 0.9, 0.5];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, height: 44 }}>
      {heights.map((base, i) => (
        <div
          key={i}
          style={{
            width: 6,
            borderRadius: 4,
            background: "linear-gradient(to top, #7c3aed, #a78bfa)",
            height: Math.max(6, base * (10 + (volume / 255) * 34)),
            transition: "height 0.08s ease",
          }}
        />
      ))}
    </div>
  );
}

// ─── ページ ───────────────────────────────────────────────────────────────
export default function VoiceDebugPage() {
  const [selectedModel, setSelectedModel] = useState<ModelId>("nimo_anime");
  const voiceChat = useVoiceChat();

  const totalFiles = RESPONSE_AUDIO_FILES.length;
  const nextFile = RESPONSE_AUDIO_FILES[voiceChat.responseIndex % totalFiles];

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "linear-gradient(135deg, #0f0a1e 0%, #1a0f3c 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* デバッグバッジ */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          background: "rgba(124,58,237,0.3)",
          border: "1px solid #7c3aed",
          color: "#a78bfa",
          padding: "4px 10px",
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1,
        }}
      >
        VOICE DEBUG
      </div>

      {/* モデル切り替え */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 8,
          background: "rgba(255,255,255,0.07)",
          padding: "6px 10px",
          borderRadius: 999,
          backdropFilter: "blur(8px)",
        }}
      >
        {MODELS.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedModel(m.id)}
            style={{
              padding: "5px 14px",
              background: selectedModel === m.id ? "#7c3aed" : "transparent",
              color: "#fff",
              border:
                selectedModel === m.id
                  ? "1px solid #7c3aed"
                  : "1px solid rgba(255,255,255,0.2)",
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

      {/* 3Dアバター */}
      <div style={{ width: "100%", height: "65vh" }}>
        <Canvas
          camera={{ position: [0, 0, 3], fov: 50 }}
          gl={{ antialias: true }}
        >
          <Stage intensity={0.6} environment="city" adjustCamera={false}>
            <Suspense fallback={null}>
              <Gltf
                key={selectedModel}
                src={MODELS.find((m) => m.id === selectedModel)!.src}
                scale={1}
                position={[0, -1, 0]}
              />
            </Suspense>
          </Stage>
          <OrbitControls
            makeDefault
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 1.75}
          />
        </Canvas>
      </div>

      {/* 会話コントロール */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          paddingBottom: 24,
        }}
      >
        {/* ステータス */}
        <div
          style={{
            color: "#e2d9f3",
            fontSize: 15,
            fontWeight: 500,
            background: "rgba(255,255,255,0.08)",
            padding: "7px 20px",
            borderRadius: 999,
            minWidth: 200,
            textAlign: "center",
          }}
        >
          {voiceChat.isPlaying
            ? "💬 相手が話しています..."
            : voiceChat.isRecording
              ? "🎤 話してください..."
              : "ボタンを押して話す"}
        </div>

        {/* 波形 */}
        {voiceChat.isPlaying && <WaveformBars volume={voiceChat.audioVolume} />}

        {/* マイクボタン */}
        <button
          onMouseDown={voiceChat.startRecording}
          onMouseUp={voiceChat.stopRecordingAndRespond}
          onMouseLeave={() => {
            if (voiceChat.isRecording) voiceChat.stopRecordingAndRespond();
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            voiceChat.startRecording();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            voiceChat.stopRecordingAndRespond();
          }}
          disabled={voiceChat.isPlaying}
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: voiceChat.isRecording
              ? "#ef4444"
              : voiceChat.isPlaying
                ? "#374151"
                : "#7c3aed",
            border: voiceChat.isRecording
              ? "4px solid rgba(252,165,165,0.5)"
              : "4px solid rgba(255,255,255,0.15)",
            color: "#fff",
            fontSize: 30,
            cursor: voiceChat.isPlaying ? "not-allowed" : "pointer",
            boxShadow: voiceChat.isRecording
              ? "0 0 0 16px rgba(239,68,68,0.15), 0 4px 20px rgba(0,0,0,0.5)"
              : "0 4px 20px rgba(0,0,0,0.4)",
            transition: "all 0.15s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            outline: "none",
            userSelect: "none",
          }}
        >
          🎤
        </button>

        {/* デバッグ情報 */}
        <div
          style={{
            color: "rgba(167,139,250,0.6)",
            fontSize: 11,
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          次のファイル: {nextFile}
          <br />
          再生済み: {voiceChat.responseIndex}/{totalFiles} (ループ)
        </div>

        {/* エラー */}
        {voiceChat.micError && (
          <div
            style={{
              background: "rgba(200,0,0,0.8)",
              color: "#fff",
              padding: "10px 18px",
              borderRadius: 10,
              fontSize: 13,
              maxWidth: 320,
              textAlign: "center",
            }}
          >
            {voiceChat.micError}
          </div>
        )}
      </div>
    </div>
  );
}
