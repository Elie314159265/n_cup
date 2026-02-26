"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ── 定数 ──────────────────────────────────────────────
const DURATION = 4.2;
const RIBBON_COUNT = 200;
const HEART_COUNT = 30;
const STAR_COUNT = 60;
const ORBS_COUNT = 20;

const PALETTE = [
  new THREE.Color("#ff6eb4"),
  new THREE.Color("#ff3fa4"),
  new THREE.Color("#c084fc"),
  new THREE.Color("#a855f7"),
  new THREE.Color("#fbbf24"),
  new THREE.Color("#fb923c"),
  new THREE.Color("#f9a8d4"),
  new THREE.Color("#e879f9"),
  new THREE.Color("#ffffff"),
];

// ── ハートジオメトリ（カスタム Shape） ───────────────────────────────────
function createHeartShape(size: number = 1): THREE.Shape {
  const s = new THREE.Shape();
  const x = 0,
    y = 0;
  s.moveTo(x, y + size * 0.25);
  s.bezierCurveTo(
    x,
    y + size * 0.5,
    x - size * 0.5,
    y + size * 0.6,
    x - size * 0.5,
    y + size * 0.25,
  );
  s.bezierCurveTo(
    x - size * 0.5,
    y - size * 0.1,
    x,
    y - size * 0.4,
    x,
    y - size * 0.75,
  );
  s.bezierCurveTo(
    x,
    y - size * 0.4,
    x + size * 0.5,
    y - size * 0.1,
    x + size * 0.5,
    y + size * 0.25,
  );
  s.bezierCurveTo(
    x + size * 0.5,
    y + size * 0.6,
    x,
    y + size * 0.5,
    x,
    y + size * 0.25,
  );
  return s;
}

