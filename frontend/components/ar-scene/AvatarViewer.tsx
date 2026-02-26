"use client";

import React, { useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls, Center, Bounds } from "@react-three/drei";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";

// Polly viseme → 口の開き度マッピング
const VISEME_OPENNESS: Record<string, number> = {
  sil: 0.0,
  p: 0.05,
  f: 0.1,
  T: 0.15,
  t: 0.2,
  s: 0.2,
  S: 0.25,
  k: 0.3,
  u: 0.3,
  r: 0.35,
  i: 0.4,
  "@": 0.45,
  e: 0.55,
  E: 0.6,
  o: 0.65,
  O: 0.7,
  a: 0.8,
};

// モーフターゲット候補（優先順）
const MORPH_CANDIDATES = [
  "jawOpen",
  "mouthOpen",
  "viseme_aa",
  "viseme_O",
  "Fcl_MTH_A",
  "mouth_open",
  "A",
  "aa",
];

// 顎ボーン候補
const JAW_BONE_CANDIDATES = ["Jaw", "jaw", "mixamorigJaw", "CC_Base_JawRoot"];

// 頭ボーン候補（head bobフォールバック用）
const HEAD_BONE_CANDIDATES = ["head", "Head", "mixamorigHead"];

type AnimMethod =
  | { type: "morph"; mesh: THREE.SkinnedMesh; index: number }
  | { type: "bone"; bone: THREE.Bone }
  | { type: "head_bob"; bone: THREE.Bone; restRotX: number }
  | { type: "none" };

function discoverAnimMethod(scene: THREE.Group): AnimMethod {
  // Tier1: モーフターゲット検索
  let found: AnimMethod | null = null;
  scene.traverse((obj) => {
    if (!(obj instanceof THREE.SkinnedMesh)) return;
    const dict = obj.morphTargetDictionary;
    if (!dict) return;
    if (found) return;
    for (const name of MORPH_CANDIDATES) {
      if (name in dict) {
        console.log(`[AvatarViewer] Using morph target: "${name}"`);
        found = { type: "morph", mesh: obj, index: dict[name] };
        return;
      }
    }
  });
  if (found) return found;

  // Tier2: 顎ボーン検索
  let jawBone: THREE.Bone | null = null;
  scene.traverse((obj) => {
    if (jawBone || !(obj instanceof THREE.Bone)) return;
    if (JAW_BONE_CANDIDATES.includes(obj.name)) {
      console.log(`[AvatarViewer] Using jaw bone: "${obj.name}"`);
      jawBone = obj;
    }
  });
  if (jawBone) return { type: "bone", bone: jawBone };

  // Tier3: 頭ボーンで head bob フォールバック
  let headBone: THREE.Bone | null = null;
  scene.traverse((obj) => {
    if (headBone || !(obj instanceof THREE.Bone)) return;
    if (HEAD_BONE_CANDIDATES.includes(obj.name)) {
      console.log(`[AvatarViewer] Using head bob: "${obj.name}"`);
      headBone = obj;
    }
  });
  if (headBone) {
    const b = headBone as THREE.Bone;
    return { type: "head_bob", bone: b, restRotX: b.rotation.x };
  }

  console.warn("[AvatarViewer] No animation method found");
  return { type: "none" };
}

type VisemeState = { viseme: string; isSpeaking: boolean };

interface AvatarModelProps {
  visemeStateRef: React.MutableRefObject<VisemeState>;
}

function AvatarModel({ visemeStateRef }: AvatarModelProps) {
  const { scene: gltfScene } = useGLTF("/models/nimo_anime.glb");
  // SkeletonUtils.clone: SkinnedMesh のボーンバインディングを正しく再構築する
  // scene.clone(true) だと SkinnedMesh が元のスケルトンを参照したまま骨回転が無視される
  const scene = useMemo(() => SkeletonUtils.clone(gltfScene) as THREE.Group, [gltfScene]);
  const animMethodRef = useRef<AnimMethod | null>(null);
  // morph/bone 用: viseme openness をゆっくり補間
  const currentOpennessRef = useRef(0);
  // head_bob 用: 発話中 → ゆっくり 1 に近づき、無音 → ゆっくり 0 に戻る
  const speakingEnergyRef = useRef(0);

  useEffect(() => {
    animMethodRef.current = discoverAnimMethod(scene);
  }, [scene]);

  useFrame(({ clock }) => {
    const method = animMethodRef.current;
    if (!method || method.type === "none") return;

    const { viseme: currentViseme, isSpeaking } = visemeStateRef.current;

    if (method.type === "morph" || method.type === "bone") {
      // viseme ごとに openness を補間（lip sync）
      const target = isSpeaking ? (VISEME_OPENNESS[currentViseme] ?? 0) : 0;
      currentOpennessRef.current = THREE.MathUtils.lerp(
        currentOpennessRef.current,
        target,
        0.2,
      );
      const v = currentOpennessRef.current;
      if (method.type === "morph" && method.mesh.morphTargetInfluences) {
        method.mesh.morphTargetInfluences[method.index] = v;
      } else if (method.type === "bone") {
        method.bone.rotation.x = v * 0.35;
      }
    } else if (method.type === "head_bob") {
      // isSpeaking が true になったら素早く立ち上がり、false でゆっくり収束
      const energyTarget = isSpeaking ? 1 : 0;
      speakingEnergyRef.current = THREE.MathUtils.lerp(
        speakingEnergyRef.current,
        energyTarget,
        isSpeaking ? 0.15 : 0.03,
      );
      const energy = speakingEnergyRef.current;
      const bob = Math.sin(clock.elapsedTime * 4) * energy * 0.25;
      method.bone.rotation.x = method.restRotX + bob;
    }
  });

  return <primitive object={scene} />;
}

// デフォルト用の静的ref（AvatarCustomizer等で props 省略時に使用）
const DEFAULT_VISEME_REF = { current: { viseme: "sil", isSpeaking: false } };

interface AvatarViewerProps {
  visemeStateRef?: React.MutableRefObject<VisemeState>;
}

export const AvatarViewer = ({ visemeStateRef = DEFAULT_VISEME_REF }: AvatarViewerProps) => {
  return (
    <div className="bg-gradient-to-b from-blue-100 to-purple-100 rounded-lg overflow-hidden shadow-lg h-96">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 4, 2]} intensity={1.2} />
        <Bounds fit clip observe>
          <Center>
            <AvatarModel visemeStateRef={visemeStateRef} />
          </Center>
        </Bounds>
        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  );
};

useGLTF.preload("/models/nimo_anime.glb");
