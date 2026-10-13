'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge, Card } from '@getrentos/ui';
import { ShieldAlert } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import { landDeveloperKeys } from '@/lib/landDeveloperQueryKeys';
import { landDeveloperService } from '@/services/landDeveloperService';
import {
  LAND_ASSURANCE_TIER_LABELS,
  LAND_DILIGENCE_LABELS,
  LAND_TITLE_TYPE_LABELS,
} from '@/types/land';
import { errorMessage } from './feedback';

const BAND = {
  LOW: { label: 'Low risk', variant: 'success', bar: 'bg-success' },
  MODERATE: { label: 'Moderate risk', variant: 'warning', bar: 'bg-warning' },
  HIGH: { label: 'High risk', variant: 'danger', bar: 'bg-destructive' },
} as const;

/** The parcel's 0-100 risk score, what drives it, and the assurance tier it has earned. */
export const RiskBreakdownCard = ({
  propertyId,
  compact = false,
}: {
  propertyId: string;
  /** A one-line summary for the portfolio view. */
  compact?: boolean;
}) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: landDeveloperKeys.risk(propertyId),
    queryFn: () => unwrap(landDeveloperService.getRisk(propertyId)),
  });

  if (isLoading)
    return <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
  if (isError || !data) {
    return (
      <Card static className="p-5 text-sm text-muted-foreground">
        {errorMessage(error, 'The risk assessment could not be loaded.')}
      </Card>
    );
  }

  const band = BAND[data.band] ?? BAND.MODERATE;
  const factors = [...data.factors].sort((a, b) => b.points - a.points);
  const { inputs } = data;

  return (
    <Card static className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground">
            <ShieldAlert className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-foreground">Risk assessment</h2>
            <p className="text-sm text-muted-foreground">
              {data.assuranceTier
                ? `Assurance: ${LAND_ASSURANCE_TIER_LABELS[data.assuranceTier]}`
                : 'No assurance tier until diligence is verified and in date.'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-foreground">
            {data.score}
            <span className="text-sm font-normal text-muted-foreground">/100</span>
          </p>
          <Badge variant={band.variant}>{band.label}</Badge>
        </div>
      </div>
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-secondary"
        role="meter"
        aria-label="Risk score"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={data.score}
      >
        <div className={`h-full ${band.bar}`} style={{ width: `${data.score}%` }} />
      </div>

      {!compact && (
        <>
          <h3 className="mt-5 text-sm font-medium text-foreground">What drives the score</h3>
          {factors.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No risk factors found.</p>
          ) : (
            <ul className="mt-2 divide-y divide-border/60 rounded-xl border border-border">
              {factors.map((factor) => (
                <li
                  key={factor.factor}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                >
                  <span className="text-foreground">{factor.factor}</span>
                  <span
                    className={`whitespace-nowrap font-medium ${factor.points > 0 ? 'text-destructive' : 'text-success'}`}
                  >
                    {factor.points > 0 ? '+' : ''}
                    {factor.points}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Diligence</dt>
              <dd className="text-foreground">
                {LAND_DILIGENCE_LABELS[inputs.diligenceStatus] ?? inputs.diligenceStatus}
                {inputs.expiresAt ? `, until ${formatDate(inputs.expiresAt)}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Title</dt>
              <dd className="text-foreground">
                {inputs.titleType ? LAND_TITLE_TYPE_LABELS[inputs.titleType] : 'Not recorded'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Checks</dt>
              <dd className="text-foreground">
                {inputs.checks.passed} passed, {inputs.checks.flagged} flagged,{' '}
                {inputs.checks.pending} pending
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Surveyed boundary</dt>
              <dd className="text-foreground">{inputs.hasBoundary ? 'Recorded' : 'Missing'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Conflicts / encumbrances</dt>
              <dd className="text-foreground">
                {inputs.openConflicts} open / {inputs.activeEncumbrances} active
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">External reviews</dt>
              <dd className="text-foreground">{inputs.completedExternalReviews} completed</dd>
            </div>
          </dl>
        </>
      )}
    </Card>
  );
};
