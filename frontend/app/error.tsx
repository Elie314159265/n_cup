"use client";

import Link from "next/link";
import { Button } from "@/components/common/Button";

export default function ErrorPage({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">⚠️</h1>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          エラーが発生しました
        </h2>
        <p className="text-gray-600 mb-8">
          申し訳ありません。問題が発生しました。
        </p>
        <Link href="/">
          <Button size="lg">ホームに戻る</Button>
        </Link>
      </div>
    </div>
  );
}
