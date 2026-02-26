"use client";

import React, { useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, OrbitControls, Center, Bounds } from "@react-three/drei";
import { createXRStore, XR, useXRHitTest } from "@react-three/xr";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";

const MODEL_PATH = "/models/Meshy_AI_Animation_Agree_Gesture_withSkin.glb";

// XRストア（ARセッション管理）
const xrStore = createXRStore({ offerSession: "immersive-ar" });

// Polly viseme → 口の開き度マッピング
const VISEME_OPENNESS: Record<string, number> = {
  sil: 0.0, p: 0.05, f: 0.1, T: 0.15, t: 0.2, s: 0.2,
  S: 0.25, k: 0.3, u: 0.3, r: 0.35, i: 0.4, "@": 0.45,
  e: 0.55, E: 0.6, o: 0.65, O: 0.7, a: 0.8,
};

const MORPH_CANDIDATES = [
  "jawOpen", "mouthOpen", "viseme_aa", "viseme_O",
  "Fcl_MTH_A", "mouth_open", "A", "aa",
];
const JAW_BONE_CANDIDATES = ["Jaw", "jaw", "mixamorigJaw", "CC_Base_JawRoot"];
const HEAD_BONE_CANDIDATES = ["head", "Head", "mixamorigHead"];

type AnimMethod =
  | { type: "morph"; mesh: THREE.SkinnedMesh; index: number }
  | { type: "bone"; bone: THREE.Bone }
  | { type: "head_bob"; bone: THREE.Bone; restRotX: number }
  | { type: "none" };

function discoverAnimMethod(scene: THREE.Group): AnimMethod {
  let found: AnimMethod | null = null;
  scene.traverse((obj) => {
    if (!(obj instanceof THREE.SkinnedMesh)) return;
    const dict = obj.morphTargetDictionary;
    if (!dict || found) return;
    for (const name of MORPH_CANDIDATES) {
      if (name in dict) {
        console.log(`[AvatarViewer] Using morph target: "${name}"`);
        found = { type: "morph", mesh: obj, index: dict[name] };
        return;
      }
    }
  });
  if (found) return found;

  let jawBone: THREE.Bone | null = null;
  scene.traverse((obj) => {
    if (jawBone || !(obj instanceof THREE.Bone)) return;
    if (JAW_BONE_CANDIDATES.includes(obj.name)) {
      console.log(`[AvatarViewer] Using jaw bone: "${obj.name}"`);
      jawBone = obj;
    }
  });
  if (jawBone) return { type: "bone", bone: jawBone };

  const bonePositions: { name: string; pos: THREE.Vector3 }[] = [];
  scene.traverse((obj) => {
    if (!(obj instanceof THREE.Bone)) return;
    const pos = new THREE.Vector3();
    obj.getWorldPosition(pos);
    bonePositions.push({ name: obj.name, pos: pos.clone() });
  });
  const sorted = [...bonePositions].sort((a, b) => b.pos.y - a.pos.y);
  console.log("[AvatarViewer] Bones (Y desc):", sorted.map(b => `${b.name}(${b.pos.y.toFixed(2)})`));

  let headBone: THREE.Bone | null = null;
  scene.traverse((obj) => {
    if (headBone || !(obj instanceof THREE.Bone)) return;
    if (HEAD_BONE_CANDIDATES.includes(obj.name)) headBone = obj;
  });
  if (headBone) {
    const b = headBone as THREE.Bone;
    return { type: "head_bob", bone: b, restRotX: b.rotation.x };
  }

  console.warn("[AvatarViewer] No animation method found");
  return { type: "none" };
}

type VisemeState = { viseme: string; isSpeaking: boolean };

// アバターモデル本体（lip sync アニメーション付き）
function AvatarModel({ visemeStateRef }: { visemeStateRef: React.MutableRefObject<VisemeState> }) {
  const { scene: gltfScene } = useGLTF(MODEL_PATH);
  const scene = useMemo(() => SkeletonUtils.clone(gltfScene) as THREE.Group, [gltfScene]);
  const animMethodRef = useRef<AnimMethod | null>(null);
  const currentOpennessRef = useRef(0);
  const speakingEnergyRef = useRef(0);

  useEffect(() => {
    animMethodRef.current = discoverAnimMethod(scene);
  }, [scene]);

  useFrame(({ clock }) => {
    const method = animMethodRef.current;
    if (!method || method.type === "none") return;
    const { viseme: currentViseme, isSpeaking } = visemeStateRef.current;

    if (method.type === "morph" || method.type === "bone") {
      const target = isSpeaking ? (VISEME_OPENNESS[currentViseme] ?? 0) : 0;
      currentOpennessRef.current = THREE.MathUtils.lerp(currentOpennessRef.current, target, 0.2);
      const v = currentOpennessRef.current;
      if (method.type === "morph" && method.mesh.morphTargetInfluences) {
        method.mesh.morphTargetInfluences[method.index] = v;
      } else if (method.type === "bone") {
        method.bone.rotation.x = v * 0.35;
      }
    } else if (method.type === "head_bob") {
      speakingEnergyRef.current = THREE.MathUtils.lerp(
        speakingEnergyRef.current, isSpeaking ? 1 : 0, isSpeaking ? 0.15 : 0.03,
      );
      const energy = speakingEnergyRef.current;
      const t = clock.elapsedTime;
      method.bone.rotation.x = method.restRotX + Math.sin(t * 4) * energy * 0.6;
      method.bone.rotation.z = Math.sin(t * 4 + Math.PI / 3) * energy * 0.3;
    }
  });

  return <primitive object={scene} />;
}

