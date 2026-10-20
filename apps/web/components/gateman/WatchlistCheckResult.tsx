'use client';

import { Eye } from 'lucide-react';
import type { WatchlistScreening } from '@/types/estate';
import { describeWatchlistBasis } from '@/components/gateman/WatchlistBlockedNotice';
import { Alert } from '@getrentos/ui';

/**
 * The result of asking the estate's watch list about somebody, before anything
 * has been attempted.
 *
 * A guard who screens first finds out before they have told a visitor they are
 * asking the household: and without a household being asked to consent to
 * somebody the estate has already decided against. That is the whole value of a
 * check they can run early, so it has to be usable before the form is finished.
 *
 * Renders nothing for a blocking result. A refusal is not an advisory, and
 * showing "they may still be admitted" next to a name the estate has refused
 * would be the one genuinely dangerous thing this panel could do. The caller
 * routes a blocking result to `WatchlistBlockedNotice`, which owns it.
 */
export const WatchlistCheckResult = ({ screening }: { screening: WatchlistScreening }) => {
  if (screening.blocked) return null;

  if (!screening.flagged) {
    return (
      <Alert variant="neutral" icon={Eye}>
        <div>
          <p>Nobody on this estate&apos;s watch list matches that.</p>
          {/* Comparing exactly is what makes the list safe to act on, and the
              same property is why a clearance is not a guarantee: a name spelt
              differently would not match. Saying so stops a guard treating this
              as a promise. */}
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
        {/* The API's wording, which already says they may come in and that the
              estate office wants to hear about it. */}
        <p className="text-sm text-muted-foreground">
          {screening.matches.map((match) => match.message).join(' ')}
        </p>
      </div>
    </Alert>
  );
};