// ── カメラアニメーション ──────────────────────────────────────────────────
function AnimatedCamera() {
  const timeRef = useRef(0);

  useFrame(({ camera }, delta) => {
    const t = (timeRef.current += delta);
    if (t > DURATION) return;
    const fov = 60 + Math.sin(t * 0.8) * 5;
    (camera as THREE.PerspectiveCamera).fov = fov;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    camera.position.set(
      Math.sin(t * 0.28) * 1.0,
      Math.cos(t * 0.18) * 0.6,
      10 + Math.sin(t * 0.5) * 0.5,
    );
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// ── リボンコンフェッティ（3D 物理） ──────────────────────────────────────
type RibbonData = {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Euler;
  rotSpd: THREE.Vector3;
  col: THREE.Color;
  sx: number;
  sy: number;
  delay: number;
};

function Ribbons() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const t = useRef(0);
  const d = useRef(new THREE.Object3D());

  const ribbons = useRef<RibbonData[]>([]);

  useEffect(() => {
    ribbons.current = Array.from({ length: RIBBON_COUNT }, (_, i) => {
      const angle = (i / RIBBON_COUNT) * Math.PI * 2;
      const r = Math.random() * 1.5;
      return {
        pos: new THREE.Vector3(
          Math.cos(angle) * r,
          (Math.random() - 0.4) * 3,
          Math.sin(angle) * r,
        ),
        vel: new THREE.Vector3(
          Math.cos(angle) * (Math.random() * 9 + 4) + (Math.random() - 0.5) * 4,
          Math.random() * 13 + 5,
          Math.sin(angle) * (Math.random() * 7 + 3) + (Math.random() - 0.5) * 4,
        ),
        rot: new THREE.Euler(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
        ),
        rotSpd: new THREE.Vector3(
          (Math.random() - 0.5) * 18,
          (Math.random() - 0.5) * 18,
          (Math.random() - 0.5) * 18,
        ),
        col: PALETTE[Math.floor(Math.random() * PALETTE.length)].clone(),
        sx: Math.random() * 0.13 + 0.06,
        sy: Math.random() * 0.55 + 0.22,
        delay: Math.random() * 0.25,
      };
    });
  }, []);

  useFrame((_, delta) => {
    const now = (t.current += delta);
    if (now > DURATION || !meshRef.current) return;
    const fade = now > 3.2 ? Math.max(0, 1 - (now - 3.2) / 1.0) : 1;
    const obj = d.current;

    ribbons.current.forEach((p, i) => {
      const pt = Math.max(0, now - p.delay);
      const drag = Math.pow(0.95, pt * 2);
      p.vel.y -= 9 * delta;
      p.pos.x += p.vel.x * delta * drag;
      p.pos.y += p.vel.y * delta;
      p.pos.z += p.vel.z * delta * drag;
      if (p.pos.y < -14) {
        p.pos.y = -14;
        p.vel.y *= -0.4;
      }

      obj.position.copy(p.pos);
      obj.rotation.set(
        p.rot.x + p.rotSpd.x * pt,
        p.rot.y + p.rotSpd.y * pt,
        p.rot.z + p.rotSpd.z * pt,
      );
      const wibble = 1 + Math.sin(pt * 9 + i) * 0.15;
      obj.scale.set(p.sx * fade * wibble, p.sy * fade, 0.015);
      obj.updateMatrix();
      meshRef.current!.setMatrixAt(i, obj.matrix);
      meshRef.current!.setColorAt(i, p.col);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor)
      meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, RIBBON_COUNT]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        vertexColors
        emissive="#ffffff"
        emissiveIntensity={0.35}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

// ── 3D 押し出しハート ─────────────────────────────────────────────────────
type HeartParticleData = {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Euler;
  rotSpd: THREE.Vector3;
  scale: number;
  phase: number;
  col: THREE.Color;
};

function Hearts3D() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const t = useRef(0);
  const d = useRef(new THREE.Object3D());

  const geo = useMemo(() => {
    const shape = createHeartShape(0.55);
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: 0.22,
      bevelEnabled: true,
      bevelSize: 0.04,
      bevelThickness: 0.04,
      bevelSegments: 6,
    });
    g.center();
    return g;
  }, []);

  const hearts = useRef<HeartParticleData[]>([]);

  useEffect(() => {
    hearts.current = Array.from({ length: HEART_COUNT }, (_, i) => {
      const angle = (i / HEART_COUNT) * Math.PI * 2;
      return {
        pos: new THREE.Vector3(
          Math.cos(angle) * 0.6,
          -1,
          Math.sin(angle) * 0.6,
        ),
        vel: new THREE.Vector3(
          Math.cos(angle) * (Math.random() * 5 + 2),
          Math.random() * 10 + 6,
          Math.sin(angle) * (Math.random() * 4 + 2),
        ),
        rot: new THREE.Euler(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          0,
        ),
        rotSpd: new THREE.Vector3(
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 3,
        ),
        scale: Math.random() * 0.6 + 0.28,
        phase: Math.random() * Math.PI * 2,
        col:
          i % 3 === 0
            ? new THREE.Color("#ff6eb4")
            : i % 3 === 1
              ? new THREE.Color("#e879f9")
              : new THREE.Color("#fbbf24"),
      };
    });
  }, []);

  useFrame((_, delta) => {
    const now = (t.current += delta);
    if (now > DURATION || !meshRef.current) return;
    const fade = now > 3.0 ? Math.max(0, 1 - (now - 3.0) / 1.2) : 1;
    const obj = d.current;

    hearts.current.forEach((p) => {
      p.vel.y -= 5 * delta;
      p.pos.addScaledVector(p.vel, delta);
      p.vel.x *= 0.98;
      p.vel.z *= 0.98;

      const pulse = 1 + Math.sin(now * 3.5 + p.phase) * 0.2;
      const wob = Math.sin(now * 2 + p.phase) * 0.35;
      obj.position.set(p.pos.x + wob * 0.3, p.pos.y, p.pos.z);
      obj.rotation.set(
        p.rot.x + p.rotSpd.x * now,
        p.rot.y + p.rotSpd.y * now + wob * 0.5,
        p.rot.z + p.rotSpd.z * now,
      );
      const s = p.scale * pulse * fade;
      obj.scale.set(s, s, s);
      obj.updateMatrix();
      const idx = hearts.current.indexOf(p);
      meshRef.current!.setMatrixAt(idx, obj.matrix);
      meshRef.current!.setColorAt(idx, p.col);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor)
      meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geo, undefined, HEART_COUNT]}>
      <meshStandardMaterial
        vertexColors
        emissive="#ff6eb4"
        emissiveIntensity={2.5}
        toneMapped={false}
        roughness={0.15}
        metalness={0.3}
      />
    </instancedMesh>
  );
}

// ── 3D スターバースト ─────────────────────────────────────────────────────
type StarData = {
  vel: THREE.Vector3;
  col: THREE.Color;
  scale: number;
  phase: number;
  delay: number;
};

function Stars() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const t = useRef(0);
  const d = useRef(new THREE.Object3D());

  const stars = useRef<StarData[]>([]);

  useEffect(() => {
    stars.current = Array.from({ length: STAR_COUNT }, () => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const spd = Math.random() * 15 + 8;
      return {
        vel: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * spd,
          Math.sin(phi) * Math.sin(theta) * spd,
          Math.cos(phi) * spd,
        ),
        col: PALETTE[Math.floor(Math.random() * PALETTE.length)].clone(),
        scale: Math.random() * 0.32 + 0.12,
        phase: Math.random() * Math.PI * 2,
        delay: Math.random() * 0.15,
      };
    });
  }, []);

  const geo = useMemo(() => {
    const verts: number[] = [];
    const n = 5;
    for (let i = 0; i < n * 2; i++) {
      const r = i % 2 === 0 ? 1 : 0.42;
      const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
      verts.push(Math.cos(a) * r, Math.sin(a) * r, 0);
    }
    verts.push(0, 0, 0);
    const idx: number[] = [];
    for (let i = 0; i < n * 2; i++) idx.push(n * 2, i, (i + 1) % (n * 2));
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, []);

  useFrame((_, delta) => {
    const now = (t.current += delta);
    if (now > DURATION || !meshRef.current) return;
    const fade = now > 3.0 ? Math.max(0, 1 - (now - 3.0) / 1.2) : 1;
    const obj = d.current;

    stars.current.forEach((p, i) => {
      const pt = Math.max(0, now - p.delay);
      const decay = Math.exp(-pt * 0.8);
      const pulse = 1 + Math.sin(pt * 5 + p.phase) * 0.25;
      const s = p.scale * pulse * fade * (1 - Math.max(0, pt - 2) * 0.3);
      obj.position.set(
        p.vel.x * pt * decay,
        p.vel.y * pt * decay,
        p.vel.z * pt * decay,
      );
      obj.rotation.set(0, 0, pt * 6 + p.phase);
      obj.scale.set(s, s, s * 0.3);
      obj.updateMatrix();
      meshRef.current!.setMatrixAt(i, obj.matrix);
      meshRef.current!.setColorAt(i, p.col);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor)
      meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geo, undefined, STAR_COUNT]}>
      <meshBasicMaterial vertexColors toneMapped={false} />
    </instancedMesh>
  );
}

