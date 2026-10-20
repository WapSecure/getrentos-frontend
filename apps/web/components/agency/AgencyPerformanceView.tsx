'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';
import { Alert, Field, PageErrorState, PmKpiPack, Select, StatGridSkeleton } from '@getrentos/ui';
import { recentMonthOptions } from '@getrentos/shared';
import { agencyDashboardService } from '@/services/agencyDashboardService';

/**
 * The firm's KPI pack over a run of months: collection, arrears, occupancy,
 * repairs, owner payouts and retention. The same figures GetRentos ops see for
 * the firm, so there is one version of how the firm is doing.
 */
export function AgencyPerformanceView() {
  const months = useMemo(() => recentMonthOptions(), []);
  const [from, setFrom] = useState(months[2].value);
  const [to, setTo] = useState(months[0].value);

  const query = useQuery({
    queryKey: ['agency', 'kpis', from, to],
    queryFn: async () => {
      const res = await agencyDashboardService.kpis(from, to);
      if (!res.success) throw new Error(res.error || 'Could not load the figures.');
      return res.data!;
    },
    enabled: from <= to,
    placeholderData: keepPreviousData,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <TrendingUp className="h-6 w-6 text-primary" aria-hidden />
          Performance
        </h1>
        <p className="mt-1 text-muted-foreground">
          How the firm has done over the months you choose, counting each property only while you
          managed it. Figures marked Today are today&rsquo;s position.{' '}
          <Link href="/agency/overview" className="text-primary hover:underline">
            Back to the overview
          </Link>
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field label="From" className="sm:w-52">
          <Select ariaLabel="From month" value={from} onValueChange={setFrom} options={months} />
        </Field>
        <Field label="To" className="sm:w-52">
          <Select ariaLabel="To month" value={to} onValueChange={setTo} options={months} />
        </Field>
      </div>
      {from > to && (
        <Alert variant="danger">The first month must not be after the last.</Alert>
      )}

      {query.isError && !query.data ? (
        <PageErrorState
          title="Could not load the figures"
          description={(query.error as Error).message}
          onRetry={() => void query.refetch()}
        />
      ) : from > to ? null : query.isLoading || !query.data ? (
        <StatGridSkeleton count={4} className="gap-4 xl:grid-cols-4" />
      ) : (
        <PmKpiPack report={query.data} />
      )}
    </div>
  );
}
