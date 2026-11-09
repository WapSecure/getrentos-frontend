'use client';

import { Eye } from '@sureground/icons';
import type { WatchlistScreening } from '@/types/estate';
import { describeWatchlistBasis } from '@/components/gateman/WatchlistBlockedNotice';
import { Alert } from '@sureground/ui';

// Renders nothing for a blocking result: "they may still be admitted" beside a refused name would be dangerous. `WatchlistBlockedNotice` owns refusals.
export const WatchlistCheckResult = ({ screening }: { screening: WatchlistScreening }) => {
  if (screening.blocked) return null;

  if (!screening.flagged) {
    return (
      <Alert variant="neutral" icon={Eye}>
        <div>
          <p>Nobody on this estate&apos;s watch list matches that.</p>
          <p className="text-xs mt-0.5">
            Compared exactly against what the list holds, ignoring case, spacing and word order: so
            a genuinely different spelling would not show up.
          </p>
        </div>
      </Alert>
    );
  }

  return (
    <Alert variant="warning" icon={Eye} title="On the estate’s watch list: not refused">
      <div className="space-y-2">
        {screening.matches.map((match) => (
          <div key={match.entryId} className="space-y-0.5">
            <p className="text-sm text-foreground">
              {match.label}
              <span className="text-xs text-muted-foreground">
                {` · matched on ${describeWatchlistBasis(match.matchedOn)}`}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">Reason: {match.reason}</p>
          </div>
        ))}
        <p className="text-sm text-muted-foreground">
          {screening.matches.map((match) => match.message).join(' ')}
        </p>
      </div>
    </Alert>
  );
};
