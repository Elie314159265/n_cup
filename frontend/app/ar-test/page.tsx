"use client";

import { Canvas } from "@react-three/fiber";
import { Stage, OrbitControls, Gltf} from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";

// アバターを表示するコンポーネント
function Avatar() {
  // public/models/avatar.glb を配置してください
  // v6以降は <Gltf /> コンポーネントを使うのが最も簡潔です
  return <Gltf src="/models/nimo_anime.glb" scale={1} position={[0, -1, 0]} />;
}

export default function AvatarPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

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
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          backgroundColor: "#111",
          zIndex: 0,
        }}
      />

      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        style={{ position: "absolute", inset: 0, zIndex: 1 }}
      >
        {/* 透過キャンバスにして背面のカメラ映像を見せる */}

        {/* ステージ設定（これだけでライティングと影が完璧になります） */}
        <Stage intensity={0.5} environment="city" adjustCamera={false}>
          <Suspense fallback={null}>
            <Avatar />
          </Suspense>
        </Stage>

        {/* マウスやタップでアバターを回転・ズームできる */}
        <OrbitControls
          makeDefault
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 1.75}
        />
      </Canvas>

      {/* UIを重ねる場合はここに記述 */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          width: "100%",
          textAlign: "center",
          zIndex: 2,
        }}
      >
        <h1 style={{ color: "white", textShadow: "2px 2px 4px black" }}>
          Avatar AR Preview
        </h1>
        {cameraError && (
          <p style={{ color: "#ffdddd", textShadow: "1px 1px 2px black" }}>
            {cameraError}
          </p>
        )}
      </div>
    </div>
  );
}
