"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { User, Pencil } from "lucide-react";
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
  const [loading, setLoading] = useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem("profile_id") !== null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const profileId =
      typeof window !== "undefined" ? localStorage.getItem("profile_id") : null;
    if (!profileId) return;

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
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const handleEditSuccess = () => {
    setIsEditing(false);
    setLoading(true);
    setRefreshKey((k) => k + 1);
  };

  if (loading) return <Loading message="プロフィールを読み込み中..." />;

  if (!profile && !isEditing) {
    return (
      <div className="page-bg min-h-screen flex items-center justify-center px-4">
        <div className="card p-8 w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className="icon-box mx-auto mb-4">
              <User size={20} />
            </div>
            <h1 className="text-2xl font-black gradient-text mb-1">
              プロフィール作成
            </h1>
            <p className="text-gray-500 text-sm">
              あなたの情報を教えてください
            </p>
          </div>
          <ProfileSetup onSuccess={handleEditSuccess} />
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="page-bg min-h-screen flex items-center justify-center px-4">
        <div className="card p-8 w-full max-w-2xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-black gradient-text">
              プロフィール編集
            </h1>
            <button
              onClick={() => setIsEditing(false)}
              className="text-sm text-gray-500 hover:text-gray-700 font-semibold transition-colors px-3 py-1 rounded-lg hover:bg-gray-100"
            >
              キャンセル
            </button>
          </div>
          <ProfileSetup onSuccess={handleEditSuccess} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="card overflow-hidden">
          <div
            className="h-24"
            style={{ background: "linear-gradient(135deg, #ec4899, #8b5cf6)" }}
          />
          <div className="px-8 py-6">
            <div className="flex items-start gap-5 mb-6">
              {profile!.image ? (
                <div className="relative w-20 h-20 -mt-14">
                  <Image
                    src={profile!.image}
                    alt={profile!.username}
                    fill
                    className="rounded-2xl object-cover border-4 border-white shadow-md"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center -mt-14 border-4 border-white shadow-md bg-violet-50">
                  <User size={28} className="text-violet-400" />
                </div>
              )}
              <div className="flex-1 pt-3">
                <h1 className="text-xl font-black text-gray-900">
                  {profile!.username}
                </h1>
                <p className="text-gray-400 text-sm mt-0.5">
                  {profile!.age}歳 • {profile!.gender}
                </p>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="mt-3 flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl text-white transition-opacity hover:opacity-80"
                style={{
                  background: "linear-gradient(135deg, #ec4899, #8b5cf6)",
                }}
              >
                <Pencil size={13} />
                編集
              </button>
            </div>

            <div className="space-y-3">
              {profile!.bio && (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    自己紹介
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {profile!.bio}
                  </p>
                </div>
              )}
              {profile!.interests && (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    趣味・特技
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {profile!.interests}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
