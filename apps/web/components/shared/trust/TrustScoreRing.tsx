'use client';

import { motion } from 'framer-motion';
import { trustBand } from '@/lib/trustScore';

interface TrustScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export const TrustScoreRing = ({ score, size = 160, strokeWidth = 12 }: TrustScoreRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  // Label + colours follow the same trust STAGE ladder as the stage banner and
  // the rest of the app, so a score never reads "Established" in one place and
  // "Fair" in another.
  const bandLabel = trustBand(score).label;

  const getScoreColor = () => {
    if (score >= 85) return '#10b981'; // Highly trusted
    if (score >= 50) return '#3b82f6'; // Trusted / Established
    if (score >= 25) return '#eab308'; // Building
    return '#9ca3af'; // New
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
            className="text-4xl font-bold text-foreground"
          >
            {score}
          </motion.span>
          <span className="text-sm text-muted-foreground">Trust Score</span>
          <span
            className={`text-xs font-medium mt-1 ${
              score >= 85
                ? 'text-success'
                : score >= 50
                  ? 'text-info'
                  : score >= 25
                    ? 'text-warning'
                    : 'text-muted-foreground'
            }`}
          >
            {bandLabel}
          </span>
        </div>
      </div>
    </div>
  );
};
