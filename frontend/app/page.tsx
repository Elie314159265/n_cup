"use client";

import Link from "next/link";
import { MessageCircle, Wand2, Star, UserPlus, LogIn } from "lucide-react";
import { Button } from "@/components/common/Button";

const FEATURES = [
  {
    icon: <MessageCircle size={22} />,
    title: "なりきりAIと気軽に会話",
    desc: "相手のプロフィール情報を基にAIが相手になりきって会話。実際に会う前に相手の人柄や相性を確認できます。",
  },
  {
    icon: <Wand2 size={22} />,
    title: "自分らしいアバターを作成",
    desc: "髪型・髪色・肌色・服装・声を細かくカスタマイズして、自分らしいアバターを表現できます。",
  },
  {
    icon: <Star size={22} />,
    title: "相性をスコアでチェック",
    desc: "共通の趣味や価値観から自動計算した相性スコアで、気になる相手との相性が一目でわかります。",
  },
];

const STEPS = [
  { n: "1", label: "登録", desc: "メールとユーザー名で登録" },
  { n: "2", label: "プロフィール", desc: "年齢・性別・趣味を入力" },
  { n: "3", label: "アバター", desc: "自分らしくカスタマイズ" },
  { n: "4", label: "マッチング", desc: "気になる人と会話開始" },
];

export default function Home() {
  return (
    <div className="page-bg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* ヒーロー */}
        <div className="text-center mb-20">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide mb-6 text-violet-600"
            style={{ background: "#f3e8ff", border: "1px solid #e9d5ff" }}
          >
            AI MATCHING APP
          </div>
          <h1 className="text-5xl md:text-6xl font-black gradient-text mb-5 leading-tight tracking-tight">
            Link Persona
          </h1>
          <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
            趣味や価値観が合った友達を見つけるAIマッチングアプリ。
            相手のAIアバターと会話して、実際に会う前に相性を確認できます。
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/auth/signup">
              <Button size="lg">
                <UserPlus size={16} className="mr-2" />
                新規登録
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="secondary" size="lg">
                <LogIn size={16} className="mr-2" />
                ログイン
              </Button>
            </Link>
          </div>
        </div>

        {/* 特徴 */}
        <div className="grid md:grid-cols-3 gap-5 mb-12">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-7">
              <div className="icon-box mb-5">{f.icon}</div>
              <h3 className="text-base font-bold mb-2 text-gray-900">
                {f.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* 使い方 */}
        <div className="card p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-8">使い方</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex flex-col items-start gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white"
                  style={{
                    background: `linear-gradient(135deg, #ec4899 ${i * 25}%, #6366f1 100%)`,
                  }}
                >
                  {s.n}
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900">{s.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
