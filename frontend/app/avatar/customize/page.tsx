"use client";

import { useRouter } from "next/navigation";
import { Wand2 } from "lucide-react";
import { AvatarCustomizer } from "@/components/ar-scene/AvatarCustomizer";

export default function AvatarCustomizePage() {
  const router = useRouter();

  const handleSave = (_avatarData: unknown) => {
    router.push("/discover");
  };

  return (
    <div className="page-bg min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="icon-box mx-auto mb-4">
            <Wand2 size={20} />
          </div>
          <h1 className="text-2xl font-black gradient-text mb-1">
            AR\u30a2\u30d0\u30bf\u30fc\u3092\u4f5c\u6210
          </h1>
          <p className="text-gray-500 text-sm">
            \u81ea\u5206\u306e\u30a2\u30d0\u30bf\u30fc\u3092\u30ab\u30b9\u30bf\u30de\u30a4\u30ba\u3057\u307e\u3057\u3087\u3046
          </p>
        </div>
        <AvatarCustomizer onSave={handleSave} />
      </div>
    </div>
  );
}
