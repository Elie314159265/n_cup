"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/profile");
  };

  return (
    <div className="page-bg min-h-screen flex items-center justify-center px-4">
      <div className="card p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="icon-box mx-auto mb-4">
            <UserPlus size={20} />
          </div>
          <h1 className="text-2xl font-black gradient-text mb-1">
            Link Persona
          </h1>
          <p className="text-sm text-gray-500">新規アカウント登録</p>
        </div>

        <SignupForm onSuccess={handleSuccess} />

        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="text-center text-gray-400 text-xs mb-3">
            すでにアカウントをお持ちですか？
          </p>
          <Link href="/auth/login">
            <button
              className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150 text-violet-600 hover:bg-violet-50"
              style={{ border: "1px solid #e9d5ff" }}
            >
              ログインはこちら
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
