'use client';

import { useState } from 'react';
import { ShieldAlert } from '@sureground/icons';
import { Button, Field, Input } from '@sureground/ui';
import type { WatchlistMatch, WatchlistMatchedOn } from '@/types/estate';

/** Matches the API's floor. */
export const OVERRIDE_REASON_MIN_LENGTH = 10;

/** Only a label: every sentence in this panel comes from the API, so web and mobile can't drift. */
export const describeWatchlistBasis = (matchedOn: WatchlistMatchedOn) =>
  matchedOn === 'NAME'
    ? 'name only'
    : matchedOn === 'PHONE'
      ? 'phone number'
      : 'vehicle registration';

interface WatchlistBlockedNoticeProps {
  /** What the API said. Rendered verbatim. */
  message: string;
  matches: WatchlistMatch[];
  onOverride: (reason: string) => void;
  onDefer?: () => void;
  isOverriding?: boolean;
  error?: string | null;
}

// Not styled as an error: a guard who reads it as a failure retries and gets the same answer. Overriding takes two steps and a reason, because the reason is what the estate office and the audit record.
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
            Do not admit: this estate&apos;s watch list
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
              <Field
                label="Why are you admitting them?"
                htmlFor="watchlist-override-reason"
                hint={`Recorded against your name and sent to the estate office. At least ${OVERRIDE_REASON_MIN_LENGTH} characters.`}
                error={error ?? undefined}
              >
                <Input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Plate differs by one letter, driver is a different man"
                />
              </Field>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!canOverride}
                  isLoading={isOverriding}
                  loadingText="Admitting…"
                  onClick={() => onOverride(reason.trim())}
                >
                  Admit anyway
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isOverriding}
                  onClick={() => {
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
