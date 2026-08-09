'use client';

import { motion } from 'framer-motion';

interface PropertyScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export const PropertyScore = ({ score, size = 'md' }: PropertyScoreProps) => {
  const getScoreColor = () => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = () => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    return 'Below Average';
  };

  const sizes = {
    sm: { ring: 28, stroke: 2, text: 'text-xs', label: 'text-xs' },
    md: { ring: 40, stroke: 3, text: 'text-sm', label: 'text-xs' },
    lg: { ring: 56, stroke: 4, text: 'text-lg', label: 'text-sm' },
  };

  const currentSize = sizes[size];
  const radius = (currentSize.ring - currentSize.stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-2"
    >
      <div className="relative" style={{ width: currentSize.ring, height: currentSize.ring }}>
        <svg width={currentSize.ring} height={currentSize.ring} className="transform -rotate-90">
          <circle
            cx={currentSize.ring / 2}
            cy={currentSize.ring / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={currentSize.stroke}
            className="dark:stroke-gray-700"
          />
          <circle
            cx={currentSize.ring / 2}
            cy={currentSize.ring / 2}
            r={radius}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={currentSize.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold ${currentSize.text} ${getScoreColor()}`}>{score}</span>
        </div>
      </div>
      <div>
        <div className={`font-medium ${currentSize.text} text-foreground`}>{getScoreLabel()}</div>
        <div className={`${currentSize.label} text-gray-500`}>Property Score</div>
      </div>
    </motion.div>
  );
};
