import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

type SparkData = {
  velocity: THREE.Vector3;
  scale: number;
  rotation: THREE.Vector3;
  colorIndex: number; // 0: white-hot, 1: orange, 2: red
};

type SmokeData = {
  velocity: THREE.Vector3;
  scale: number;
  offset: THREE.Vector3;
};

type DebrisData = {
  currentPos: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Vector3;
  rotSpeed: THREE.Vector3;
  scale: number;
};

type EmberData = {
  currentPos: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  scale: number;
};

type ExplosionProps = {
  position?: [number, number, number];
  count?: number;
  color?: string;
  onComplete?: () => void;
};

export const Explosion: React.FC<ExplosionProps> = ({
  position = [0, 0, 0],
  count = 20,
  color = "#ff6000",
  onComplete,
}) => {
  // --- refs ---
  const sparkRef = useRef<THREE.InstancedMesh>(null);
  const spark2Ref = useRef<THREE.InstancedMesh>(null);
  const spark3Ref = useRef<THREE.InstancedMesh>(null); // 二次爆発スパーク
  const smokeRef = useRef<THREE.InstancedMesh>(null);
  const flashRef = useRef<THREE.Mesh>(null);
  const flash2Ref = useRef<THREE.Mesh>(null);
  const flash3Ref = useRef<THREE.Mesh>(null); // 三次フラッシュ（青白）
  const fireBallRef = useRef<THREE.Mesh>(null);
  const fireBall2Ref = useRef<THREE.Mesh>(null); // 二次爆発炎球
  const debrisMeshRef = useRef<THREE.InstancedMesh>(null);
  const shockwaveRef = useRef<THREE.Mesh>(null);
  const shockwave2Ref = useRef<THREE.Mesh>(null);
  const shockwave3Ref = useRef<THREE.Mesh>(null);
  const shockwave4Ref = useRef<THREE.Mesh>(null); // YZ衝撃波（4方向）
  const shockwave5Ref = useRef<THREE.Mesh>(null); // 二次爆発衝撃波
  const streakRef = useRef<THREE.InstancedMesh>(null); // 上昇炎ストリーク
  const emberRef = useRef<THREE.InstancedMesh>(null);
  const fadeOutRef = useRef<THREE.Mesh>(null);
  const shakeGroupRef = useRef<THREE.Group>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  const pointLight2Ref = useRef<THREE.PointLight>(null); // 二次爆発光源

  const timeRef = useRef(0);
  const [isActive, setIsActive] = useState(true);

  const sparksData = useRef<SparkData[]>([]);
  const sparks2Data = useRef<SparkData[]>([]);
  const sparks3Data = useRef<SparkData[]>([]);
  const smokesData = useRef<SmokeData[]>([]);
  const debrisData = useRef<DebrisData[]>([]);
  const emberData = useRef<EmberData[]>([]);
  const streakData = useRef<SparkData[]>([]);
  const dummy = useRef(new THREE.Object3D());

  const SPARK_COUNT = count * 8;
  const FAST_SPARK_COUNT = count * 6;
  const SECONDARY_SPARK_COUNT = count * 5;
  const SMOKE_COUNT = count * 3;
  const DEBRIS_COUNT = 100;
  const EMBER_COUNT = count * 12;
  const STREAK_COUNT = count * 4;
  const DURATION = 3.2;

  useEffect(() => {
    // 通常スパーク（橙〜赤、中速）
    sparksData.current = Array.from({ length: SPARK_COUNT }, (_, idx) => ({
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 60,
      ),
      scale: Math.random() * 0.5 + 0.15,
      rotation: new THREE.Vector3(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      ),
      colorIndex: idx % 2 === 0 ? 1 : 2,
    }));

    // 高速白熱スパーク（速い・小さい・白〜黄）
    sparks2Data.current = Array.from({ length: FAST_SPARK_COUNT }, () => ({
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
      ),
      scale: Math.random() * 0.22 + 0.08,
      rotation: new THREE.Vector3(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      ),
      colorIndex: 0,
    }));

    // 二次爆発スパーク（少し遅れて別方向へ）
    sparks3Data.current = Array.from(
      { length: SECONDARY_SPARK_COUNT },
      (_, idx) => ({
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 70,
          Math.random() * 50 + 10,
          (Math.random() - 0.5) * 70,
        ),
        scale: Math.random() * 0.4 + 0.1,
        rotation: new THREE.Vector3(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
        ),
        colorIndex: idx % 3 === 0 ? 0 : 1,
      }),
    );

    // 上昇ストリーク（炎の柱）
    streakData.current = Array.from({ length: STREAK_COUNT }, () => ({
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        Math.random() * 40 + 15,
        (Math.random() - 0.5) * 20,
      ),
      scale: Math.random() * 0.3 + 0.1,
      rotation: new THREE.Vector3(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      ),
      colorIndex: 1,
    }));

    // 煙（立体的に広がる）
    smokesData.current = Array.from({ length: SMOKE_COUNT }, () => ({
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        Math.random() * 8 + 2,
        (Math.random() - 0.5) * 10,
      ),
      scale: Math.random() * 2.0 + 1.0,
      offset: new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 3,
      ),
    }));

    // 破片
    debrisData.current = Array.from({ length: DEBRIS_COUNT }, () => ({
      currentPos: new THREE.Vector3(position[0], position[1], position[2]),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 50,
        Math.random() * 35 + 10,
        (Math.random() - 0.5) * 50,
      ),
      rotation: new THREE.Vector3(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      ),
      rotSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30,
      ),
      scale: Math.random() * 0.8 + 0.4,
    }));

    // エンバー（残り火の粒）
    emberData.current = Array.from({ length: EMBER_COUNT }, () => ({
      currentPos: new THREE.Vector3(position[0], position[1], position[2]),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 25,
        Math.random() * 18 + 3,
        (Math.random() - 0.5) * 25,
      ),
      life: 1,
      maxLife: Math.random() * 2.0 + 0.8,
      scale: Math.random() * 0.18 + 0.06,
    }));

    timeRef.current = 0;
  }, [
    count,
    position,
    SPARK_COUNT,
    FAST_SPARK_COUNT,
    SECONDARY_SPARK_COUNT,
    SMOKE_COUNT,
    DEBRIS_COUNT,
    EMBER_COUNT,
    STREAK_COUNT,
  ]);

  useFrame((_, delta) => {
    if (!isActive) return;

    const t = (timeRef.current += delta);
    const progress = t / DURATION;

    if (t >= DURATION) {
      setIsActive(false);
      if (shakeGroupRef.current) shakeGroupRef.current.position.set(0, 0, 0);
      if (onComplete) onComplete();
      return;
    }

    // --- カメラシェイク（超激しく）---
    if (shakeGroupRef.current) {
      if (t < 1.2) {
        // 一次爆発シェイク
        const intensity1 = t < 0.6 ? Math.exp(-t * 4) * 1.2 : 0;
        // 二次爆発シェイク（0.35秒後）
        const t2 = t - 0.35;
        const intensity2 = t2 > 0 && t2 < 0.6 ? Math.exp(-t2 * 4) * 0.8 : 0;
        const intensity = intensity1 + intensity2;
        shakeGroupRef.current.position.set(
          Math.sin(t * 120) * intensity + Math.cos(t * 97) * intensity * 0.5,
          Math.cos(t * 110) * intensity + Math.sin(t * 83) * intensity * 0.5,
          Math.sin(t * 73) * intensity * 0.3,
        );
      } else {
        shakeGroupRef.current.position.set(0, 0, 0);
      }
    }

    // --- 一次ポイントライト ---
    if (pointLightRef.current) {
      if (t < 0.15) {
        pointLightRef.current.intensity = (t / 0.15) * 120;
        pointLightRef.current.distance = 30 + t * 100;
      } else if (t < 0.5) {
        pointLightRef.current.intensity = (1 - (t - 0.15) / 0.35) * 120;
      } else {
        const fade = Math.max(0, 1 - (t - 0.5) / 1.0);
        pointLightRef.current.intensity = fade * 15;
      }
    }

    // --- 二次爆発ポイントライト（0.35秒遅れ）---
    if (pointLight2Ref.current) {
      const d2 = t - 0.35;
      if (d2 < 0) {
        pointLight2Ref.current.intensity = 0;
      } else if (d2 < 0.15) {
        pointLight2Ref.current.intensity = (d2 / 0.15) * 80;
        pointLight2Ref.current.distance = 25 + d2 * 80;
      } else if (d2 < 0.45) {
        pointLight2Ref.current.intensity = (1 - (d2 - 0.15) / 0.3) * 80;
      } else {
        const fade = Math.max(0, 1 - (d2 - 0.45) / 0.8);
        pointLight2Ref.current.intensity = fade * 10;
      }
    }

    // --- メインフラッシュ ---
    if (flashRef.current) {
      const fd = 0.25;
      if (t < fd) {
        const fp = t / fd;
        flashRef.current.scale.setScalar(1 + fp * 55);
        (flashRef.current.material as THREE.MeshBasicMaterial).opacity =
          1 - Math.pow(fp, 0.35);
      } else {
        flashRef.current.visible = false;
      }
    }

    // --- 二次フラッシュ（橙色）---
    if (flash2Ref.current) {
      const delay = 0.04;
      const fd = 0.5;
      if (t < delay) {
        flash2Ref.current.visible = false;
      } else if (t < delay + fd) {
        flash2Ref.current.visible = true;
        const fp = (t - delay) / fd;
        flash2Ref.current.scale.setScalar(1 + fp * 35);
        (flash2Ref.current.material as THREE.MeshBasicMaterial).opacity =
          (1 - fp) * 0.85;
      } else {
        flash2Ref.current.visible = false;
      }
    }

    // --- 三次フラッシュ（二次爆発・青白）---
    if (flash3Ref.current) {
      const delay = 0.35;
      const fd = 0.3;
      if (t < delay) {
        flash3Ref.current.visible = false;
      } else if (t < delay + fd) {
        flash3Ref.current.visible = true;
        const fp = (t - delay) / fd;
        flash3Ref.current.scale.setScalar(1 + fp * 40);
        (flash3Ref.current.material as THREE.MeshBasicMaterial).opacity =
          (1 - fp) * 0.75;
      } else {
        flash3Ref.current.visible = false;
      }
    }

    // --- 一次炎球 ---
    if (fireBallRef.current) {
      const fbDuration = 1.2;
      if (t < fbDuration) {
        const fp = t / fbDuration;
        const fireScale = (0.5 + fp * 16) * (1 - Math.pow(fp, 1.4) * 0.9);
        fireBallRef.current.scale.setScalar(Math.max(0, fireScale));
        fireBallRef.current.visible = true;
        (fireBallRef.current.material as THREE.MeshBasicMaterial).opacity =
          Math.max(0, 1 - fp * 1.1);
      } else {
        fireBallRef.current.visible = false;
      }
    }

    // --- 二次炎球（0.35秒後）---
    if (fireBall2Ref.current) {
      const delay = 0.35;
      const fbDuration = 1.0;
      const dt = t - delay;
      if (dt < 0) {
        fireBall2Ref.current.visible = false;
      } else if (dt < fbDuration) {
        const fp = dt / fbDuration;
        const fireScale = (0.3 + fp * 10) * (1 - Math.pow(fp, 1.3) * 0.9);
        fireBall2Ref.current.scale.setScalar(Math.max(0, fireScale));
        fireBall2Ref.current.visible = true;
        (fireBall2Ref.current.material as THREE.MeshBasicMaterial).opacity =
          Math.max(0, 0.85 - fp * 1.0);
      } else {
        fireBall2Ref.current.visible = false;
      }
    }

    // --- 衝撃波 XY 面 ---
    if (shockwaveRef.current) {
      shockwaveRef.current.scale.setScalar(1 + t * 60);
      (shockwaveRef.current.material as THREE.MeshBasicMaterial).opacity =
        Math.max(0, 1.0 - t * 3.0);
    }

    // --- 衝撃波 XZ 面 ---
    if (shockwave2Ref.current) {
      if (t > 0.02) {
        shockwave2Ref.current.scale.setScalar(1 + (t - 0.02) * 55);
        (shockwave2Ref.current.material as THREE.MeshBasicMaterial).opacity =
          Math.max(0, 0.8 - t * 2.8);
      }
    }

    // --- 衝撃波 ダイアゴナル1 ---
    if (shockwave3Ref.current) {
      if (t > 0.03) {
        shockwave3Ref.current.scale.setScalar(1 + (t - 0.03) * 50);
        (shockwave3Ref.current.material as THREE.MeshBasicMaterial).opacity =
          Math.max(0, 0.7 - t * 2.5);
      }
    }

    // --- 衝撃波 YZ 面（4方向目）---
    if (shockwave4Ref.current) {
      if (t > 0.01) {
        shockwave4Ref.current.scale.setScalar(1 + (t - 0.01) * 58);
        (shockwave4Ref.current.material as THREE.MeshBasicMaterial).opacity =
          Math.max(0, 0.75 - t * 2.6);
      }
    }

    // --- 二次爆発衝撃波（0.35秒後）---
    if (shockwave5Ref.current) {
      const dt = t - 0.35;
      if (dt < 0) {
        shockwave5Ref.current.scale.setScalar(0);
      } else {
        shockwave5Ref.current.scale.setScalar(1 + dt * 50);
        (shockwave5Ref.current.material as THREE.MeshBasicMaterial).opacity =
          Math.max(0, 0.95 - dt * 3.2);
      }
    }

    // --- フェードアウト ---
    if (fadeOutRef.current) {
      const fadeStart = 2.5;
      if (t > fadeStart) {
        const fp = (t - fadeStart) / (DURATION - fadeStart);
        (fadeOutRef.current.material as THREE.MeshBasicMaterial).opacity =
          Math.min(1, fp);
      }
    }

    const d = dummy.current;

    // --- 通常スパーク更新 ---
    if (sparkRef.current) {
      const friction = Math.exp(-t * 2.0);
      const gravity = -12.0 * t * t;
      sparksData.current.forEach((p, i) => {
        d.position.set(
          position[0] + p.velocity.x * t * friction,
          position[1] + p.velocity.y * t * friction + gravity,
          position[2] + p.velocity.z * t * friction,
        );
        d.rotation.set(
          p.rotation.x + t * 15,
          p.rotation.y + t * 15,
          p.rotation.z + t * 10,
        );
        const scale = Math.max(0, p.scale * (1 - progress));
        d.scale.set(scale, scale * 5, scale); // より長い軌跡
        d.updateMatrix();
        sparkRef.current!.setMatrixAt(i, d.matrix);
      });
      sparkRef.current.instanceMatrix.needsUpdate = true;
    }

    // --- 高速白熱スパーク更新 ---
    if (spark2Ref.current) {
      const friction2 = Math.exp(-t * 4.5);
      sparks2Data.current.forEach((p, i) => {
        d.position.set(
          position[0] + p.velocity.x * t * friction2,
          position[1] + p.velocity.y * t * friction2,
          position[2] + p.velocity.z * t * friction2,
        );
        d.rotation.set(
          p.rotation.x + t * 25,
          p.rotation.y + t * 25,
          p.rotation.z + t * 25,
        );
        const scale = Math.max(0, p.scale * (1 - progress * 1.4));
        d.scale.set(scale, scale * 6, scale);
        d.updateMatrix();
        spark2Ref.current!.setMatrixAt(i, d.matrix);
      });
      spark2Ref.current.instanceMatrix.needsUpdate = true;
    }

    // --- 二次爆発スパーク更新（0.35秒後に発火）---
    if (spark3Ref.current) {
      const dt = t - 0.35;
      if (dt <= 0) {
        // 非表示
        sparks3Data.current.forEach((_, i) => {
          d.scale.setScalar(0);
          d.updateMatrix();
          spark3Ref.current!.setMatrixAt(i, d.matrix);
        });
      } else {
        const friction3 = Math.exp(-dt * 2.5);
        const gravity3 = -10.0 * dt * dt;
        const prog3 = dt / (DURATION - 0.35);
        sparks3Data.current.forEach((p, i) => {
          d.position.set(
            position[0] + p.velocity.x * dt * friction3,
            position[1] + p.velocity.y * dt * friction3 + gravity3,
            position[2] + p.velocity.z * dt * friction3,
          );
          d.rotation.set(
            p.rotation.x + dt * 18,
            p.rotation.y + dt * 18,
            p.rotation.z + dt * 12,
          );
          const scale = Math.max(0, p.scale * (1 - prog3));
          d.scale.set(scale, scale * 4, scale);
          d.updateMatrix();
          spark3Ref.current!.setMatrixAt(i, d.matrix);
        });
      }
      spark3Ref.current.instanceMatrix.needsUpdate = true;
    }

    // --- 上昇ストリーク更新 ---
    if (streakRef.current) {
      const friction3 = Math.exp(-t * 1.5);
      const prog3 = Math.min(1, t / 1.5);
      streakData.current.forEach((p, i) => {
        d.position.set(
          position[0] + p.velocity.x * t * friction3,
          position[1] + p.velocity.y * t * friction3,
          position[2] + p.velocity.z * t * friction3,
        );
        d.rotation.set(p.rotation.x, p.rotation.y, p.rotation.z + t * 5);
        const scale = Math.max(0, p.scale * (1 - prog3));
        d.scale.set(scale * 0.3, scale * 8, scale * 0.3);
        d.updateMatrix();
        streakRef.current!.setMatrixAt(i, d.matrix);
      });
      streakRef.current.instanceMatrix.needsUpdate = true;
    }

    // --- 煙更新 ---
    if (smokeRef.current) {
      smokesData.current.forEach((p, i) => {
        const st = Math.max(0, t - 0.08);
        d.position.set(
          position[0] + p.offset.x + p.velocity.x * st,
          position[1] + p.offset.y + p.velocity.y * st,
          position[2] + p.offset.z + p.velocity.z * st,
        );
        d.rotation.set(st * 0.6, st * 0.4, st * 0.8);
        const life = 1 - t / DURATION;
        const scale = p.scale * (1 + st * 5) * life;
        d.scale.set(scale, scale, scale);
        d.updateMatrix();
        smokeRef.current!.setMatrixAt(i, d.matrix);
      });
      smokeRef.current.instanceMatrix.needsUpdate = true;
    }

    // --- エンバー更新 ---
    if (emberRef.current) {
      emberData.current.forEach((p, i) => {
        p.life = Math.max(0, 1 - t / p.maxLife);
        p.velocity.y -= 6.0 * delta;
        p.currentPos.addScaledVector(p.velocity, delta * 0.35);
        if (p.life <= 0) {
          d.scale.setScalar(0);
        } else {
          d.position.copy(p.currentPos);
          d.rotation.set(t * 6, t * 8, t * 4);
          d.scale.setScalar(p.scale * p.life);
        }
        d.updateMatrix();
        emberRef.current!.setMatrixAt(i, d.matrix);
      });
      emberRef.current.instanceMatrix.needsUpdate = true;
    }

    // --- 破片更新 ---
    if (debrisMeshRef.current) {
      debrisData.current.forEach((p, i) => {
        p.velocity.y -= 35.0 * delta;
        p.currentPos.addScaledVector(p.velocity, delta);

        const groundLevel = -5.0 + Math.sin(i * 7.34) * 0.8;
        if (p.currentPos.y < groundLevel) {
          p.currentPos.y = groundLevel;
          p.velocity.y *= -0.2;
          p.velocity.x *= 0.5;
          p.velocity.z *= 0.5;
        }

        d.position.copy(p.currentPos);
        d.rotation.set(
          p.rotation.x + p.rotSpeed.x * t,
          p.rotation.y + p.rotSpeed.y * t,
          p.rotation.z + p.rotSpeed.z * t,
        );
        d.scale.setScalar(p.scale * Math.max(0, 1 - progress * 0.7));
        d.updateMatrix();
        debrisMeshRef.current!.setMatrixAt(i, d.matrix);
      });
      debrisMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={shakeGroupRef} position={position}>
      {isActive && (
        <>
          {/* 一次爆発ポイントライト */}
          <pointLight
            ref={pointLightRef}
            color="#ff8800"
            intensity={120}
            distance={50}
            decay={2}
          />

          {/* 二次爆発ポイントライト */}
          <pointLight
            ref={pointLight2Ref}
            color="#ffcc44"
            intensity={0}
            distance={40}
            decay={2}
          />

          {/* メインフラッシュ（白熱）*/}
          <mesh ref={flashRef}>
            <sphereGeometry args={[1.2, 16, 16]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={1}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          {/* 二次フラッシュ（橙色）*/}
          <mesh ref={flash2Ref}>
            <sphereGeometry args={[1.6, 16, 16]} />
            <meshBasicMaterial
              color="#ff9900"
              transparent
              opacity={0.85}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          {/* 三次フラッシュ（二次爆発・青白）*/}
          <mesh ref={flash3Ref}>
            <sphereGeometry args={[1.0, 16, 16]} />
            <meshBasicMaterial
              color="#aaddff"
              transparent
              opacity={0.75}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          {/* 一次炎球 */}
          <mesh ref={fireBallRef}>
            <sphereGeometry args={[2.0, 32, 32]} />
            <meshBasicMaterial
              color="#ff3300"
              transparent
              opacity={0.95}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          {/* 二次炎球 */}
          <mesh ref={fireBall2Ref}>
            <sphereGeometry args={[1.5, 32, 32]} />
            <meshBasicMaterial
              color="#ff8800"
              transparent
              opacity={0.85}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          {/* 衝撃波 XY 面 */}
          <mesh ref={shockwaveRef} rotation={[0, 0, 0]}>
            <ringGeometry args={[0.2, 0.65, 64]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={1.0}
              side={THREE.DoubleSide}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          {/* 衝撃波 XZ 面 */}
          <mesh ref={shockwave2Ref} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.2, 0.65, 64]} />
            <meshBasicMaterial
              color="#ffffaa"
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          {/* 衝撃波 ダイアゴナル */}
          <mesh ref={shockwave3Ref} rotation={[Math.PI / 4, Math.PI / 6, 0]}>
            <ringGeometry args={[0.2, 0.65, 64]} />
            <meshBasicMaterial
              color="#ffaa44"
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          {/* 衝撃波 YZ 面（4方向目）*/}
          <mesh ref={shockwave4Ref} rotation={[0, Math.PI / 2, 0]}>
            <ringGeometry args={[0.2, 0.65, 64]} />
            <meshBasicMaterial
              color="#ff6600"
              transparent
              opacity={0.75}
              side={THREE.DoubleSide}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          {/* 二次爆発衝撃波 */}
          <mesh
            ref={shockwave5Ref}
            rotation={[Math.PI / 3, Math.PI / 4, Math.PI / 5]}
          >
            <ringGeometry args={[0.2, 0.65, 64]} />
            <meshBasicMaterial
              color="#aaddff"
              transparent
              opacity={0.9}
              side={THREE.DoubleSide}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          {/* 通常スパーク（橙〜赤）*/}
          <instancedMesh
            ref={sparkRef}
            args={[undefined, undefined, SPARK_COUNT]}
          >
            <octahedronGeometry args={[0.2, 0]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={8}
              toneMapped={false}
            />
          </instancedMesh>

          {/* 高速白熱スパーク */}
          <instancedMesh
            ref={spark2Ref}
            args={[undefined, undefined, FAST_SPARK_COUNT]}
          >
            <octahedronGeometry args={[0.14, 0]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffee44"
              emissiveIntensity={14}
              toneMapped={false}
            />
          </instancedMesh>

          {/* 二次爆発スパーク（黄〜橙）*/}
          <instancedMesh
            ref={spark3Ref}
            args={[undefined, undefined, SECONDARY_SPARK_COUNT]}
          >
            <octahedronGeometry args={[0.18, 0]} />
            <meshStandardMaterial
              color="#ffcc00"
              emissive="#ffaa00"
              emissiveIntensity={10}
              toneMapped={false}
            />
          </instancedMesh>

          {/* 上昇ストリーク（炎の柱）*/}
          <instancedMesh
            ref={streakRef}
            args={[undefined, undefined, STREAK_COUNT]}
          >
            <cylinderGeometry args={[0.04, 0.01, 1.0, 4]} />
            <meshStandardMaterial
              color="#ff9900"
              emissive="#ff6600"
              emissiveIntensity={7}
              transparent
              opacity={0.9}
              depthWrite={false}
              toneMapped={false}
            />
          </instancedMesh>

          {/* 煙 */}
          <instancedMesh
            ref={smokeRef}
            args={[undefined, undefined, SMOKE_COUNT]}
          >
            <icosahedronGeometry args={[0.5, 1]} />
            <meshStandardMaterial
              color="#444444"
              transparent
              opacity={0.3}
              depthWrite={false}
            />
          </instancedMesh>

          {/* エンバー（残り火）*/}
          <instancedMesh
            ref={emberRef}
            args={[undefined, undefined, EMBER_COUNT]}
          >
            <sphereGeometry args={[0.1, 6, 6]} />
            <meshStandardMaterial
              color="#ff2200"
              emissive="#ff7700"
              emissiveIntensity={7}
              toneMapped={false}
            />
          </instancedMesh>

          {/* フェードアウト用オーバーレイ */}
          <mesh ref={fadeOutRef} position={[0, 0, -0.1]}>
            <planeGeometry args={[200, 200]} />
            <meshBasicMaterial
              color="#000000"
              transparent
              opacity={0}
              depthTest={false}
            />
          </mesh>
        </>
      )}

      {/* 破片（カードの残骸）*/}
      <instancedMesh
        ref={debrisMeshRef}
        args={[undefined, undefined, DEBRIS_COUNT]}
      >
        <boxGeometry args={[0.25, 0.35, 0.03]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ff8800"
          emissiveIntensity={1.0}
          side={THREE.DoubleSide}
          roughness={0.3}
          metalness={0.2}
        />
      </instancedMesh>
    </group>
  );
};

// ── テキスト付きフルオーバーレイ ─────────────────────────────────────────
type ExplosionOverlayProps = {
  partnerName?: string;
  onComplete?: () => void;
  zIndex?: number;
};

export const ExplosionOverlay: React.FC<ExplosionOverlayProps> = ({
  partnerName,
  onComplete,
  zIndex = 100,
}) => (
  <div
    className="fixed inset-0 pointer-events-none"
    style={{ zIndex }}
  >
    <Canvas>
      <Explosion onComplete={onComplete} />
    </Canvas>
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
      <style>{`
        @keyframes bombText {
          0%   { transform: scale(0.2) rotate(-8deg); opacity: 0; }
          40%  { transform: scale(1.15) rotate(3deg); opacity: 1; }
          60%  { transform: scale(0.95) rotate(-1deg); opacity: 1; }
          80%  { transform: scale(1.05) rotate(1deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes bombOrange {
          0%, 100% { text-shadow: 0 0 20px #ff6b00, 0 0 50px #ff3d00, 0 0 100px #ff6b00; }
          50%       { text-shadow: 0 0 40px #ff9500, 0 0 80px #ff6b00, 0 0 160px #ff3d00; }
        }
      `}</style>
      {partnerName && (
        <div
          style={{
            animation:
              "bombText 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards, bombOrange 1s ease-in-out 0.5s infinite",
            fontSize: "clamp(2rem, 9vw, 5rem)",
            fontWeight: 900,
            background:
              "linear-gradient(135deg, #ff6b00 0%, #ff3d00 40%, #ffcc00 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "0.04em",
          }}
        >
          {partnerName}さんを爆破！
        </div>
      )}
    </div>
  </div>
);
