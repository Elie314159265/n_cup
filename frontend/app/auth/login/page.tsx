"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/discover");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">
            Link Persona
          </h1>
          <p className="text-lg font-semibold text-gray-700">ログイン</p>
        </div>

        <LoginForm onSuccess={handleSuccess} />

        <div className="mt-8 border-t border-gray-200 pt-6">
          <p className="text-center text-gray-600 mb-4">
            アカウントをお持ちでないですか？
          </p>
          <Link href="/auth/signup">
            <button className="w-full px-4 py-2 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition-colors">
              新規登録
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
