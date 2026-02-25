"use client";

import { useRouter } from "next/navigation";
import { ProfileSetup } from "@/components/auth/ProfileSetup";

export default function ProfileSetupPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/avatar/customize");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              プロフィール作成
            </h1>
            <p className="text-gray-600">あなたの情報を教えてください</p>
          </div>

          <ProfileSetup onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
}
