"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Loading } from "@/components/common/Loading";

interface UserProfile {
  id: string;
  username: string;
  age: number;
  gender: string;
  bio: string;
  interests: string;
  cupSize: string;
  image?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) return <Loading message="プロフィールを読み込み中..." />;

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-gray-600">
        プロフィールが見つかりません
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 h-32"></div>

        {/* プロフィール内容 */}
        <div className="px-8 py-8">
          <div className="flex items-start gap-6 mb-8">
            {profile.image ? (
              <div className="relative w-24 h-24 -mt-16">
                <Image
                  src={profile.image}
                  alt={profile.username}
                  fill
                  className="rounded-full object-cover border-4 border-white shadow-lg"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-pink-300 to-purple-300 flex items-center justify-center text-4xl -mt-16 border-4 border-white shadow-lg">
                👤
              </div>
            )}

            <div className="flex-1 pt-4">
              <h1 className="text-3xl font-bold text-gray-900">
                {profile.username}
              </h1>
              <p className="text-gray-600 mt-1">
                {profile.age}歳 • {profile.gender}
              </p>
            </div>

            <button className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors">
              編集
            </button>
          </div>

          {/* 詳細情報 */}
          <div className="space-y-6">
            {profile.bio && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">自己紹介</h3>
                <p className="text-gray-600">{profile.bio}</p>
              </div>
            )}

            {profile.interests && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">趣味・特技</h3>
                <p className="text-gray-600">{profile.interests}</p>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">カップサイズ</h3>
              <p className="text-gray-600">{profile.cupSize}カップ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
