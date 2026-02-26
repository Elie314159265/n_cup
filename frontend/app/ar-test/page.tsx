"use client";

import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { Suspense, useState, useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { XR, createXRStore } from "@react-three/xr";
import { useSearchParams } from "next/navigation";
import {
  VRMLoaderPlugin,
  VRM,
  VRMExpressionPresetName,
} from "@pixiv/three-vrm";
// 音声認識部分を削除しました（事前用意のMP3再生のみ使用）
import { createArSession } from "../../actions/ar-sessions";
// ActionCable は音声認識ストリーミング用のため削除

// ─── XRストア ─────────────────────────────────────────────────────────────
const store = createXRStore({ emulate: false });
// VRoid Studioで書き出した .vrm ファイルを public/models/ に配置してください
const MODEL_SRC = "/models/bakubijo.vrm";
// 事前に用意した音声を public/audio/ に配置してください
const AUDIO_SRC = "/audio/bakubijo.mp3";

// ─── 会話履歴エントリ ─────────────────────────────────────────────────────
export type TranscriptEntry = {
  role: "user" | "assistant";
  text: string;
};

// ─── 音声会話フック（実API版） ────────────────────────────────────────────
function useVoiceChat(_arSessionId: number | null) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0);
  const animFrameRef = useRef<number | null>(null);

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

  return { isPlaying, audioVolume, playAudioUrl };
}

// ─── VRMアバターコンポーネント（リップシンク対応） ─────────────────────────
function VRMAvatar({
  src,
  scale,
  audioVolume,
}: {
  src: string;
  scale: number;
  audioVolume: number; // 0〜255
}) {
  const gltf = useLoader(GLTFLoader, src, (loader) => {
    loader.register((parser) => new VRMLoaderPlugin(parser));
  });
  const vrm = gltf.userData.vrm as VRM | undefined;

  // ロード後にTポーズ → 自然な腕を下げたポーズへ
  useEffect(() => {
    if (!vrm) return;
    const leftArm = vrm.humanoid.getNormalizedBoneNode("leftUpperArm");
    const rightArm = vrm.humanoid.getNormalizedBoneNode("rightUpperArm");
    if (leftArm) leftArm.rotation.z = -Math.PI / 2.5; // 左上腕を下へ60度
    if (rightArm) rightArm.rotation.z = Math.PI / 2.5; // 右上腕を下へ60度
    vrm.update(0);
  }, [vrm]);

  useFrame((_, delta) => {
    if (!vrm) return;
    // 音量(0〜255) → 口の開き(0〜1)
    const mouthValue = Math.min(audioVolume / 80, 1.0);
    vrm.expressionManager?.setValue(VRMExpressionPresetName.Aa, mouthValue);
    // スプリングボーン（髪・服の揺れ）を更新
    vrm.update(delta);
  });

  if (!vrm) return null;
  return <primitive object={vrm.scene} scale={scale} />;
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
  audioVolume,
}: {
  modelSrc: string;
  placed: boolean;
  placedPosition: THREE.Vector3 | null;
  cameraStateRef: React.MutableRefObject<{
    pos: THREE.Vector3;
    dir: THREE.Vector3;
  } | null>;
  audioVolume: number;
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
        // AR固定後: 世界座標に配置
        <group
          position={[placedPosition.x, placedPosition.y, placedPosition.z]}
        >
          <Suspense fallback={null}>
            <VRMAvatar src={modelSrc} scale={1.0} audioVolume={audioVolume} />
          </Suspense>
        </group>
      ) : placed && !placedPosition ? (
        // 通常モード: カメラ正面の固定位置
        <group position={[0, -1, -2]}>
          <Suspense fallback={null}>
            <VRMAvatar src={modelSrc} scale={1.0} audioVolume={audioVolume} />
          </Suspense>
        </group>
      ) : (
        // ARプレビュー中: useFrame で追従する group を使う
        <group ref={groupRef}>
          <Suspense fallback={null}>
            <VRMAvatar src={modelSrc} scale={1.0} audioVolume={0} />
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

  const [arError, setArError] = useState<string | null>(null);
  const [arSessionId, setArSessionId] = useState<number | null>(
    arSessionIdParam ? Number(arSessionIdParam) : null,
  );
  const [arMode, setArMode] = useState(false); // ARモード切り替え
  const [inAR, setInAR] = useState(false); // AR起動済み（配置前）
  // 通常モードでは placed=true・placedPosition=null で起動時から表示
  const [placed, setPlaced] = useState(true);
  const [placedPosition, setPlacedPosition] = useState<THREE.Vector3 | null>(
    null,
  );
  // SceneContent 内のカメラ状態を受け取るための共有 ref
  const cameraStateRef = useRef<{
    pos: THREE.Vector3;
    dir: THREE.Vector3;
  } | null>(null);

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
      // ARに失敗したら通常モードに戻す
      setArMode(false);
      setPlaced(true);
    }
  };

  const handleToggleMode = () => {
    if (!arMode) {
      // 通常 → AR
      setArMode(true);
      handleEnterAR();
    } else {
      // AR → 通常
      setArMode(false);
      setInAR(false);
      setPlaced(true);
      setPlacedPosition(null);
      setArError(null);
      // WebXR セッションを終了
      store
        .getState()
        .session?.end()
        .catch(() => {});
    }
  };

  return (
    <div className="w-screen h-screen bg-[#0a0a0a] relative touch-none">
      {/* Three.js Canvas - 常にモデルを描画 */}
      <Canvas
        camera={{ position: [0, 0, 0.01], fov: 70 }}
        gl={{ alpha: true, antialias: true }}
        style={{ position: "absolute", inset: 0 }}
      >
        <XR store={store}>
          <SceneContent
            modelSrc={MODEL_SRC}
            placed={placed}
            placedPosition={placedPosition}
            cameraStateRef={cameraStateRef}
            audioVolume={voiceChat.audioVolume}
          />
        </XR>
      </Canvas>

      {/* モード切り替えトグル（右上） */}
      <button
        onClick={handleToggleMode}
        className="fixed top-5 right-5 z-30 px-4 py-2 rounded-full text-white text-sm font-bold backdrop-blur border border-white/30 shadow-lg"
        style={{ background: arMode ? "#7c3aed" : "rgba(0,0,0,0.55)" }}
      >
        {arMode ? "📷 AR中" : "🖥️ 通常"}
      </button>

      {/* ARプレビュー中（配置前）: カメラを向けて固定ボタン */}
      {arMode && inAR && !placed && (
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
            {voiceChat.isPlaying ? "💬 再生中..." : "▶️ 再生"}
          </div>
          {voiceChat.isPlaying && (
            <WaveformBars volume={voiceChat.audioVolume} />
          )}
          <div className="flex gap-4 items-center">
            <button
              onClick={() => voiceChat.playAudioUrl(AUDIO_SRC)}
              disabled={voiceChat.isPlaying}
              style={{
                background: voiceChat.isPlaying ? "#6b7280" : "#059669",
                border: "4px solid rgba(255,255,255,0.25)",
                WebkitTapHighlightColor: "transparent",
              }}
              className="w-20 h-20 rounded-full text-white text-[32px] flex items-center justify-center outline-none"
            >
              {voiceChat.isPlaying ? "🔊" : "▶️"}
            </button>
          </div>
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
