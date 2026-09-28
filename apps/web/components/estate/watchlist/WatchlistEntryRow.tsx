'use client';

import { ImageIcon, ShieldAlert, ShieldCheck, Undo2 } from 'lucide-react';
import { Button } from '@getrentos/ui';
import type { WatchlistEntry } from '@/types/estate';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(value)
  );

interface WatchlistEntryRowProps {
  entry: WatchlistEntry;
  onLift: () => void;
}

/**
 * One entry on the estate's watch list.
 *
 * Shows the contacts as they were recorded rather than claiming which of them
 * the matching runs on. Working that out here would mean reimplementing the
 * server's normalisation in the browser, and the two would drift — the list
 * would start claiming to cover somebody it no longer fires for. The API refuses
 * an entry with nothing matchable at creation, so every row here does fire.
 */
export const WatchlistEntryRow = ({ entry, onLift }: WatchlistEntryRowProps) => {
  const isLifted = entry.status === 'LIFTED';
  // Compared, not normalised: an entry that has passed its date is no longer
  // enforced, and saying "do not admit" about a rule that has stopped applying
  // is worse than saying nothing.
  const isExpired = !isLifted && !!entry.expiresAt && new Date(entry.expiresAt) <= new Date();
  const isBlock = entry.severity === 'BLOCK';
  const inForce = !isLifted && !isExpired;

  const contacts = [
    entry.phone ? `Phone ${entry.phone}` : null,
    entry.plateNumber ? `Plate ${entry.plateNumber}` : null,
  ].filter(Boolean);

  return (
    <div className="p-4 flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground truncate">{entry.label}</p>
          {isBlock ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              <ShieldAlert className="w-3 h-3" />
              Do not admit
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <ShieldCheck className="w-3 h-3" />
              Watch only
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {entry.subjectType === 'VEHICLE' ? 'Vehicle' : 'Person'}
          </span>
        </div>

        <p className="text-xs text-muted-foreground mt-1">{entry.reason}</p>

        <p className="text-xs text-muted-foreground mt-1">
          {contacts.length > 0
            ? contacts.join(' · ')
            : entry.subjectType === 'VEHICLE'
              ? 'Matched on plate'
              : 'Matched on name'}
        </p>

        <p className="text-xs text-muted-foreground mt-1">
          Added {formatDate(entry.createdAt)}
          {inForce && entry.expiresAt ? ` · lapses ${formatDate(entry.expiresAt)}` : ''}
        </p>

        {isLifted && (
          <p className="text-xs text-muted-foreground mt-1">
            Lifted {entry.liftedAt ? formatDate(entry.liftedAt) : ''}
            {entry.liftReason ? ` — ${entry.liftReason}` : ''}. Not enforced.
          </p>
        )}

        {isExpired && (
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
            Lapsed on {formatDate(entry.expiresAt!)}. Not enforced — extend it or add it again if
            the estate still needs it.
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {entry.photoUrl && (
          <a
            href={entry.photoUrl}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
            title="Photo on file"
          >
            <ImageIcon className="w-4 h-4" />
          </a>
        )}
        {inForce ? (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onLift}>
            <Undo2 className="w-3.5 h-3.5" />
            Lift
          </Button>
        ) : null}
      </div>
    </div>
  );
};
