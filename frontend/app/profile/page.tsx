"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Loading } from "@/components/common/Loading";
import { ProfileSetup } from "@/components/auth/ProfileSetup";
import { getProfile } from "@/actions/users";

interface UserProfile {
  id: string;
  username: string;
  age: number;
  gender: string;
  bio: string;
  interests: string;
  image?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const fetchProfile = () => {
    const profileId =
      typeof window !== "undefined" ? localStorage.getItem("profile_id") : null;
    if (!profileId) {
      setLoading(false);
      return;
    }

    getProfile(Number(profileId))
      .then((data) => {
        setProfile({
          id: String(data.id),
          username: data.display_name,
          age: data.age,
          gender: data.gender,
          bio: data.bio ?? "",
          interests: data.interests?.join("・") ?? "",
          image: data.avatar_url ?? undefined,
        });
      })
      .catch(() => {
        setProfile(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleEditSuccess = () => {
    setIsEditing(false);
    setLoading(true);
    fetchProfile();
  };

  if (loading) return <Loading message="プロフィールを読み込み中..." />;

  // 初回登録（プロフィール未設定）
  if (!profile && !isEditing) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              プロフィール作成
            </h1>
            <p className="text-gray-600">あなたの情報を教えてください</p>
          </div>
          <ProfileSetup onSuccess={handleEditSuccess} />
        </div>
      </div>
    );
  }

  // 編集モード
  if (isEditing) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              プロフィール編集
            </h1>
            <button
              onClick={() => setIsEditing(false)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              キャンセル
            </button>
          </div>
          <ProfileSetup onSuccess={handleEditSuccess} />
        </div>
      </div>
    );
  }

  // 表示モード
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 h-32"></div>

        <div className="px-8 py-8">
          <div className="flex items-start gap-6 mb-8">
            {profile!.image ? (
              <div className="relative w-24 h-24 -mt-16">
                <Image
                  src={profile!.image}
                  alt={profile!.username}
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
                {profile!.username}
              </h1>
              <p className="text-gray-600 mt-1">
                {profile!.age}歳 • {profile!.gender}
              </p>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
            >
              編集
            </button>
          </div>

          <div className="space-y-6">
            {profile!.bio && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">自己紹介</h3>
                <p className="text-gray-600">{profile!.bio}</p>
              </div>
            )}

            {profile!.interests && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">趣味・特技</h3>
                <p className="text-gray-600">{profile!.interests}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
