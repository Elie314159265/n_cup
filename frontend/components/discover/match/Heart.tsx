"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ハートの形状データを作成
const createHeartShape = () => {
  const x = 0,
    y = 0;
  const heartShape = new THREE.Shape();
  heartShape.moveTo(x + 0.5, y + 0.5);
  heartShape.bezierCurveTo(x + 0.5, y + 0.5, x + 0.4, y, x, y);
  heartShape.bezierCurveTo(x - 0.6, y, x - 0.6, y + 0.7, x - 0.6, y + 0.7);
  heartShape.bezierCurveTo(
    x - 0.6,
    y + 1.1,
    x - 0.3,
    y + 1.54,
    x + 0.5,
    y + 1.9,
  );
  heartShape.bezierCurveTo(
    x + 1.2,
    y + 1.54,
    x + 1.6,
    y + 1.1,
    x + 1.6,
    y + 0.7,
  );
  heartShape.bezierCurveTo(x + 1.6, y + 0.7, x + 1.6, y, x + 1.0, y);
  heartShape.bezierCurveTo(x + 0.7, y, x + 0.5, y + 0.5, x + 0.5, y + 0.5);
  return heartShape;
};

interface ParticleProps {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  color: string;
  velocity: THREE.Vector3;
}

const HeartParticle = ({
  position,
  rotation,
  scale,
  color,
  velocity,
}: ParticleProps) => {
  const mesh = useRef<THREE.Mesh>(null);
  const [time, setTime] = useState(0);

  // ハートの形状をメモ化
  const geometry = useMemo(() => {
    const shape = createHeartShape();
    const extrudeSettings = {
      depth: 0.4,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 2,
      bevelSize: 0.1,
      bevelThickness: 0.1,
    };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center(); // 中心を原点に
    return geo;
  }, []);

  useFrame((state, delta) => {
    if (!mesh.current) return;

    setTime((t) => t + delta);

    // 位置の更新（速度に基づく移動 + ふわふわ感）
    mesh.current.position.x += velocity.x * delta * 5;
    mesh.current.position.y +=
      velocity.y * delta * 5 + Math.sin(time * 3) * 0.02; // 上昇 + ゆらぎ
    mesh.current.position.z += velocity.z * delta * 5;

    // 回転
    mesh.current.rotation.x += delta * 2;
    mesh.current.rotation.y += delta * 1;

    // スケールアニメーション（出現 -> 拡大 -> 縮小）
    const life = time;
    if (life < 0.2) {
      const s = (life / 0.2) * scale;
      mesh.current.scale.set(s, s, s);
    } else if (life > 1.5) {
      const s = Math.max(0, scale * (1 - (life - 1.5) * 2));
      mesh.current.scale.set(s, s, s);
    }
  });

  return (
    <mesh
      ref={mesh}
      position={position}
      rotation={rotation}
      geometry={geometry}
    >
      <meshPhongMaterial
        color={color}
        emissive={new THREE.Color(color)}
        emissiveIntensity={0.8}
        shininess={200}
        specular={new THREE.Color("#ffffff")}
      />
    </mesh>
  );
};

interface HeartExplosionProps {
  count?: number;
  onComplete?: () => void;
}

export const HeartExplosion = ({
  count = 25,
  onComplete,
}: HeartExplosionProps) => {
  const [finished, setFinished] = useState(false);

  // パーティクルの初期データを生成
  const particles = useMemo(() => {
    return new Array(count).fill(0).map(() => {
      // ランダムな方向ベクトル（上方向へのバイアスあり）
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 0.8 + Math.random() * 1.5;

      const vx = speed * Math.sin(phi) * Math.cos(theta);
      const vy = speed * Math.sin(phi) * Math.sin(theta) + 0.5; // 上方向に少し持ち上げる
      const vz = speed * Math.cos(phi);

      return {
        position: [0, 0, 0] as [number, number, number],
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0] as [
          number,
          number,
          number,
        ],
        scale: 0.15 + Math.random() * 0.25,
        color: ["#ff99cc", "#ff69b4", "#ff1493", "#ffb7c5"][
          Math.floor(Math.random() * 4)
        ],
        velocity: new THREE.Vector3(vx, vy, vz),
      };
    });
  }, [count]);

  // 全体のタイマー管理
  useFrame(() => {
    if (!finished) {
      // 2秒後に終了コールバックを実行
      const timer = setTimeout(() => {
        setFinished(true);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  });

  if (finished) return null;

  return (
    <group>
      <ambientLight intensity={0.8} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />
      <pointLight position={[-10, -10, -10]} color="#ff00ff" intensity={0.5} />
      {particles.map((props, i) => (
        <HeartParticle key={i} {...props} />
      ))}
    </group>
  );
};
