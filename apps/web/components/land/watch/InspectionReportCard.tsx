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
import { formatDate } from '@/lib/format';

interface InspectionReportCardProps {
  inspection: LandWatchInspection;
  actions?: ReactNode;
  className?: string;
}

// The report shows only once Sureground has accepted it.
export const InspectionReportCard = ({
  inspection: i,
  actions,
  className,
}: InspectionReportCardProps) => {
  const r = i.report;
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
      {r && (
        <>
          {r.beaconsExpected != null && (
            <p className="mt-2 text-sm text-foreground">
              Beacons found: {r.beaconsFound ?? '—'} of {r.beaconsExpected}
            </p>
          )}
          <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{r.summary}</p>
          {r.staffNote && (
            <p className="mt-1 text-xs text-muted-foreground">Sureground: {r.staffNote}</p>
          )}
          {r.evidence.length > 0 && (
            <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {r.evidence.map((e) => (
                <li key={e.id}>
                  <a href={e.url} target="_blank" rel="noopener noreferrer" className="block">
                    {e.mimeType.startsWith('image/') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={e.url}
                        alt={e.note ?? e.fileName}
                        className="aspect-square w-full rounded-lg object-cover"
                      />
                    ) : (
                      <span className="flex aspect-square items-center justify-center rounded-lg bg-secondary p-2 text-center text-xs">
                        {e.fileName}
                      </span>
                    )}
                  </a>
                  <p className="mt-1 text-2xs leading-tight text-muted-foreground">
                    {formatDate(e.capturedAt)}
                    {e.distanceM != null && ` · ${describeDistance(e.distanceM)}`}
                    {e.capturedOffline && ' · captured offline'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {actions}
    </article>
  );
};
