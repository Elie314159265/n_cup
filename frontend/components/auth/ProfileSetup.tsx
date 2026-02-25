"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";
import { createProfile, updateProfile } from "@/actions/users";
import type { Gender } from "@/types/user";

interface ProfileSetupProps {
  onSuccess?: () => void;
}

export const ProfileSetup = ({ onSuccess }: ProfileSetupProps) => {
  const [formData, setFormData] = useState({
    age: 20,
    gender: "female",
    bio: "",
    interests: "",
    occupation: "",
    mbti: "INTJ",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const profileIdStr =
        typeof window !== "undefined"
          ? localStorage.getItem("profile_id")
          : null;
      const username =
        typeof window !== "undefined"
          ? (localStorage.getItem("username") ?? "")
          : "";

      const body = {
        display_name: username,
        bio: formData.bio,
        age: Number(formData.age),
        gender: formData.gender as Gender,
        personality: formData.mbti,
        interests: formData.interests
          ? formData.interests.split(",").map((s) => s.trim())
          : [],
        preferences: { occupation: formData.occupation },
      };

      if (profileIdStr) {
        await updateProfile(Number(profileIdStr), body);
      } else {
        const result = await createProfile(body);
        localStorage.setItem("profile_id", String(result.profile.id));
      }
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          年齢
        </label>
        <input
          type="number"
          name="age"
          value={formData.age}
          onChange={handleChange}
          min={18}
          max={100}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          性別
        </label>
        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
        >
          <option value="female">女性</option>
          <option value="male">男性</option>
          <option value="other">その他</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          職業
        </label>
        <input
          type="text"
          name="occupation"
          value={formData.occupation}
          onChange={handleChange}
          placeholder="例：エンジニア、デザイナー、営業"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          MBTI
        </label>
        <select
          name="mbti"
          value={formData.mbti}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
        >
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          趣味・特技
        </label>
        <input
          type="text"
          name="interests"
          value={formData.interests}
          onChange={handleChange}
          placeholder="例：映画鑑賞、旅行、カフェ巡り"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          自己紹介
        </label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          placeholder="自分のことを教えてください"
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
        />
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <Button type="submit" loading={loading} className="w-full">
        プロフィール作成
      </Button>
    </form>
  );
};
