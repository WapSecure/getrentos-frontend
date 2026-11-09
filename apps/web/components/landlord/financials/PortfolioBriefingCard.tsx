'use client';

import { useQuery } from '@tanstack/react-query';
import { Sparkles, TrendingUp, ArrowUpRight } from '@sureground/icons';
import { Card, CardSkeleton } from '@sureground/ui';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';

// Fetches on its own and hides on error, so it never blocks the analytics page.
export const PortfolioBriefingCard = () => {
  const query = useQuery({
    queryKey: landlordKeys.portfolioBriefing,
    queryFn: () => unwrap(landlordService.getPortfolioBriefing()),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (query.isLoading) {
    return <CardSkeleton lines={2} className="mb-6" />;
  }

  const data = query.data;
  if (query.isError || !data || !data.hasData) return null;

  // Defensive: the AI path's list fields are not guaranteed to be arrays.
  const insights = Array.isArray(data.insights) ? data.insights : [];
  const actions = Array.isArray(data.actions) ? data.actions : [];

  return (
    <Card className="mb-6">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Portfolio briefing</h3>
        </div>
        <p className="mt-1 text-sm text-foreground">{data.headline}</p>
      </div>

      <div className="grid gap-5 p-5 md:grid-cols-2">
        {insights.length > 0 && (
          <section className="space-y-2">
            <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              What the numbers say
            </h4>
            <ul className="space-y-2">
              {insights.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <TrendingUp aria-hidden="true" className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {actions.length > 0 && (
          <section className="space-y-2">
            <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Recommended next steps
            </h4>
            <ul className="space-y-2">
              {actions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <ArrowUpRight
                    aria-hidden="true"
                    className="w-4 h-4 mt-0.5 shrink-0 text-success"
                  />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="px-5 pb-4">
        <p className="text-xs text-muted-foreground">
          {data.source === 'ai'
            ? 'Generated from your portfolio analytics.'
            : 'Generated from your portfolio analytics.'}
        </p>
      </div>
    </Card>
  );
};
