"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

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

type AnimMethod =
  | { type: "morph"; mesh: THREE.SkinnedMesh; index: number }
  | { type: "bone"; bone: THREE.Bone }
  | { type: "none" };

function discoverAnimMethod(scene: THREE.Group): AnimMethod {
  // Tier1: モーフターゲット検索
  let found: AnimMethod | null = null;
  scene.traverse((obj) => {
    if (found) return;
    if (!(obj instanceof THREE.SkinnedMesh)) return;
    const dict = obj.morphTargetDictionary;
    if (!dict) return;
    for (const name of MORPH_CANDIDATES) {
      if (name in dict) {
        console.log(`[AvatarViewer] Found morph target: "${name}"`);
        found = { type: "morph", mesh: obj, index: dict[name] };
        return;
      }
    }
  });
  if (found) return found;

  // Tier2: 顎ボーン検索
  let bone: THREE.Bone | null = null;
  scene.traverse((obj) => {
    if (bone) return;
    if (!(obj instanceof THREE.Bone)) return;
    if (JAW_BONE_CANDIDATES.includes(obj.name)) {
      console.log(`[AvatarViewer] Found jaw bone: "${obj.name}"`);
      bone = obj;
    }
  });
  if (bone) return { type: "bone", bone };

  // Tier3: フォールバック
  console.warn("[AvatarViewer] No morph target or jaw bone found");
  return { type: "none" };
}

interface AvatarModelProps {
  currentViseme: string;
  isSpeaking: boolean;
}

function AvatarModel({ currentViseme, isSpeaking }: AvatarModelProps) {
  const { scene } = useGLTF("/models/nimo_anime.glb");
  const animMethodRef = useRef<AnimMethod | null>(null);
  const currentOpennessRef = useRef(0);

  useEffect(() => {
    animMethodRef.current = discoverAnimMethod(scene);
  }, [scene]);

  useFrame(() => {
    const method = animMethodRef.current;
    if (!method || method.type === "none") return;

    const target = isSpeaking
      ? (VISEME_OPENNESS[currentViseme] ?? 0)
      : 0;

    // lerp で滑らかに補間
    currentOpennessRef.current = THREE.MathUtils.lerp(
      currentOpennessRef.current,
      target,
      0.3,
    );
    const v = currentOpennessRef.current;

    if (method.type === "morph") {
      if (method.mesh.morphTargetInfluences) {
        method.mesh.morphTargetInfluences[method.index] = v;
      }
    } else if (method.type === "bone") {
      method.bone.rotation.x = v * 0.35;
    }
  });

  return (
    <primitive
      object={scene}
      scale={1.5}
      position={[0, -1.5, 0]}
    />
  );
}

interface AvatarViewerProps {
  isSpeaking?: boolean;
  currentViseme?: string;
}

export const AvatarViewer = ({
  isSpeaking = false,
  currentViseme = "sil",
}: AvatarViewerProps) => {
  return (
    <div className="bg-gradient-to-b from-blue-100 to-purple-100 rounded-lg overflow-hidden shadow-lg h-96">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 45 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 4, 2]} intensity={1.2} />
        <AvatarModel currentViseme={currentViseme} isSpeaking={isSpeaking} />
        <OrbitControls
          enablePan={false}
          minDistance={1.5}
          maxDistance={6}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
};

useGLTF.preload("/models/nimo_anime.glb");
