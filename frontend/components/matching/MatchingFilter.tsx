"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";

interface MatchingFilterProps {
  onFilter: (filters: FilterOptions) => void;
}

export interface FilterOptions {
  ageMin?: number;
  gender?: string;
  interests?: string;
  mbti?: string;
}

export const MatchingFilter = ({ onFilter }: MatchingFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    ageMin: 18,
    gender: "all",
    interests: "",
    mbti: "all",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const newFilters = {
      ...filters,
      [name]: name.includes("age") ? Number(value) : value,
    };
    setFilters(newFilters);
  };

  const handleApply = () => {
    onFilter(filters);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button variant="secondary" onClick={() => setIsOpen(!isOpen)}>
        🔍 フィルター
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg p-6 w-80 z-10">
          <h3 className="font-semibold text-gray-900 mb-4">フィルター条件</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                年齢: {filters.ageMin}歳以上
              </label>
              <input
                type="range"
                name="ageMin"
                min={18}
                max={100}
                value={filters.ageMin}
                onChange={handleChange}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>18</span>
                <span>100</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                性別
              </label>
              <select
                name="gender"
                value={filters.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">全て</option>
                <option value="female">女性</option>
                <option value="male">男性</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                趣味（キーワード）
              </label>
              <input
                type="text"
                name="interests"
                value={filters.interests}
                onChange={handleChange}
                placeholder="例：映画"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MBTI
              </label>
              <select
                name="mbti"
                value={filters.mbti}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">全て</option>
                <option value="INTJ">INTJ (建築家)</option>
                <option value="INTP">INTP (論理学者)</option>
                <option value="ENTJ">ENTJ (指揮官)</option>
                <option value="ENTP">ENTP (討論者)</option>
                <option value="INFJ">INFJ (提唱者)</option>
                <option value="INFP">INFP (仲介者)</option>
                <option value="ENFJ">ENFJ (主人公)</option>
                <option value="ENFP">ENFP (活動家)</option>
                <option value="ISTJ">ISTJ (管理者)</option>
                <option value="ISFJ">ISFJ (擁護者)</option>
                <option value="ESTJ">ESTJ (幹部)</option>
                <option value="ESFJ">ESFJ (領事)</option>
                <option value="ISTP">ISTP (巨匠)</option>
                <option value="ISFP">ISFP (冒険家)</option>
                <option value="ESTP">ESTP (起業家)</option>
                <option value="ESFP">ESFP (エンターテイナー)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button
              variant="secondary"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button onClick={handleApply} className="flex-1">
              適用
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
