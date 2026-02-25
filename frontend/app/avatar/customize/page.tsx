"use client";

import { useRouter } from "next/navigation";
import { AvatarCustomizer } from "@/components/ar-scene/AvatarCustomizer";

export default function AvatarCustomizePage() {
  const router = useRouter();

  const handleSave = (avatarData: any) => {
    router.push("/discover");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ARアバターを作成
        </h1>
        <p className="text-gray-600">自分のアバターをカスタマイズしましょう</p>
      </div>

      <AvatarCustomizer onSave={handleSave} />
    </div>
  );
}