// AR空間でのアバター（カメラ前方1.5mに配置）
function ARSceneContent({ visemeStateRef }: { visemeStateRef: React.MutableRefObject<VisemeState> }) {
  const groupRef = useRef<THREE.Group>(null);
  const floorYRef = useRef(0);
  const { camera } = useThree();
  const tmpDirRef = useRef(new THREE.Vector3());
  const matrixHelperRef = useRef(new THREE.Matrix4());

  // 床面ヒットテストで床のY座標のみ記録
  useXRHitTest(
    (results: XRHitTestResult[], getWorldMatrix: (target: THREE.Matrix4, result: XRHitTestResult) => void) => {
      if (results.length === 0) return;
      getWorldMatrix(matrixHelperRef.current, results[0]);
      floorYRef.current = new THREE.Vector3().setFromMatrixPosition(matrixHelperRef.current).y;
    },
    "viewer",
    "plane",
  );

  // カメラ前方1.5mにアバターを配置し、ユーザーに向ける
  useFrame(() => {
    if (!groupRef.current) return;
    const dir = tmpDirRef.current;
    camera.getWorldDirection(dir);
    dir.y = 0;
    if (dir.lengthSq() < 0.001) return;
    dir.normalize();
    groupRef.current.position.set(
      camera.position.x + dir.x * 1.5,
      floorYRef.current,
      camera.position.z + dir.z * 1.5,
    );
    groupRef.current.rotation.y = Math.atan2(dir.x, dir.z) + Math.PI;
  });

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 4, 2]} intensity={1.5} />
      <group ref={groupRef}>
        <AvatarModel visemeStateRef={visemeStateRef} />
      </group>
    </>
  );
}

const DEFAULT_VISEME_REF = { current: { viseme: "sil", isSpeaking: false } };

interface AvatarViewerProps {
  visemeStateRef?: React.MutableRefObject<VisemeState>;
}

export const AvatarViewer = ({ visemeStateRef = DEFAULT_VISEME_REF }: AvatarViewerProps) => {
  const [isARSupported, setIsARSupported] = useState<boolean | null>(null);

  useEffect(() => {
    // 両パスを Promise に統一し、setState を常に非同期コールバック内で呼ぶ
    const promise: Promise<boolean> =
      typeof navigator !== "undefined" && "xr" in navigator
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (navigator as any).xr.isSessionSupported("immersive-ar")
        : Promise.resolve(false);

    promise.then(setIsARSupported).catch(() => setIsARSupported(false));
  }, []);

  return (
    <div className="relative bg-gradient-to-b from-blue-100 to-purple-100 rounded-lg overflow-hidden shadow-lg h-96">
      <Canvas
        camera={{ position: [0, 1.5, 4], fov: 45 }}
        gl={{ antialias: true }}
      >
        <XR store={xrStore}>
          {/* 通常ビュー */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 4, 2]} intensity={1.2} />
          <Bounds fit clip observe>
            <Center>
              <AvatarModel visemeStateRef={visemeStateRef} />
            </Center>
          </Bounds>
          <OrbitControls enablePan={false} target={[0, 1, 0]} />

          {/* ARビュー（XRセッション中のみ有効） */}
          <ARSceneContent visemeStateRef={visemeStateRef} />
        </XR>
      </Canvas>

      {/* ARボタン：WebXR対応デバイスのみ表示 */}
      {isARSupported && (
        <button
          onClick={() => xrStore.enterAR()}
          className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-purple-700 font-bold text-sm px-4 py-2 rounded-full shadow-lg border border-purple-200 flex items-center gap-2"
        >
          📷 ARで見る
        </button>
      )}
    </div>
  );
};

useGLTF.preload(MODEL_PATH);
