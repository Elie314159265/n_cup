"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";
import { signIn } from "@/actions/auth";

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await signIn({ email, password });
      // トークンとユーザー情報をlocalStorageに保存
      localStorage.setItem("id_token", data.id_token);
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_id", String(data.user.id));
      localStorage.setItem("username", data.user.username);
      if (data.profile_id) {
        localStorage.setItem("profile_id", String(data.profile_id));
      }
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ログインエラー");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          メールアドレス
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          パスワード
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          required
        />
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={loading}
        className="w-full text-lg shadow-lg shadow-pink-500/30"
      >
        ログイン
      </Button>
    </form>
  );
};
