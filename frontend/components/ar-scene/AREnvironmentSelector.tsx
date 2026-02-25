"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";

interface EnvironmentOption {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

interface AREnvironmentSelectorProps {
  onSelect?: (environmentId: string) => void;
}

const ENVIRONMENTS: EnvironmentOption[] = [
  {
    id: "cafe",
    name: "カフェ",
    emoji: "☕",
    description: "リラックスな雰囲気",
  },
  {
    id: "park",
    name: "公園",
    emoji: "🌳",
    description: "のんびりした雰囲気",
  },
  {
    id: "beach",
    name: "ビーチ",
    emoji: "🏖️",
    description: "リゾート気分",
  },
  {
    id: "night_city",
    name: "ナイトシティ",
    emoji: "🌃",
    description: "ロマンチック",
  },
  {
    id: "restaurant",
    name: "レストラン",
    emoji: "🍽️",
    description: "ムーディー",
  },
  {
    id: "library",
    name: "ライブラリ",
    emoji: "📚",
    description: "インテリ",
  },
];

export const AREnvironmentSelector = ({
  onSelect,
}: AREnvironmentSelectorProps) => {
  const [selected, setSelected] = useState<string>("cafe");

  const handleSelect = (envId: string) => {
    setSelected(envId);
    onSelect?.(envId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          会話する環境を選ぶ
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {ENVIRONMENTS.map((env) => (
            <button
              key={env.id}
              onClick={() => handleSelect(env.id)}
              className={`p-4 rounded-lg transition-all ${
                selected === env.id
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg scale-105"
                  : "bg-white border border-gray-200 text-gray-900 hover:border-pink-300"
              }`}
            >
              <div className="text-4xl mb-2">{env.emoji}</div>
              <div className="font-semibold text-sm">{env.name}</div>
              <div className="text-xs opacity-75 mt-1">{env.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <p className="text-sm text-blue-900">
          💡
          選んだ環境がAR空間に表示されます。相手のアバターもこの環境に表示されます。
        </p>
      </div>

      <Button className="w-full">この環境で会話を開始</Button>
    </div>
  );
};
