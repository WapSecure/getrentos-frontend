'use client';

import { useQuery } from '@tanstack/react-query';
import { Sparkles, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { Card } from '@getrentos/ui';
import { trustService } from '@/services/trustService';
import { unwrap } from '@/lib/apiHelpers';

/**
 * Plain-language narrative of the caller's own trust score (GET /trust-score/
 * explanation). Role-agnostic and self-only, so every role reuses it. It fetches
 * on its own and hides itself on error, never blocking the page it sits on.
 */
export const TrustExplanationCard = () => {
  const query = useQuery({
    queryKey: ['trust', 'explanation'] as const,
    queryFn: () => unwrap(trustService.getExplanation()),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (query.isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-2" aria-hidden="true">
          <div className="h-4 w-40 rounded bg-secondary" />
          <div className="h-3 w-full rounded bg-secondary" />
          <div className="h-3 w-5/6 rounded bg-secondary" />
        </div>
      </Card>
    );
  }

  const data = query.data;
  if (query.isError || !data) return null;

  return (
    <Card>
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">What your score means</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          A plain-language read of your {data.total}/100 trust score
        </p>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-sm text-foreground whitespace-pre-line">{data.summary}</p>

        {data.strengths.length > 0 && (
          <section className="space-y-1.5">
            <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              What&apos;s working
            </h4>
            <ul className="space-y-1.5">
              {data.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle2
                    aria-hidden="true"
                    className="w-4 h-4 mt-0.5 shrink-0 text-success"
                  />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.improvements.length > 0 && (
          <section className="space-y-1.5">
            <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Next steps
            </h4>
            <ul className="space-y-1.5">
              {data.improvements.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <ArrowUpRight
                    aria-hidden="true"
                    className="w-4 h-4 mt-0.5 shrink-0 text-primary"
                  />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-xs text-muted-foreground">
          {data.source === 'ai' ? 'Explained by AI.' : 'Explained from your verification record.'}
        </p>
      </div>
    </Card>
  );
};
