"use client";

import { useEffect, useRef } from "react";
import { Loading } from "@/components/common/Loading";

interface AvatarViewerProps {
  avatarData?: {
    hairStyle: string;
    hairColor: string;
    skinColor: string;
    clothing: string;
    bodyType: string;
  };
  isLoading?: boolean;
}

export const AvatarViewer = ({
  avatarData,
  isLoading = false,
}: AvatarViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Three.jsでのアバター描画ロジック
    // ここではプレースホルダーを表示
    if (canvasRef.current && avatarData) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#f3f4f6";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#9ca3af";
        ctx.font = "16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          "3Dアバター表示エリア",
          canvas.width / 2,
          canvas.height / 2
        );
      }
    }
  }, [avatarData]);

  if (isLoading) {
    return <Loading message="アバターを読み込み中..." />;
  }

  return (
    <div className="bg-gradient-to-b from-blue-100 to-purple-100 rounded-lg overflow-hidden shadow-lg h-96 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="w-full h-full"
      />
    </div>
  );
};
