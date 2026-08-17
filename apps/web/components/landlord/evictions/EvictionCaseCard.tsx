'use client';

import { Badge } from '@getrentos/ui';
import { formatDate } from '@getrentos/shared';
import { evictionStatusBadges } from '@/lib/statusBadge';
import type { EvictionCase } from '@/types/landlord';

interface EvictionCaseCardProps {
  evictionCase: EvictionCase;
  onClick: () => void;
}

export const EvictionCaseCard = ({ evictionCase, onClick }: EvictionCaseCardProps) => {
  const badge = evictionStatusBadges[evictionCase.status];

  return (
    <button
      onClick={onClick}
      className="w-full p-4 flex items-center justify-between gap-4 text-left hover:bg-secondary/60 transition-colors"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {evictionCase.tenantName} · {evictionCase.propertyName} ({evictionCase.unitName})
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{evictionCase.reason}</p>
        {evictionCase.status === 'issued' && evictionCase.cureDeadline && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
            Cure deadline {formatDate(evictionCase.cureDeadline)}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-gray-400">{formatDate(evictionCase.createdAt)}</span>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>
    </button>
  );
};
