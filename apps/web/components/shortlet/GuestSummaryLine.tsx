import { AlertTriangle, BadgeCheck, CalendarX, Home, ShieldAlert, Star } from 'lucide-react';
import type { GuestSummary } from '@/types/shortlet';

const memberSince = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' });

/**
 * The guest at a glance, for a host deciding on a request: counts across
 * GetRentos only, never other hosts' details.
 */
export function GuestSummaryLine({ summary }: { summary: GuestSummary }) {
  const isNew = summary.completedStays === 0;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {summary.identityVerified ? (
        <span className="flex items-center gap-1 text-success">
          <BadgeCheck className="h-3.5 w-3.5" /> ID verified
        </span>
      ) : (
        <span className="flex items-center gap-1 text-warning">
          <AlertTriangle className="h-3.5 w-3.5" /> ID not verified
        </span>
      )}
      <span>Member since {memberSince(summary.memberSince)}</span>
      <span className="flex items-center gap-1">
        <Home className="h-3.5 w-3.5" />
        {isNew
          ? 'No stays yet'
          : `${summary.completedStays} stay${summary.completedStays === 1 ? '' : 's'} completed`}
      </span>
      {summary.ratingAverage != null && (
        <span className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          {summary.ratingAverage.toFixed(1)} from {summary.ratingCount} host
          {summary.ratingCount === 1 ? '' : 's'}
        </span>
      )}
      {summary.cancellations12m > 0 && (
        <span className="flex items-center gap-1 text-warning">
          <CalendarX className="h-3.5 w-3.5" /> Cancelled {summary.cancellations12m} stay
          {summary.cancellations12m === 1 ? '' : 's'} this year
        </span>
      )}
      {summary.damageClaimsUpheld > 0 && (
        <span className="flex items-center gap-1 text-destructive">
          <ShieldAlert className="h-3.5 w-3.5" /> {summary.damageClaimsUpheld} damage claim
          {summary.damageClaimsUpheld === 1 ? '' : 's'} upheld
        </span>
      )}
    </div>
  );
}
