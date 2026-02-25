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
    <div className="flex items-center gap-[5px] h-11">
      {heights.map((base, i) => (
        <div
          key={i}
          style={{
            height: Math.max(6, base * (10 + (volume / 255) * 34)),
          }}
          className="w-[6px] rounded bg-gradient-to-t from-[#7c3aed] to-[#a78bfa] transition-[height] duration-[80ms] ease-in-out"
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
    <div className="w-screen h-screen bg-[linear-gradient(135deg,#0f0a1e_0%,#1a0f3c_100%)] flex flex-col items-center justify-center font-sans relative overflow-hidden">
      {/* デバッグバッジ */}
      <div className="absolute top-3 left-3 bg-[rgba(124,58,237,0.3)] border border-[#7c3aed] text-[#a78bfa] px-[10px] py-1 rounded-md text-[11px] font-bold tracking-[1px]">
        VOICE DEBUG
      </div>

      {/* モデル切り替え */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-2 bg-white/[0.07] px-[10px] py-[6px] rounded-full backdrop-blur">
        {MODELS.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedModel(m.id)}
            style={{
              background: selectedModel === m.id ? "#7c3aed" : "transparent",
              border:
                selectedModel === m.id
                  ? "1px solid #7c3aed"
                  : "1px solid rgba(255,255,255,0.2)",
            }}
            className="px-[14px] py-[5px] text-white rounded-full text-[13px] cursor-pointer transition-all duration-150"
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* 3Dアバター */}
      <div className="w-full h-[65vh]">
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
      <div className="flex flex-col items-center gap-[14px] pb-6">
        {/* ステータス */}
        <div className="text-[#e2d9f3] text-[15px] font-medium bg-white/[0.08] py-[7px] px-5 rounded-full min-w-[200px] text-center">
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
            background: voiceChat.isRecording
              ? "#ef4444"
              : voiceChat.isPlaying
                ? "#374151"
                : "#7c3aed",
            border: voiceChat.isRecording
              ? "4px solid rgba(252,165,165,0.5)"
              : "4px solid rgba(255,255,255,0.15)",
            boxShadow: voiceChat.isRecording
              ? "0 0 0 16px rgba(239,68,68,0.15), 0 4px 20px rgba(0,0,0,0.5)"
              : "0 4px 20px rgba(0,0,0,0.4)",
          }}
          className={`w-20 h-20 rounded-full text-white text-[30px] flex items-center justify-center outline-none select-none transition-all duration-150 ease-in-out ${
            voiceChat.isPlaying ? "cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          🎤
        </button>

        {/* デバッグ情報 */}
        <div className="text-[rgba(167,139,250,0.6)] text-[11px] text-center leading-relaxed">
          次のファイル: {nextFile}
          <br />
          再生済み: {voiceChat.responseIndex}/{totalFiles} (ループ)
        </div>

        {/* エラー */}
        {voiceChat.micError && (
          <div className="bg-[rgba(200,0,0,0.8)] text-white py-[10px] px-[18px] rounded-[10px] text-[13px] max-w-[320px] text-center">
            {voiceChat.micError}
          </div>
        )}
      </div>
    </div>
  );
}