// ── 螺旋オーブ ────────────────────────────────────────────────────────────
type OrbData = {
  phase: number;
  radius: number;
  speed: number;
  height: number;
  col: THREE.Color;
  scale: number;
};

function SpiralOrbs() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const t = useRef(0);
  const d = useRef(new THREE.Object3D());

  const orbs = useRef<OrbData[]>([]);

  useEffect(() => {
    orbs.current = Array.from({ length: ORBS_COUNT }, (_, i) => ({
      phase: (i / ORBS_COUNT) * Math.PI * 2,
      radius: Math.random() * 3 + 1.5,
      speed: Math.random() * 2.5 + 1.5,
      height: (i / ORBS_COUNT) * 10 - 5,
      col: PALETTE[i % PALETTE.length].clone(),
      scale: Math.random() * 0.32 + 0.15,
    }));
  }, []);

  useFrame((_, delta) => {
    const now = (t.current += delta);
    if (now > DURATION || !meshRef.current) return;
    const intro = Math.min(1, now * 2.5);
    const fade = now > 3.0 ? Math.max(0, 1 - (now - 3.0) / 1.2) : 1;
    const obj = d.current;

    orbs.current.forEach((o, i) => {
      const angle = o.phase + now * o.speed;
      const r = o.radius * intro;
      const pulse = 1 + Math.sin(now * 4 + o.phase) * 0.28;
      obj.position.set(
        Math.cos(angle) * r,
        o.height + Math.sin(now * 1.5 + o.phase) * 1.3,
        Math.sin(angle) * r * 0.5,
      );
      const s = o.scale * pulse * fade;
      obj.scale.set(s, s, s);
      obj.updateMatrix();
      meshRef.current!.setMatrixAt(i, obj.matrix);
      meshRef.current!.setColorAt(i, o.col);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor)
      meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, ORBS_COUNT]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        vertexColors
        emissive="#ffffff"
        emissiveIntensity={3.5}
        toneMapped={false}
        roughness={0}
        metalness={0}
      />
    </instancedMesh>
  );
}

