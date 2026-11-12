'use client';

import { motion } from 'framer-motion';
import { hasTrustScore, trustScoreDisplay } from '@sureground/shared';

interface TrustScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export const TrustScoreRing = ({ score, size = 120, strokeWidth = 8 }: TrustScoreRingProps) => {
  // Only the ring animates. The number is the real score from the first frame: a count-up showed
  // passing values like "2" that read as the person's score.
  const scored = hasTrustScore(score);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - ((scored ? Math.min(score, 100) : 0) / 100) * circumference;

  const getScoreColor = () => {
    if (score >= 80) return 'stroke-success';
    if (score >= 40) return 'stroke-warning';
    return 'stroke-destructive';
  };

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      role="img"
      aria-label={
        scored ? `Trust score ${trustScoreDisplay(score)} out of 100` : 'No trust score yet'
      }
    >
      <svg width={size} height={size} className="transform -rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-border"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={getScoreColor()}
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
        {scored ? (
          <>
            <span className="text-2xl font-bold text-foreground" aria-hidden="true">
              {trustScoreDisplay(score)}
            </span>
            <span className="text-xs text-muted-foreground" aria-hidden="true">
              Trust score
            </span>
          </>
        ) : (
          <span
            className="px-3 text-center text-xs font-medium text-muted-foreground"
            aria-hidden="true"
          >
            No score yet
          </span>
        )}
      </div>
    </div>
  );
};
