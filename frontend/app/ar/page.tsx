"use client";

import { Canvas } from "@react-three/fiber";
import { Gltf, OrbitControls, Stage } from "@react-three/drei";
import { Suspense, useRef, useState } from "react";
import {
  XR,
  createXRStore,
  IfInSessionMode,
  useXRHitTest,
  XRDomOverlay,
} from "@react-three/xr";
import * as THREE from "three";

// ─── XRストア（emulate:false でVRエミュレーターを無効化） ──────────────────
const store = createXRStore({ emulate: false });

// ─── 3Dモデル一覧 ─────────────────────────────────────────────────────────
const MODELS = [
  { id: "nimo_anime", label: "Nimo (Anime)", src: "/models/nimo_anime.glb" },
  { id: "nimo", label: "Nimo", src: "/models/nimo.glb" },
  { id: "avatar", label: "Avatar", src: "/models/avatar.glb" },
] as const;

type ModelId = (typeof MODELS)[number]["id"];

const _hitMatrix = new THREE.Matrix4();

// ─── AR配置コンポーネント ─────────────────────────────────────────────────
function ARPlacementModel({
  src,
  selectedModel,
  setSelectedModel,
}: {
  src: string;
  selectedModel: ModelId;
  setSelectedModel: (id: ModelId) => void;
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

        {/* 配置ボタン(配置済みなら非表示) */}
        {!placed && (
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
}: {
  modelSrc: string;
  selectedModel: ModelId;
  setSelectedModel: (id: ModelId) => void;
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

// ─── ページ ───────────────────────────────────────────────────────────────
export default function ArPage() {
  const [selectedModel, setSelectedModel] = useState<ModelId>("nimo_anime");
  const [arError, setArError] = useState<string | null>(null);
  const modelSrc = MODELS.find((m) => m.id === selectedModel)!.src;

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
      {arError && (
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
          {arError}
        </div>
      )}
    </div>
  );
}
