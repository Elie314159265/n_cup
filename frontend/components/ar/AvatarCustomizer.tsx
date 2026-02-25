"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";
import { AvatarViewer } from "./AvatarViewer";

interface AvatarCustomizerProps {
  onSave?: (avatarData: AvatarConfig) => void;
}

interface AvatarConfig {
  hairStyle: string;
  hairColor: string;
  skinColor: string;
  clothing: string;
  voiceType: string;
}

export const AvatarCustomizer = ({ onSave }: AvatarCustomizerProps) => {
  const [avatar, setAvatar] = useState<AvatarConfig>({
    hairStyle: "long",
    hairColor: "brown",
    skinColor: "medium",
    clothing: "casual",
    voiceType: "female_soft",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof AvatarConfig, value: string) => {
    setAvatar((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/ar_avatars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(avatar),
      });

      if (!response.ok) throw new Error("保存に失敗しました");

      onSave?.(avatar);
    } catch (error) {
      console.error("アバター保存エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <AvatarViewer avatarData={avatar} />

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            髪型
          </label>
          <select
            value={avatar.hairStyle}
            onChange={(e) => handleChange("hairStyle", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="short">ショート</option>
            <option value="medium">ミディアム</option>
            <option value="long">ロング</option>
            <option value="curly">カーリー</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            髪色
          </label>
          <div className="flex gap-2">
            {["black", "brown", "blonde", "red"].map((color) => (
              <button
                key={color}
                onClick={() => handleChange("hairColor", color)}
                className={`w-8 h-8 rounded-full border-2 ${
                  avatar.hairColor === color
                    ? "border-gray-900"
                    : "border-gray-300"
                } ${
                  color === "black"
                    ? "bg-black"
                    : color === "brown"
                    ? "bg-amber-700"
                    : color === "blonde"
                    ? "bg-yellow-300"
                    : "bg-red-500"
                }`}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            肌色
          </label>
          <div className="flex gap-2">
            {[
              {
                key: "very_light",
                label: "とても明るい",
                color: "bg-yellow-100",
              },
              { key: "light", label: "明るい", color: "bg-yellow-200" },
              { key: "medium", label: "普通", color: "bg-amber-300" },
              { key: "dark", label: "暗い", color: "bg-amber-600" },
              { key: "very_dark", label: "とても暗い", color: "bg-amber-900" },
            ].map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => handleChange("skinColor", key)}
                className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                  avatar.skinColor === key
                    ? "border-gray-900 shadow-md"
                    : "border-gray-200 hover:border-gray-300"
                } ${color}`}
                title={label}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            服装
          </label>
          <select
            value={avatar.clothing}
            onChange={(e) => handleChange("clothing", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="casual">カジュアル</option>
            <option value="formal">フォーマル</option>
            <option value="sporty">スポーティー</option>
            <option value="elegant">エレガント</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            声のタイプ
          </label>
          <select
            value={avatar.voiceType}
            onChange={(e) => handleChange("voiceType", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="female_soft">女性（優しい）</option>
            <option value="female_energetic">女性（元気）</option>
            <option value="female_cool">女性（クール）</option>
            <option value="male_soft">男性（優しい）</option>
            <option value="male_energetic">男性（元気）</option>
          </select>
        </div>

        <Button onClick={handleSave} loading={loading} className="w-full">
          アバターを保存
        </Button>
      </div>
    </div>
  );
};
