'use client';

import { useState } from 'react';
import { SwipeContainer } from '@/components/matching/SwipeContainer';
import { MatchingFilter } from '@/components/matching/MatchingFilter';

interface Profile {
  id: string;
  username: string;
  age: number;
  interests: string;
  image?: string;
  compatibility: number;
}

export default function DiscoverPage() {
  const [filters, setFilters] = useState({});

  const handleFilter = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleLike = (profile: Profile) => {
    console.log('Liked:', profile.username);
  };

  const handlePass = (profile: Profile) => {
    console.log('Passed:', profile.username);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          気になる相手を探す
        </h1>
        <p className="text-gray-600">
          スワイプしてあなたの理想の人を見つけましょう
        </p>
      </div>

      {/* フィルター */}
      <div className="mb-8 flex justify-center">
        <MatchingFilter onFilter={handleFilter} />
      </div>

      {/* スワイプコンテナ */}
      <div className="flex justify-center">
        <SwipeContainer
          onLike={handleLike}
          onPass={handlePass}
        />
      </div>
    </div>
  );
}
