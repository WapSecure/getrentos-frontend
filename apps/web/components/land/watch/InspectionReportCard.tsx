'use client';

import type { ReactNode } from 'react';
import { Badge } from '@sureground/ui';
import {
  boundaryTone,
  describeDistance,
  LAND_BOUNDARY_LABELS,
  LAND_INSPECTION_KIND_LABELS,
  LAND_INSPECTION_STATUS_LABELS,
  type LandWatchInspection,
} from '@sureground/shared';
import { formatDate, formatDualTime, formatLagosDate } from '@/lib/format';

interface InspectionReportCardProps {
  inspection: LandWatchInspection;
  actions?: ReactNode;
  className?: string;
  /**
   * Inside a card that already names the inspection, its inspector and status: drops the border
   * and the header, leaving the report itself.
   */
  embedded?: boolean;
}

// The report shows only once Sureground has accepted it.
export const InspectionReportCard = ({
  inspection: i,
  actions,
  className,
  embedded = false,
}: InspectionReportCardProps) => {
  const r = i.report;
  const report = r && (
    <>
      {r.beaconsExpected != null && (
        <p className="mt-2 text-sm text-foreground">
          Beacons found: {r.beaconsFound ?? '—'} of {r.beaconsExpected}
        </p>
      )}
      {r.summary && <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{r.summary}</p>}
      {r.staffNote && (
        <p className="mt-1 text-xs text-muted-foreground">Sureground: {r.staffNote}</p>
      )}
      {r.evidence.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {r.evidence.map((e) => (
            <li key={e.id}>
              <a
                href={e.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {e.mimeType.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={e.url}
                    alt={e.note ?? e.fileName}
                    loading="lazy"
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex aspect-square items-center justify-center rounded-lg bg-secondary p-2 text-center text-xs">
                    {e.fileName}
                  </span>
                )}
              </a>
              <p className="mt-1 text-2xs leading-4 text-muted-foreground">
                {formatLagosDate(e.capturedAt)} · {formatDualTime(e.capturedAt)}
                <br />
                {describeDistance(e.distanceM)}
                {e.capturedOffline && ' · captured offline'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  if (embedded) {
    return (
      <div className={className}>
        {report}
        {actions}
      </div>
    );
  }

  return (
    <article className={`rounded-xl border border-border p-4 ${className ?? ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">
            {LAND_INSPECTION_KIND_LABELS[i.kind]} · <span className="font-mono">{i.reference}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {i.inspector ? `${i.inspector.name} · ` : ''}
            {r?.submittedAt
              ? `visited ${formatDate(r.submittedAt)}`
              : `requested ${formatDate(i.createdAt)}`}
          </p>
        </div>
        {r?.boundaryCondition ? (
          <Badge variant={boundaryTone(r.boundaryCondition)}>
            {LAND_BOUNDARY_LABELS[r.boundaryCondition]}
          </Badge>
        ) : (
          <Badge variant="neutral">{LAND_INSPECTION_STATUS_LABELS[i.status]}</Badge>
        )}
      </div>
      {report}
      {actions}
    </article>
  );
};
