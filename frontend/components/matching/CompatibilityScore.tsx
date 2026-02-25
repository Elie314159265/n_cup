"use client";

interface CompatibilityScoreProps {
  score: number;
  reasons?: string[];
}

export const CompatibilityScore = ({
  score,
  reasons = [],
}: CompatibilityScoreProps) => {
  const getColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-blue-500";
    if (score >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">相性スコア</p>
        <p className={`text-4xl font-bold ${getColor(score)} mb-2`}>{score}%</p>

        {/* スコアバー */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              score >= 80
                ? "bg-green-500"
                : score >= 60
                ? "bg-blue-500"
                : score >= 40
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${score}%` }}
          ></div>
        </div>
      </div>

      {reasons.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-700 mb-2">相性の理由</p>
          <ul className="space-y-1">
            {reasons.map((reason, index) => (
              <li key={index} className="text-xs text-gray-600">
                • {reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
