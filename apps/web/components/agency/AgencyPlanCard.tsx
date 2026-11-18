'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@sureground/ui';
import { PLAN_TIER_LABELS } from '@sureground/shared';
import { formatDate } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { ROUTES } from '@/lib/constants/auth';
import { subscriptionService } from '@/services/subscriptionService';

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

/** Renders nothing on an API without the plan endpoint, so older backends keep the page as it was. */
export function AgencyPlanCard() {
  const plan = useQuery({
    queryKey: ['agency', 'plan'],
    queryFn: () => unwrap(subscriptionService.getAgencyPlan()),
    retry: false,
  });
  const p = plan.data;
  if (!p) return null;

  const nearSeats = p.seatsUsed >= p.seats;
  const nearUnits = p.unitsUsed >= p.units * 0.8;

  return (
    <Card className="mb-6 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          {p.enforced ? `${PLAN_TIER_LABELS[p.tier]} plan` : 'Your plan'}
        </h2>
        <Link
          href={`${ROUTES.PRICING}#enterprise`}
          className="text-sm text-primary hover:underline"
        >
          {p.tier === 'ENTERPRISE' ? 'Change your plan' : 'See Enterprise'}
        </Link>
      </div>
      {p.enforced ? (
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Team seats</dt>
            <dd
              className={`text-sm tabular-nums ${nearSeats ? 'text-warning' : 'text-foreground'}`}
            >
              {p.seatsUsed} of {p.seats} used, counting open invitations
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Managed units</dt>
            <dd
              className={`text-sm tabular-nums ${nearUnits ? 'text-warning' : 'text-foreground'}`}
            >
              {p.unitsUsed} of {p.units} used
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          Your firm has every Enterprise feature while agency plans are introduced
          {p.enforcedFrom ? `. Plans apply from ${formatDate(p.enforcedFrom)}` : ''}. You use{' '}
          {plural(p.seatsUsed, 'seat')} and {plural(p.unitsUsed, 'managed unit')} today.
        </p>
      )}
    </Card>
  );
}
