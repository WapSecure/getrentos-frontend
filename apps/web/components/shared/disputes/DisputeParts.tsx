'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { formatDualTime } from '@sureground/shared';
import { ArrowLeft, Clock, type SgIcon } from '@sureground/icons';
import { CardSkeleton, Skeleton } from '@sureground/ui';
import { formatDate } from '@/lib/format';
import type { LandDispute } from '@/types/landDispute';
import type { SaleDispute } from '@/types/transactionWorkspace';

// The pieces a dispute page is built from, shared by the land case page and the deposit dispute thread.

export const SALE_DISPUTE_STATUS: Record<SaleDispute['status'], string> = {
  OPEN: 'Open',
  UNDER_REVIEW: 'Under review',
  ESCALATED: 'Escalated',
  RESOLVED: 'Decided',
};

export const LAND_DISPUTE_STATUS: Record<LandDispute['status'], string> = {
  OPEN: 'Open',
  UNDER_INVESTIGATION: 'Under investigation',
  RESOLVED: 'Decided',
  APPEALED: 'Appealed',
  CLOSED: 'Closed',
};

/**
 * "Sureground replies by 11 Nov 2026, 23:59 Lagos · 22:59 London". The deadline is the one staff
 * work to; the only turn the dispute records is Sureground's.
 */
export const respondByText = (respondBy: string, viewerTimeZone?: string | null) =>
  `Sureground replies by ${formatDate(respondBy)}, ${formatDualTime(respondBy, viewerTimeZone)}`;

export const DisputeRespondBy = ({
  respondBy,
  viewerTimeZone,
}: {
  respondBy?: string | null;
  viewerTimeZone?: string | null;
}) =>
  respondBy ? (
    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Clock className="h-4 w-4 shrink-0" aria-hidden />
      {respondByText(respondBy, viewerTimeZone)}
    </p>
  ) : null;

export const DisputeSection = ({
  title,
  icon: Icon,
  description,
  children,
}: {
  title: string;
  icon?: SgIcon;
  description?: ReactNode;
  children: ReactNode;
}) => (
  <section className="rounded-2xl border border-border bg-card p-5">
    <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
      {Icon && <Icon className="h-4 w-4" aria-hidden />}
      {title}
    </h2>
    {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
    {children}
  </section>
);

export const DisputeLoading = () => (
  <>
    <div className="space-y-2.5">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-80 max-w-[90%]" />
    </div>
    <CardSkeleton lines={3} />
  </>
);

export const DisputeMissing = ({
  error,
  backHref,
  backLabel,
}: {
  error: unknown;
  backHref: string;
  backLabel: string;
}) => (
  <>
    <Link
      href={backHref}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden /> {backLabel}
    </Link>
    <p className="text-sm text-destructive">
      {error instanceof Error ? error.message : 'Dispute not found.'}
    </p>
  </>
);
