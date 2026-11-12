'use client';

import { Car, ImageIcon, ShieldAlert, ShieldCheck, Undo2, User } from '@sureground/icons';
import { Badge, Button, IconLink } from '@sureground/ui';
import { EstateRow, RowAvatar } from '@/components/estate/shared/EstateListSection';
import type { WatchlistEntry } from '@/types/estate';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(value)
  );

interface WatchlistEntryRowProps {
  entry: WatchlistEntry;
  onLift: () => void;
}

// Contacts are shown as recorded; re-implementing the server's normalisation here would drift.
export const WatchlistEntryRow = ({ entry, onLift }: WatchlistEntryRowProps) => {
  const isLifted = entry.status === 'LIFTED';
  // An entry past its date is no longer enforced, so it must not say "do not admit".
  const isExpired = !isLifted && !!entry.expiresAt && new Date(entry.expiresAt) <= new Date();
  const isBlock = entry.severity === 'BLOCK';
  const inForce = !isLifted && !isExpired;
  const isVehicle = entry.subjectType === 'VEHICLE';

  const contacts = [
    entry.phone ? `Phone ${entry.phone}` : null,
    entry.plateNumber ? `Plate ${entry.plateNumber}` : null,
  ].filter(Boolean);

  return (
    <EstateRow
      align="start"
      leading={
        <RowAvatar
          icon={isVehicle ? Car : User}
          tone={!inForce ? 'neutral' : isBlock ? 'danger' : 'warning'}
        />
      }
      title={
        <>
          <p className="truncate text-sm font-medium text-foreground">{entry.label}</p>
          {isBlock ? (
            <Badge variant="danger" icon={<ShieldAlert className="h-3 w-3" />}>
              Do not admit
            </Badge>
          ) : (
            <Badge variant="warning" icon={<ShieldCheck className="h-3 w-3" />}>
              Watch only
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">{isVehicle ? 'Vehicle' : 'Person'}</span>
        </>
      }
      meta={
        <>
          <p className="text-foreground/80">{entry.reason}</p>
          <p>
            {contacts.length > 0
              ? contacts.join(' · ')
              : isVehicle
                ? 'Matched on plate'
                : 'Matched on name'}
          </p>
          <p className="tabular-nums">
            Added {formatDate(entry.createdAt)}
            {inForce && entry.expiresAt ? ` · lapses ${formatDate(entry.expiresAt)}` : ''}
          </p>
          {isLifted && (
            <p>
              Lifted {entry.liftedAt ? formatDate(entry.liftedAt) : ''}
              {entry.liftReason ? `: ${entry.liftReason}` : ''}. Not enforced.
            </p>
          )}
          {isExpired && (
            <p className="text-warning">
              Lapsed on {formatDate(entry.expiresAt!)}. Not enforced: extend it or add it again if
              the estate still needs it.
            </p>
          )}
        </>
      }
      actions={
        entry.photoUrl || inForce ? (
          <>
            {entry.photoUrl && (
              <IconLink
                href={entry.photoUrl}
                target="_blank"
                rel="noreferrer"
                label={`Photo on file for ${entry.label}`}
                title="Photo on file"
                icon={<ImageIcon />}
                size="sm"
              />
            )}
            {inForce ? (
              <Button
                variant="outline"
                size="sm"
                icon={<Undo2 className="h-3.5 w-3.5" />}
                onClick={onLift}
              >
                Lift
              </Button>
            ) : null}
          </>
        ) : undefined
      }
    />
  );
};
