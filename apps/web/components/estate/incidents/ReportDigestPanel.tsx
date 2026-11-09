'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Layers, Megaphone } from '@sureground/icons';
import { Badge, Button, Card, Skeleton, type BadgeVariant } from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { estateService } from '@/services/estateService';
import type { ReportGroup } from '@/types/estateOps';

const PRIORITY: Record<string, BadgeVariant> = {
  CRITICAL: 'danger',
  URGENT: 'danger',
  HIGH: 'warning',
  MEDIUM: 'neutral',
  LOW: 'neutral',
};

interface ReportDigestPanelProps {
  estateId: string;
  onDraftUpdate: (notes: string) => void;
}

export function ReportDigestPanel({ estateId, onDraftUpdate }: ReportDigestPanelProps) {
  const [open, setOpen] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: estateKeys.reportDigest(estateId),
    queryFn: () => unwrap(estateService.getReportDigest(estateId)),
    staleTime: 5 * 60_000,
    retry: false,
  });

  if (isLoading) {
    return (
      <Card static className="mb-6 space-y-2 p-5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-14 w-full" />
      </Card>
    );
  }
  if (!data?.groups.length) return null;

  // Only what residents reported goes into the notes, never the suggested step.
  const notesFor = (g: ReportGroup) => `${g.title}. ${g.summary}`;

  return (
    <Card static className="mb-6 space-y-4 p-5" aria-labelledby="report-digest-title">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 id="report-digest-title" className="text-sm font-semibold text-foreground">
          Shared problems
        </h2>
      </div>
      <p className="text-sm text-foreground">{data.overview}</p>

      <ul className="space-y-3">
        {data.groups.map((g) => (
          <li key={g.title} className="space-y-2 rounded-lg border border-border p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-foreground">{g.title}</p>
              <Badge variant={PRIORITY[g.priority] ?? 'neutral'}>{g.priority.toLowerCase()}</Badge>
              <span className="text-xs text-muted-foreground">{g.line}</span>
            </div>
            <p className="text-foreground">{g.summary}</p>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Next step: </span>
              {g.action}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                icon={<Megaphone className="h-4 w-4" aria-hidden />}
                onClick={() => onDraftUpdate(notesFor(g))}
              >
                Draft an update
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-expanded={open === g.title}
                icon={
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${open === g.title ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                }
                onClick={() => setOpen(open === g.title ? null : g.title)}
              >
                {open === g.title ? 'Hide reports' : `Show ${g.reports} reports`}
              </Button>
            </div>
            {open === g.title && (
              <ul className="space-y-1 border-t border-border pt-2 text-xs text-muted-foreground">
                {g.items.map((i) => (
                  <li key={i.id}>
                    {i.unit ? `${i.unit}: ` : ''}
                    {i.description}{' '}
                    <span className="whitespace-nowrap">
                      · {i.ageDays === 0 ? 'today' : `${i.ageDays}d ago`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      {data.ungrouped > 0 && (
        <p className="text-xs text-muted-foreground">
          {data.ungrouped} other open report{data.ungrouped === 1 ? '' : 's'} stand alone; they are
          listed below.
        </p>
      )}
      <p className="text-2xs text-muted-foreground">{data.disclaimer}</p>
    </Card>
  );
}
