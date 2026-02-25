import React, { useRef, useMemo, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

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
  const debrisRef = useRef<THREE.InstancedMesh>(null);
  const shockwaveRef = useRef<THREE.Mesh>(null);
  const fadeOutRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(true);

  // カメラの初期位置を保存（シェイク後の復帰用）
  const initialCameraPos = useRef(camera.position.clone());

  useEffect(() => {
    return () => {
      // アンマウント時にカメラ位置をリセット
      camera.position.copy(initialCameraPos.current);
    };
  }, [camera]);

  // 火花（スパーク）のデータ
  const sparks = useMemo(() => {
    return new Array(count * 3).fill(0).map(() => ({
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 30, // 拡散範囲をさらに拡大
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30,
      ),
      scale: Math.random() * 0.3 + 0.1,
      rotation: new THREE.Vector3(Math.random(), Math.random(), Math.random()),
    }));
  }, [count]);

  // 煙（スモーク）のデータ
  const smokes = useMemo(() => {
    return new Array(Math.floor(count / 2)).fill(0).map(() => ({
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 3 + 1, // 上昇気味
        (Math.random() - 0.5) * 4,
      ),
      scale: Math.random() * 0.5 + 0.5,
    }));
  }, [count]);

  // 破片（カードの残骸）のデータ
  const debris = useMemo(() => {
    return new Array(40).fill(0).map(() => ({
      currentPos: new THREE.Vector3(position[0], position[1], position[2]),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 25,
        (Math.random() - 0.5) * 25,
        (Math.random() - 0.5) * 25 + 5, // カメラ方向（Z+）へ飛びやすくする
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
  }, [position]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (!isActive) return;

    // 時間経過を更新
    const newTime = time + delta;
    setTime(newTime);

    const duration = 1.8; // 積もる様子を見せるために時間を延長

    if (newTime >= duration) {
      setIsActive(false);
      // 終了時にカメラ位置を戻す
      camera.position.copy(initialCameraPos.current);
      if (onComplete) onComplete();
      return;
    }

    // カメラシェイク (最初の0.3秒間、強度アップ)
    if (newTime < 0.3) {
      const shakeIntensity = (0.3 - newTime) * 3.0;
      camera.position.x =
        initialCameraPos.current.x + (Math.random() - 0.5) * shakeIntensity;
      camera.position.y =
        initialCameraPos.current.y + (Math.random() - 0.5) * shakeIntensity;
    } else {
      // シェイク終了後は位置を戻す
      camera.position.copy(initialCameraPos.current);
    }

    // フラッシュの更新（ビッグバンのような閃光）
    if (flashRef.current) {
      const flashDuration = 0.25; // 閃光の持続時間
      if (newTime < flashDuration) {
        const progress = newTime / flashDuration;
        // 急激に拡大させる
        const scale = 1 + progress * 20;
        flashRef.current.scale.setScalar(scale);
        // 急速にフェードアウト
        const material = flashRef.current.material as THREE.MeshBasicMaterial;
        material.opacity = 1 - Math.pow(progress, 0.5);
      } else {
        flashRef.current.visible = false;
      }
    }

    // 衝撃波の更新
    if (shockwaveRef.current) {
      // カメラの方を向かせる
      shockwaveRef.current.lookAt(camera.position);
      // 急速に拡大
      const waveScale = 1 + newTime * 30;
      shockwaveRef.current.scale.setScalar(waveScale);
      const material = shockwaveRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0, 0.8 - newTime * 2);
    }

    // フェードアウト（暗転）
    if (fadeOutRef.current) {
      // カメラに追従させて画面全体を覆う
      fadeOutRef.current.position.copy(camera.position);
      fadeOutRef.current.quaternion.copy(camera.quaternion);
      fadeOutRef.current.translateZ(-0.5); // カメラの少し前

      const fadeStart = 1.2; // 暗転開始を遅らせる
      if (newTime > fadeStart) {
        const fadeDuration = duration - fadeStart;
        const progress = (newTime - fadeStart) / fadeDuration;
        const material = fadeOutRef.current.material as THREE.MeshBasicMaterial;
        material.opacity = Math.min(1, progress);
      }
    }

    // 火花の更新
    if (sparkRef.current) {
      sparks.forEach((p, i) => {
        // 空気抵抗による減速
        const friction = Math.exp(-newTime * 3);

        dummy.position.set(
          position[0] + p.velocity.x * newTime * friction,
          position[1] + p.velocity.y * newTime * friction,
          position[2] + p.velocity.z * newTime * friction,
        );

        // 回転
        dummy.rotation.set(
          p.rotation.x + newTime * 10,
          p.rotation.y + newTime * 10,
          p.rotation.z + newTime * 10,
        );

        const scale = Math.max(0, p.scale * (1 - newTime / duration));
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        sparkRef.current!.setMatrixAt(i, dummy.matrix);
      });
      sparkRef.current.instanceMatrix.needsUpdate = true;
    }

    // 煙の更新
    if (smokeRef.current) {
      smokes.forEach((p, i) => {
        dummy.position.set(
          position[0] + p.velocity.x * newTime,
          position[1] + p.velocity.y * newTime,
          position[2] + p.velocity.z * newTime,
        );

        dummy.rotation.set(newTime, newTime, newTime);

        // 煙は膨らみながら消える
        const life = 1 - newTime / duration;
        const scale = p.scale * (1 + newTime * 3) * life;
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        smokeRef.current!.setMatrixAt(i, dummy.matrix);
      });
      smokeRef.current.instanceMatrix.needsUpdate = true;
    }

    // 破片の更新
    if (debrisRef.current) {
      debris.forEach((p, i) => {
        // 重力の影響
        p.velocity.y -= 25.0 * delta; // 重力を強くして落下させる

        // 位置更新（速度積分）
        p.currentPos.addScaledVector(p.velocity, delta);

        // 回転更新
        dummy.rotation.set(
          p.rotation.x + p.rotSpeed.x * newTime,
          p.rotation.y + p.rotSpeed.y * newTime,
          p.rotation.z + p.rotSpeed.z * newTime,
        );

        // 地面（画面下部）との衝突判定
        const groundLevel = -3.5 + Math.sin(i * 12.34) * 0.3; // ランダムな高さで積もらせる
        if (p.currentPos.y < groundLevel) {
          p.currentPos.y = groundLevel;
          p.velocity.y *= -0.3; // バウンド（減衰）
          p.velocity.x *= 0.7; // 摩擦
          p.velocity.z *= 0.7;
        }

        dummy.position.copy(p.currentPos);
        dummy.scale.setScalar(p.scale); // 積もった破片を見せるためスケールは維持
        dummy.updateMatrix();
        debrisRef.current!.setMatrixAt(i, dummy.matrix);
      });
      debrisRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
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
          <mesh ref={fadeOutRef}>
            <planeGeometry args={[10, 10]} />
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
      <instancedMesh ref={debrisRef} args={[undefined, undefined, 40]}>
        <boxGeometry args={[0.2, 0.3, 0.02]} />
        <meshStandardMaterial color="#ffffff" side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  );
};
