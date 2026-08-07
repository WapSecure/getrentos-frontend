'use client';

import { Award, Shield, Star, Zap, ShieldCheck, Handshake } from 'lucide-react';
import type { Badge } from '@/types/trust-score';

const iconMap: Record<string, React.ElementType> = {
  Shield,
  Star,
  Zap,
  ShieldCheck,
  Handshake,
  Award,
};

interface TrustBadgesProps {
  badges: Badge[];
}

export const TrustBadges = ({ badges }: TrustBadgesProps) => {
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-[#c4a747]" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Trust Badges</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {earnedCount} of {badges.length} badges earned
        </p>
      </div>

      <div className="p-4 grid grid-cols-2 gap-3">
        {badges.map((badge) => {
          const Icon = iconMap[badge.icon] || Shield;
          return (
            <div
              key={badge.id}
              className={`p-3 rounded-lg text-center transition-all ${
                badge.earned
                  ? 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border border-amber-200 dark:border-amber-800'
                  : 'bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 opacity-50'
              }`}
            >
              <div
                className={`flex justify-center mb-2 ${badge.earned ? 'text-amber-600' : 'text-gray-400'}`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <p
                className={`text-xs font-medium ${badge.earned ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
              >
                {badge.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{badge.description}</p>
              {badge.earned && (
                <span className="inline-block mt-1 text-xs text-amber-600">✓ Earned</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
