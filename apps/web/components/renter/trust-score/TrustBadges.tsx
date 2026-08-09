'use client';

import { Award, Shield, Star, CheckCircle, Crown, Sparkles, Lock, Users } from 'lucide-react';
import { Badge } from '@/types/trust-score';

const iconMap: Record<string, React.ElementType> = {
  Shield: Shield,
  CheckCircle: CheckCircle,
  Star: Star,
  Lock: Lock,
  Crown: Crown,
  Users: Users,
  Award: Award,
  Sparkles: Sparkles,
};

interface TrustBadgesProps {
  badges: Badge[];
}

export const TrustBadges = ({ badges }: TrustBadgesProps) => {
  const earnedCount = badges.filter((b) => b.earned).length;
  const totalCount = badges.length;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Trust Badges</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {earnedCount} of {totalCount} badges earned
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
                  ? 'bg-linear-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border border-amber-200 dark:border-amber-800'
                  : 'bg-gray-50 dark:bg-white/5 border border-border opacity-50'
              }`}
            >
              <div
                className={`flex justify-center mb-2 ${
                  badge.earned ? 'text-amber-600' : 'text-gray-400'
                }`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <p
                className={`text-xs font-medium ${
                  badge.earned ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {badge.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{badge.description}</p>
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
