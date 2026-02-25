import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type SparkData = {
  velocity: THREE.Vector3;
  scale: number;
  rotation: THREE.Vector3;
};

type SmokeData = {
  velocity: THREE.Vector3;
  scale: number;
};

type DebrisData = {
  currentPos: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Vector3;
  rotSpeed: THREE.Vector3;
  scale: number;
};

type ExplosionProps = {
  position?: [number, number, number];
  count?: number; // パーティクルの数
  color?: string;
  onComplete?: () => void; // アニメーション完了時のコールバック
};

export const Explosion: React.FC<ExplosionProps> = ({
  position = [0, 0, 0],
  count = 20,
  color = "#ff6000",
  onComplete,
}) => {
  const sparkRef = useRef<THREE.InstancedMesh>(null);
  const smokeRef = useRef<THREE.InstancedMesh>(null);
  const flashRef = useRef<THREE.Mesh>(null);
  const debrisMeshRef = useRef<THREE.InstancedMesh>(null);
  const shockwaveRef = useRef<THREE.Mesh>(null);
  const fadeOutRef = useRef<THREE.Mesh>(null);
  const shakeGroupRef = useRef<THREE.Group>(null);

  // 時間を ref で管理（フレームごとの setState を避けパフォーマンス改善）
  const timeRef = useRef(0);
  const [isActive, setIsActive] = useState(true);

  // パーティクルデータを ref に保持（render サイクル外で初期化）
  const sparksData = useRef<SparkData[]>([]);
  const smokesData = useRef<SmokeData[]>([]);
  const debrisData = useRef<DebrisData[]>([]);
  const dummy = useRef(new THREE.Object3D());

  useEffect(() => {
    // 火花データ初期化
    sparksData.current = Array.from({ length: count * 3 }, () => ({
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30,
      ),
      scale: Math.random() * 0.3 + 0.1,
      rotation: new THREE.Vector3(Math.random(), Math.random(), Math.random()),
    }));

    // 煙データ初期化
    smokesData.current = Array.from({ length: Math.floor(count / 2) }, () => ({
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 4,
      ),
      scale: Math.random() * 0.5 + 0.5,
    }));

    // 破片データ初期化
    debrisData.current = Array.from({ length: 40 }, () => ({
      currentPos: new THREE.Vector3(position[0], position[1], position[2]),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 25,
        (Math.random() - 0.5) * 25,
        (Math.random() - 0.5) * 25 + 5,
      ),
      rotation: new THREE.Vector3(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        0,
      ),
      rotSpeed: new THREE.Vector3(
        Math.random() * 10,
        Math.random() * 10,
        Math.random() * 10,
      ),
      scale: Math.random() * 0.5 + 0.5,
    }));

    // リセット
    timeRef.current = 0;
  }, [count, position]);

  useFrame((_, delta) => {
    if (!isActive) return;

    const newTime = (timeRef.current += delta);
    const duration = 1.8;

    if (newTime >= duration) {
      setIsActive(false);
      if (shakeGroupRef.current) {
        shakeGroupRef.current.position.set(0, 0, 0);
      }
      if (onComplete) onComplete();
      return;
    }

    // カメラシェイク（グループを揺らすことで実現）
    if (shakeGroupRef.current) {
      if (newTime < 0.3) {
        const shakeIntensity = (0.3 - newTime) * 0.3;
        shakeGroupRef.current.position.set(
          (Math.random() - 0.5) * shakeIntensity,
          (Math.random() - 0.5) * shakeIntensity,
          0,
        );
      } else {
        shakeGroupRef.current.position.set(0, 0, 0);
      }
    }

    // フラッシュ更新
    if (flashRef.current) {
      const flashDuration = 0.25;
      if (newTime < flashDuration) {
        const progress = newTime / flashDuration;
        flashRef.current.scale.setScalar(1 + progress * 20);
        const material = flashRef.current.material as THREE.MeshBasicMaterial;
        material.opacity = 1 - Math.pow(progress, 0.5);
      } else {
        flashRef.current.visible = false;
      }
    }

    // 衝撃波更新
    if (shockwaveRef.current) {
      const waveScale = 1 + newTime * 30;
      shockwaveRef.current.scale.setScalar(waveScale);
      const material = shockwaveRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0, 0.8 - newTime * 2);
    }

    // フェードアウト更新
    if (fadeOutRef.current) {
      const fadeStart = 1.2;
      if (newTime > fadeStart) {
        const fadeDuration = duration - fadeStart;
        const progress = (newTime - fadeStart) / fadeDuration;
        const material = fadeOutRef.current.material as THREE.MeshBasicMaterial;
        material.opacity = Math.min(1, progress);
      }
    }

    const d = dummy.current;

    // 火花更新
    if (sparkRef.current) {
      const friction = Math.exp(-newTime * 3);
      sparksData.current.forEach((p, i) => {
        d.position.set(
          position[0] + p.velocity.x * newTime * friction,
          position[1] + p.velocity.y * newTime * friction,
          position[2] + p.velocity.z * newTime * friction,
        );
        d.rotation.set(
          p.rotation.x + newTime * 10,
          p.rotation.y + newTime * 10,
          p.rotation.z + newTime * 10,
        );
        const scale = Math.max(0, p.scale * (1 - newTime / duration));
        d.scale.set(scale, scale, scale);
        d.updateMatrix();
        sparkRef.current!.setMatrixAt(i, d.matrix);
      });
      sparkRef.current.instanceMatrix.needsUpdate = true;
    }

    // 煙更新
    if (smokeRef.current) {
      smokesData.current.forEach((p, i) => {
        d.position.set(
          position[0] + p.velocity.x * newTime,
          position[1] + p.velocity.y * newTime,
          position[2] + p.velocity.z * newTime,
        );
        d.rotation.set(newTime, newTime, newTime);
        const life = 1 - newTime / duration;
        const scale = p.scale * (1 + newTime * 3) * life;
        d.scale.set(scale, scale, scale);
        d.updateMatrix();
        smokeRef.current!.setMatrixAt(i, d.matrix);
      });
      smokeRef.current.instanceMatrix.needsUpdate = true;
    }

    // 破片更新
    if (debrisMeshRef.current) {
      debrisData.current.forEach((p, i) => {
        p.velocity.y -= 25.0 * delta;
        p.currentPos.addScaledVector(p.velocity, delta);

        const groundLevel = -3.5 + Math.sin(i * 12.34) * 0.3;
        if (p.currentPos.y < groundLevel) {
          p.currentPos.y = groundLevel;
          p.velocity.y *= -0.3;
          p.velocity.x *= 0.7;
          p.velocity.z *= 0.7;
        }

        d.position.copy(p.currentPos);
        d.rotation.set(
          p.rotation.x + p.rotSpeed.x * newTime,
          p.rotation.y + p.rotSpeed.y * newTime,
          p.rotation.z + p.rotSpeed.z * newTime,
        );
        d.scale.setScalar(p.scale);
        d.updateMatrix();
        debrisMeshRef.current!.setMatrixAt(i, d.matrix);
      });
      debrisMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={shakeGroupRef}>
      {isActive && (
        <>
          {/* フラッシュ（中心の閃光） */}
          <mesh ref={flashRef}>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={1}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          {/* 衝撃波（リング） */}
          <mesh ref={shockwaveRef}>
            <ringGeometry args={[0.3, 0.5, 32]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* 火花 */}
          <instancedMesh
            ref={sparkRef}
            args={[undefined, undefined, count * 3]}
          >
            <dodecahedronGeometry args={[0.2, 0]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={4}
              toneMapped={false}
            />
          </instancedMesh>

          {/* 煙 */}
          <instancedMesh
            ref={smokeRef}
            args={[undefined, undefined, Math.floor(count / 2)]}
          >
            <dodecahedronGeometry args={[0.3, 0]} />
            <meshStandardMaterial
              color="#555555"
              transparent
              opacity={0.5}
              depthWrite={false}
            />
          </instancedMesh>

          {/* フェードアウト用オーバーレイ（暗転） */}
          <mesh ref={fadeOutRef} position={[0, 0, -0.1]}>
            <planeGeometry args={[100, 100]} />
            <meshBasicMaterial
              color="#000000"
              transparent
              opacity={0}
              depthTest={false}
            />
          </mesh>
        </>
      )}

      {/* 破片（カードの残骸） */}
      <instancedMesh ref={debrisMeshRef} args={[undefined, undefined, 40]}>
        <boxGeometry args={[0.2, 0.3, 0.02]} />
        <meshStandardMaterial color="#ffffff" side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  );
};
