"use client";

interface LoadingProps {
  message?: string;
}

export const Loading = ({ message = "ローディング中..." }: LoadingProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-pink-500"></div>
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  );
};
