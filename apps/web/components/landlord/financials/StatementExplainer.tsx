'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Bell, Clock, MessageCircleQuestion, Sparkles } from 'lucide-react';
import { Card, Skeleton } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { landlordService } from '@/services/landlordService';

const TONE = {
  urgent: { icon: AlertCircle, cls: 'text-destructive' },
  soon: { icon: Clock, cls: 'text-warning' },
  info: { icon: Bell, cls: 'text-muted-foreground' },
} as const;

/**
 * "This statement in plain words": what came in, where it went, what changed
 * since the last statement, and what is worth asking. The figures on the
 * statement remain the record.
 */
export function StatementExplainer({ statementId }: { statementId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: landlordKeys.statementExplanation(statementId),
    queryFn: () => unwrap(landlordService.explainStatement(statementId)),
    staleTime: 10 * 60_000,
    retry: false,
  });

  if (isLoading) {
    return (
      <Card static className="mt-5 space-y-2 p-4">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-12 w-full" />
      </Card>
    );
  }
  if (isError || !data) return null;

  return (
    <Card static className="mt-5 space-y-3 p-4" aria-labelledby="statement-explainer-title">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
        <h3 id="statement-explainer-title" className="text-sm font-semibold text-foreground">
          This statement in plain words
        </h3>
      </div>
      <p className="text-sm text-foreground">{data.headline}</p>

      {data.flags.length > 0 && (
        <ul className="space-y-1.5">
          {data.flags.map((f) => {
            const Icon = TONE[f.severity].icon;
            return (
              <li key={f.code} className="flex items-start gap-2 text-xs">
                <Icon
                  className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${TONE[f.severity].cls}`}
                  aria-hidden="true"
                />
                <span className="text-foreground">
                  <span className="sr-only">{f.severity}: </span>
                  {f.detail}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {data.points.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          {data.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}

      {data.questions.length > 0 && (
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <MessageCircleQuestion className="h-3.5 w-3.5" aria-hidden="true" />
            Worth asking your manager
          </p>
          <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
            {data.questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-2xs text-muted-foreground">{data.disclaimer}</p>
    </Card>
  );
}
