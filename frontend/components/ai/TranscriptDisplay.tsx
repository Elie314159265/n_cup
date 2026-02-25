"use client";

interface TranscriptDisplayProps {
  userTranscript?: string;
  aiTranscript?: string;
  isLoading?: boolean;
}

export const TranscriptDisplay = ({
  userTranscript,
  aiTranscript,
  isLoading = false,
}: TranscriptDisplayProps) => {
  return (
    <div className="space-y-4">
      {userTranscript && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-xs font-semibold text-blue-900 mb-2">あなた</p>
          <p className="text-gray-900">{userTranscript}</p>
        </div>
      )}

      {isLoading && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2">
            <span className="animate-pulse">⏳</span>
            <span className="text-gray-600">思考中...</span>
          </div>
        </div>
      )}

      {aiTranscript && (
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-xs font-semibold text-purple-900 mb-2">
            AIアバター
          </p>
          <p className="text-gray-900">{aiTranscript}</p>
        </div>
      )}
    </div>
  );
};
