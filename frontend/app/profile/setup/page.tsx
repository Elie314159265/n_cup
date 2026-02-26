"use client";

import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import { ProfileSetup } from "@/components/auth/ProfileSetup";

export default function ProfileSetupPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/avatar/customize");
  };

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
          <p className="text-sm text-gray-500">あなたの情報を教えてください</p>
        </div>
        <ProfileSetup onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
