"use client";

import { Canvas } from "@react-three/fiber";
import { Stage, OrbitControls, Gltf } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import { MousePointer2, Camera } from "lucide-react";

// アバターを表示するコンポーネント
function Avatar() {
  return <Gltf src="/models/nimo_anime.glb" scale={1} position={[0, -1, 0]} />;
}

export default function AvatarPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const setupCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsReady(true);
        }
      } catch {
        setCameraError(
          "カメラの許可が必要です（ブラウザ設定を確認してください）",
        );
      }
    };

    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="w-screen h-screen relative overflow-hidden bg-black">
      {/* カメラ映像 */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* グラデーションオーバーレイ（上下に薄くかける） */}
      <div
        className="absolute inset-0 z-1 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(88,28,135,0.25) 0%, transparent 35%, transparent 65%, rgba(15,10,40,0.55) 100%)",
        }}
      />

      {/* 3D キャンバス */}
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        style={{ position: "absolute", inset: 0, zIndex: 2 }}
      >
        <Stage intensity={0.5} environment="city" adjustCamera={false}>
          <Suspense fallback={null}>
            <Avatar />
          </Suspense>
        </Stage>

        <OrbitControls
          makeDefault
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 1.75}
        />
      </Canvas>

      {/* --- ヘッダー バッジ --- */}
      <div className="absolute top-5 left-0 right-0 flex justify-center z-3 pointer-events-none">
        <div
          className="flex items-center gap-2 px-5 py-2 rounded-full text-white text-sm font-semibold tracking-wide"
          style={{
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.22)",
            boxShadow: "0 4px 24px rgba(139,92,246,0.25)",
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{
              background: isReady ? "#a78bfa" : "#6b7280",
              boxShadow: isReady ? "0 0 8px #a78bfa" : "none",
              display: "inline-block",
            }}
          />
          Avatar AR Preview
        </div>
      </div>

      {/* --- フッター エリア --- */}
      <div className="absolute bottom-0 left-0 right-0 z-3 flex flex-col items-center pb-8 gap-3">
        {/* ヒント pill */}
        <div
          className="flex items-center gap-2 px-4 py-1.5 rounded-full text-white/70 text-xs"
          style={{
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.13)",
          }}
        >
          <MousePointer2 size={12} className="opacity-60" />
          <span>ドラッグで回転 / ピンチでズーム</span>
        </div>

        {/* エラーメッセージ */}
        {cameraError && (
          <div
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm max-w-xs text-center"
            style={{
              background: "rgba(239,68,68,0.18)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(239,68,68,0.35)",
              color: "#fca5a5",
              boxShadow: "0 4px 20px rgba(239,68,68,0.2)",
            }}
          >
            <Camera size={15} className="opacity-70 shrink-0" />
            <span>{cameraError}</span>
          </div>
        )}
      </div>

      {/* --- 右上 AR バッジ --- */}
      <div className="absolute top-5 right-5 z-3">
        <div
          className="px-3 py-1 rounded-full text-xs font-bold tracking-widest"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #ec4899)",
            color: "#fff",
            boxShadow: "0 0 16px rgba(124,58,237,0.5)",
          }}
        >
          AR
        </div>
      </div>
    </div>
  );
}
