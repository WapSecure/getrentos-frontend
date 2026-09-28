'use client';

import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button, LegacyInput } from '@getrentos/ui';
import type { WatchlistMatch, WatchlistMatchedOn } from '@/types/estate';

/** Matches the API's floor. Kept in step so the guard is not told off by the server for something the form allowed. */
export const OVERRIDE_REASON_MIN_LENGTH = 10;

/**
 * How the match was made, in two or three words.
 *
 * A label rather than a sentence: every sentence in this panel comes from the
 * API, so there is exactly one copy of the wording and the two platforms cannot
 * drift into telling guards different things. This is only here because "which
 * detail matched" is the one fact a guard needs at a glance before deciding
 * whether the person in front of them is really the person on the list.
 *
 * Exported so the pre-write check says it the same way.
 */
export const describeWatchlistBasis = (matchedOn: WatchlistMatchedOn) =>
  matchedOn === 'NAME'
    ? 'name only'
    : matchedOn === 'PHONE'
      ? 'phone number'
      : 'vehicle registration';

interface WatchlistBlockedNoticeProps {
  /** What the API said. Rendered verbatim. */
  message: string;
  /** The entries that fired. Empty only when the API withheld them. */
  matches: WatchlistMatch[];
  onOverride: (reason: string) => void;
  /** Abandons the write — the guard turns the visitor away instead. */
  onDefer?: () => void;
  isOverriding?: boolean;
  /** A failure of the override attempt itself, shown without losing the reason typed. */
  error?: string | null;
}

/**
 * Shown when an estate's watch list refuses an entry.
 *
 * Deliberately not shaped like the error box used elsewhere on these screens.
 * This is the estate's instruction being carried out, not a fault: a guard who
 * reads it as a failure will retry, and retrying gives the same answer while
 * somebody waits at the barrier. So it states the instruction, quotes the
 * estate's reason, and says plainly that asking again changes nothing.
 *
 * The override is two deliberate steps rather than one button. Refusing is the
 * default — that is what the estate asked for — and admitting somebody anyway is
 * a decision a guard makes on purpose, with a reason, because that reason is
 * what the estate office is told and what the audit records.
 */
export const WatchlistBlockedNotice = ({
  message,
  matches,
  onOverride,
  onDefer,
  isOverriding,
  error,
}: WatchlistBlockedNoticeProps) => {
  const [isOverridingNow, setIsOverridingNow] = useState(false);
  const [reason, setReason] = useState('');

  const canOverride = reason.trim().length >= OVERRIDE_REASON_MIN_LENGTH;

  return (
    <div className="rounded-xl border-2 border-destructive/40 bg-destructive/5 p-4">
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-destructive" />
        <div className="min-w-0 space-y-3">
          <p className="text-sm font-semibold text-foreground">
            Do not admit — this estate&apos;s watch list
          </p>

          {matches.length > 0 ? (
            <div className="space-y-2">
              {matches.map((match) => (
                <div key={match.entryId} className="space-y-1">
                  <p className="text-sm text-foreground">
                    {match.label}
                    <span className="text-xs text-muted-foreground">
                      {` · matched on ${describeWatchlistBasis(match.matchedOn)}`}
                    </span>
                  </p>
                  {/* The estate's own words, quoted rather than paraphrased: the
                      guard has to say something to a human, and this is the only
                      version anybody actually agreed to. */}
                  <p className="text-xs text-muted-foreground">Reason: {match.reason}</p>
                </div>
              ))}
            </div>
          ) : null}

          {message && <p className="text-sm text-muted-foreground">{message}</p>}

          <p className="text-xs text-muted-foreground">
            This is a standing instruction from the estate, so trying again will give the same
            answer.
          </p>

          {!isOverridingNow ? (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setIsOverridingNow(true)}>
                Admit anyway…
              </Button>
              {onDefer && (
                <Button variant="ghost" size="sm" onClick={onDefer}>
                  Turn them away
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <label
                htmlFor="watchlist-override-reason"
                className="block text-sm font-medium text-foreground"
              >
                Why are you admitting them?
              </label>
              <LegacyInput
                type="text"
                id="watchlist-override-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Plate differs by one letter, driver is a different man"
              />
              {/* Says what the reason is for. Without this a guard types "ok",
                  the form refuses it, and a control that exists to prevent a
                  wrong refusal ends up looking broken. */}
              <p className="text-xs text-muted-foreground">
                Recorded against your name and sent to the estate office. At least{' '}
                {OVERRIDE_REASON_MIN_LENGTH} characters.
              </p>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!canOverride || isOverriding}
                  onClick={() => onOverride(reason.trim())}
                >
                  {isOverriding ? 'Admitting…' : 'Admit anyway'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isOverriding}
                  onClick={() => {
                    // The reason survives "never mind", so a guard who
                    // reconsiders twice does not retype it.
                    setIsOverridingNow(false);
                  }}
                >
                  Never mind
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