// ── ネオンリング（多重・傾き回転） ────────────────────────────────────────
function NeonRings() {
  const groupRef = useRef<THREE.Group>(null);
  const t = useRef(0);
  const ringColors = [
    "#ff6eb4",
    "#e879f9",
    "#c084fc",
    "#fbbf24",
    "#ff3fa4",
    "#a855f7",
    "#f9a8d4",
    "#fb923c",
    "#ff6eb4",
    "#e879f9",
  ];

  useFrame((_, delta) => {
    const now = (t.current += delta);
    if (now > DURATION || !groupRef.current) return;

    groupRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const cycle = 1.5;
      const offset = (i / ringColors.length) * cycle;
      const rt = (now + offset) % cycle;
      mesh.scale.setScalar(Math.min(1 + rt * 30, 35));
      (mesh.material as THREE.MeshBasicMaterial).opacity =
        Math.max(0, 0.85 - rt * 1.7) * Math.min(1, now * 5);
      mesh.rotation.x = now * (0.3 + i * 0.07);
      mesh.rotation.y = now * (0.25 + i * 0.05);
    });
  });

  return (
    <group ref={groupRef}>
      {ringColors.map((col, i) => (
        <mesh key={i}>
          <ringGeometry args={[0.35, 0.6, 64]} />
          <meshBasicMaterial
            color={col}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── 中央フラッシュ＋ワイヤーフレームコア ─────────────────────────────────
function CentralCore() {
  const flashRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    const now = (t.current += delta);

    if (flashRef.current) {
      if (now < 0.5) {
        const p = now / 0.5;
        flashRef.current.scale.setScalar(1 + (1 - p) * 35);
        (flashRef.current.material as THREE.MeshBasicMaterial).opacity = 1 - p;
      } else {
        flashRef.current.visible = false;
      }
    }

    if (coreRef.current && now < DURATION) {
      const pulse = 1 + Math.sin(now * 9) * 0.45;
      const fade = now > 3.0 ? Math.max(0, 1 - (now - 3.0) / 1.2) : 1;
      coreRef.current.scale.setScalar(pulse * fade * 0.65);
      coreRef.current.rotation.y = now * 3.5;
      coreRef.current.rotation.z = now * 1.8;
      coreRef.current.rotation.x = now * 1.2;
    }
  });

  return (
    <>
      <mesh ref={flashRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={1}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial
          color="#ff6eb4"
          emissive="#ff6eb4"
          emissiveIntensity={7}
          wireframe
          toneMapped={false}
        />
      </mesh>
    </>
  );
}

// ── ダイナミックライト ────────────────────────────────────────────────────
function DynamicLights() {
  const l1 = useRef<THREE.PointLight>(null);
  const l2 = useRef<THREE.PointLight>(null);
  const l3 = useRef<THREE.PointLight>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    const now = (t.current += delta);
    if (l1.current) {
      l1.current.position.set(
        Math.sin(now * 1.2) * 6,
        Math.cos(now * 0.8) * 5,
        3,
      );
      l1.current.intensity = 10 + Math.sin(now * 5) * 4;
    }
    if (l2.current) {
      l2.current.position.set(
        Math.cos(now * 1.0) * 6,
        Math.sin(now * 1.3) * 5,
        3,
      );
      l2.current.intensity = 8 + Math.sin(now * 7 + 1) * 3;
    }
    if (l3.current) {
      l3.current.position.set(
        Math.sin(now * 0.6) * 3,
        Math.cos(now * 0.9) * 3,
        5,
      );
      l3.current.intensity = 6 + Math.sin(now * 4) * 2;
    }
  });

  return (
    <>
      <ambientLight intensity={1.4} />
      <pointLight
        ref={l1}
        position={[5, 4, 3]}
        intensity={10}
        color="#ff6eb4"
      />
      <pointLight
        ref={l2}
        position={[-5, 4, 3]}
        intensity={8}
        color="#a855f7"
      />
      <pointLight ref={l3} position={[0, 0, 5]} intensity={6} color="#fbbf24" />
    </>
  );
}

// ── シーン全体 ────────────────────────────────────────────────────────────
function MatchingScene({ onComplete }: { onComplete?: () => void }) {
  const done = useRef(false);
  const t = useRef(0);

  useFrame((_, delta) => {
    if (done.current) return;
    if ((t.current += delta) >= DURATION) {
      done.current = true;
      onComplete?.();
    }
  });

  return (
    <>
      <AnimatedCamera />
      <DynamicLights />
      <CentralCore />
      <NeonRings />
      <Stars />
      <SpiralOrbs />
      <Hearts3D />
      <Ribbons />
    </>
  );
}

// ── CSS ───────────────────────────────────────────────────────────────────
const CSS = `
  @keyframes mcBounceIn {
    0%   { opacity:0; transform: scale(0.08) rotate(-10deg); }
    55%  { opacity:1; transform: scale(1.15) rotate(3.5deg); }
    78%  { transform: scale(0.94) rotate(-2deg); }
    100% { transform: scale(1) rotate(0deg); }
  }
  @keyframes mcFadeOut {
    to { opacity:0; transform: scale(0.82) translateY(-24px); }
  }
  @keyframes mcRainbow {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes mcHeartBeat {
    0%,100% { transform: scale(1) rotate(0deg); }
    20% { transform: scale(1.45) rotate(-6deg); }
    45% { transform: scale(0.92) rotate(4deg); }
    70% { transform: scale(1.25) rotate(-3deg); }
  }
  @keyframes mcSpark {
    0%,100% { opacity:1; transform: scale(1) rotate(0deg); }
    50% { opacity:0.55; transform: scale(1.6) rotate(200deg); }
  }
  @keyframes mcGlow {
    0%,100% {
      filter: drop-shadow(0 0 18px #ff6eb4)
              drop-shadow(0 0 45px #a855f7)
              drop-shadow(0 0 80px #fbbf24);
    }
    50% {
      filter: drop-shadow(0 0 36px #ff3fa4)
              drop-shadow(0 0 80px #e879f9)
              drop-shadow(0 0 130px #fbbf24);
    }
  }
  @keyframes mcSubIn {
    0%   { opacity:0; transform: translateY(24px) scale(0.75); }
    100% { opacity:1; transform: translateY(0) scale(1); }
  }
  @keyframes mcEmojiFloat {
    0%   { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
    100% { transform: translateY(-100px) scale(0) rotate(30deg); opacity: 0; }
  }
  @keyframes mcPulseRing {
    0%   { transform: scale(0.3); opacity: 0.9; }
    100% { transform: scale(4.5); opacity: 0; }
  }
  @keyframes mcShimmer {
    0%,100% { opacity: 0.6; transform: scaleX(1); }
    50% { opacity: 1; transform: scaleX(1.08); }
  }
`;

// ── メインコンポーネント ──────────────────────────────────────────────────
export type MatchingCelebrationProps = {
  partnerName?: string;
  onComplete?: () => void;
};

export function MatchingCelebration({
  partnerName,
  onComplete,
}: MatchingCelebrationProps) {
  const [phase, setPhase] = useState<"hidden" | "show" | "out">("hidden");

  useEffect(() => {
    const t0 = setTimeout(() => setPhase("show"), 20);
    const t1 = setTimeout(() => setPhase("out"), (DURATION - 0.75) * 1000);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
    };
  }, []);

  const handleComplete = () => {
    setPhase("hidden");
    onComplete?.();
  };

  if (phase === "hidden") return null;

  return (
    <>
      <style>{CSS}</style>

      {/* Three.js キャンバス */}
      <div className="fixed inset-0 z-100 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
          <MatchingScene onComplete={handleComplete} />
        </Canvas>
      </div>

      {/* テキスト＋装飾レイヤー */}
      <div className="fixed inset-0 z-100 pointer-events-none flex flex-col items-center justify-center overflow-hidden">

        {/* パルスリング */}
        {[0, 0.22, 0.44, 0.66].map((delay, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 260 + i * 20,
              height: 260 + i * 20,
              borderRadius: "50%",
              border: `${3.5 - i * 0.6}px solid rgba(${i % 2 === 0 ? "255,110,180" : "168,85,247"},${0.7 - i * 0.1})`,
              animation: `mcPulseRing 1.3s ease-out ${delay}s both`,
              boxShadow: `0 0 35px rgba(139,92,246,0.55), inset 0 0 25px rgba(255,110,180,0.3)`,
            }}
          />
        ))}

        {/* メインコンテンツ */}
        <div
          style={{
            animation:
              phase === "out"
                ? "mcFadeOut 0.65s ease forwards"
                : "mcBounceIn 0.65s cubic-bezier(0.34,1.56,0.64,1) 0.05s both",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "0 1rem",
          }}
        >
          {/* MATCHING! */}
          <div
            style={{
              fontFamily: "'Arial Black', Impact, sans-serif",
              fontSize: "clamp(4rem, 16vw, 10rem)",
              fontWeight: 900,
              letterSpacing: "0.04em",
              lineHeight: 1,
              background:
                "linear-gradient(90deg, #ff6eb4, #a855f7, #fbbf24, #ff3fa4, #e879f9, #fbbf24, #ff6eb4)",
              backgroundSize: "400% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation:
                "mcRainbow 1.5s linear infinite, mcGlow 1.2s ease-in-out infinite",
            }}
          >
            MATCHING!
          </div>

          {/* サブタイトル */}
          <div
            style={{
              fontFamily: "'Arial Black', sans-serif",
              fontSize: "clamp(1.6rem, 6.5vw, 3.5rem)",
              fontWeight: 900,
              background:
                "linear-gradient(135deg, #f9a8d4, #c084fc, #fb923c, #f9a8d4)",
              backgroundSize: "300% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation:
                "mcRainbow 2.5s linear infinite, mcSubIn 0.55s ease 0.4s both",
              marginTop: "-0.05em",
              letterSpacing: "0.12em",
              opacity: 0,
            }}
          >
            ✨ マッチング成立 ✨
          </div>

          {/* パートナー名バッジ */}
          {partnerName && (
            <div
              style={{
                marginTop: "1.2rem",
                fontSize: "clamp(1.1rem, 4.5vw, 2.1rem)",
                fontWeight: 800,
                color: "white",
                textShadow:
                  "0 0 16px rgba(255,110,180,1), 0 0 45px rgba(139,92,246,0.9), 0 4px 18px rgba(0,0,0,0.55)",
                animation:
                  "mcSubIn 0.55s ease 0.75s both, mcShimmer 2s ease 1s infinite",
                opacity: 0,
                background:
                  "linear-gradient(135deg, rgba(255,110,180,0.28), rgba(139,92,246,0.28))",
                padding: "0.55em 2em",
                borderRadius: "9999px",
                backdropFilter: "blur(14px)",
                border: "2.5px solid rgba(255,110,180,0.55)",
                boxShadow:
                  "0 8px 40px rgba(236,72,153,0.35), 0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.25)",
              }}
            >
              💕 {partnerName} さんとマッチング！ 💕
            </div>
          )}

          {/* ハート列 */}
          <div
            style={{
              display: "flex",
              gap: "0.6rem",
              marginTop: "1.3rem",
              animation: "mcSubIn 0.5s ease 1.0s both",
              opacity: 0,
            }}
          >
          </div>

          {/* スパークル */}
          <div
            style={{
              display: "flex",
              gap: "0.85rem",
              marginTop: "1rem",
              animation: "mcSubIn 0.5s ease 1.2s both",
              opacity: 0,
            }}
          >
            {["✦", "★", "✦", "★", "✦", "★", "✦", "★", "✦"].map((s, i) => (
              <span
                key={i}
                style={{
                  fontSize: `${1.1 + (i % 3) * 0.45}rem`,
                  color:
                    i % 3 === 0
                      ? "#fbbf24"
                      : i % 3 === 1
                        ? "#f472b6"
                        : "#c084fc",
                  filter: `drop-shadow(0 0 12px ${i % 3 === 0 ? "rgba(251,191,36,1)" : i % 3 === 1 ? "rgba(244,114,182,1)" : "rgba(192,132,252,1)"})`,
                  animation: `mcSpark ${0.45 + (i % 4) * 0.18}s ease ${i * 0.09}s infinite alternate`,
                  display: "inline-block",
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
