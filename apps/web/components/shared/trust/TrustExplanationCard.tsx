'use client';

import { useQuery } from '@tanstack/react-query';
import { Sparkles, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { Card, CardSkeleton } from '@sureground/ui';
import { trustService } from '@/services/trustService';
import { unwrap } from '@/lib/apiHelpers';
import { trustKeys } from '@/lib/queryKeys';

export const TrustExplanationCard = () => {
  const query = useQuery({
    queryKey: trustKeys.explanation,
    queryFn: () => unwrap(trustService.getExplanation()),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (query.isLoading) {
    return <CardSkeleton lines={2} className="p-4" />;
  }

  const data = query.data;
  if (query.isError || !data) return null;

  // The AI path's list fields may not arrive as arrays; never let a malformed payload crash the page.
  const strengths = Array.isArray(data.strengths) ? data.strengths : [];
  const improvements = Array.isArray(data.improvements) ? data.improvements : [];

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

        {strengths.length > 0 && (
          <section className="space-y-1.5">
            <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              What&apos;s working
            </h4>
            <ul className="space-y-1.5">
              {strengths.map((s, i) => (
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

        {improvements.length > 0 && (
          <section className="space-y-1.5">
            <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Next steps
            </h4>
            <ul className="space-y-1.5">
              {improvements.map((s, i) => (
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

        <p className="text-xs text-muted-foreground">Based on your verification record.</p>
      </div>
    </Card>
  );
};
