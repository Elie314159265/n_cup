"use client";

import Link from "next/link";
import { Button } from "@/components/common/Button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
      {/* ヒーロー */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-6">
            Link Persona
          </h1>
          <p className="text-2xl text-gray-700 mb-4">
            このアプリで仲間を発見しよう！
          </p>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            趣味や価値観が合った友達を見つけるためのAIマッチングアプリ。
            <br />
            相手のAIアバターと会話して、実際に会う前に相性を確認できます。
          </p>

          <div className="flex gap-4 justify-center mb-12">
            <Link href="/auth/signup">
              <Button size="lg">新規登録</Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="secondary" size="lg">
                ログイン
              </Button>
            </Link>
          </div>
        </div>

        {/* 特徴 */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white rounded-lg p-8 shadow-lg text-center">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-xl font-bold mb-3">なりきりAIとで気軽に会話</h3>
            <p className="text-gray-600">
              相手のプロフィール情報を基にAIが相手になりきって会話。<br></br>
              実際に会う前に相手の人柄や相性を確認できます。
            </p>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-lg text-center">
            <div className="text-5xl mb-4">🎨</div>
            <h3 className="text-xl font-bold mb-3">自分らしいアバターを作成</h3>
            <p className="text-gray-600">
              髪型・髪色・肌色・服装・声を細かくカスタマイズして、<br></br>
              自分らしいアバターを表現できます。
            </p>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-lg text-center">
            <div className="text-5xl mb-4">🏅</div>
            <h3 className="text-xl font-bold mb-3">
              相手との相性をスコアでチェック
            </h3>
            <p className="text-gray-600">
              共通の趣味や価値観から自動計算した相性スコアで、<br></br>
              気になる相手との相性が一目でわかります。
            </p>
          </div>
        </div>

        {/* 使い方 */}
        <div className="mt-20 bg-white rounded-lg p-12 shadow-lg">
          <h2 className="text-3xl font-bold text-center mb-12">使い方</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-pink-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-pink-600">
                1
              </div>
              <h4 className="font-bold mb-2">登録</h4>
              <p className="text-sm text-gray-600">
                メールアドレスとユーザー名で登録
              </p>
            </div>

            <div className="text-center">
              <div className="bg-pink-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-pink-600">
                2
              </div>
              <h4 className="font-bold mb-2">プロフィール作成</h4>
              <p className="text-sm text-gray-600">
                年齢、性別、趣味などを入力
              </p>
            </div>

            <div className="text-center">
              <div className="bg-pink-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-pink-600">
                3
              </div>
              <h4 className="font-bold mb-2">アバター作成</h4>
              <p className="text-sm text-gray-600">
                自分のアバターをカスタマイズ
              </p>
            </div>

            <div className="text-center">
              <div className="bg-pink-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-pink-600">
                4
              </div>
              <h4 className="font-bold mb-2">マッチング</h4>
              <p className="text-sm text-gray-600">
                気になる人を見つけて会話開始
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
