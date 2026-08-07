'use client';

import { motion } from 'framer-motion';

interface TrustScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export const TrustScoreRing = ({ score, size = 160, strokeWidth = 12 }: TrustScoreRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const getScoreColor = () => {
    if (score >= 90) return '#10b981';
    if (score >= 70) return '#3b82f6';
    if (score >= 50) return '#eab308';
    return '#ef4444';
  };

  const getScoreLabel = () => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            className="dark:stroke-gray-700"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getScoreColor()}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="text-4xl font-bold text-gray-900 dark:text-white"
          >
            {score}
          </motion.span>
          <span className="text-sm text-gray-500 dark:text-gray-400">Trust Score</span>
          <span
            className={`text-xs font-medium mt-1 ${
              score >= 90
                ? 'text-green-600'
                : score >= 70
                  ? 'text-blue-600'
                  : score >= 50
                    ? 'text-yellow-600'
                    : 'text-red-600'
            }`}
          >
            {getScoreLabel()}
          </span>
        </div>
      </div>
    </div>
  );
};
