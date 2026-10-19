'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Gauge } from 'lucide-react';
import { Button, Field, PageErrorState, PmKpiPack, Select, Skeleton } from '@getrentos/ui';
import { recentMonthOptions, unwrap } from '@getrentos/shared';

import { adminPmKpiService, type PmKpiScopeKind } from '@/services/adminManagedService';

const SCOPE_OPTIONS: { value: PmKpiScopeKind; label: string }[] = [
  { value: 'MANAGED', label: 'GetRentos Managed' },
  { value: 'FIRM', label: 'One firm' },
  { value: 'ALL', label: 'Every managed property' },
];

export default function PmKpisPage() {
  const months = useMemo(() => recentMonthOptions(), []);
  const [from, setFrom] = useState(months[2].value);
  const [to, setTo] = useState(months[0].value);
  const [scope, setScope] = useState<PmKpiScopeKind>('MANAGED');
  const [firmId, setFirmId] = useState('');

  const firms = useQuery({
    queryKey: ['admin', 'pm-kpis', 'firms'],
    queryFn: () => unwrap(adminPmKpiService.firms()),
    enabled: scope === 'FIRM',
  });
  const ready = from <= to && (scope !== 'FIRM' || !!firmId);
  const report = useQuery({
    queryKey: ['admin', 'pm-kpis', from, to, scope, firmId],
    queryFn: () => unwrap(adminPmKpiService.report(from, to, scope, firmId)),
    enabled: ready,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Gauge className="h-6 w-6 text-primary" aria-hidden />
          Management KPIs
        </h1>
        <p className="mt-1 text-muted-foreground">
          How a book of managed properties is doing: rent collected, arrears, occupancy, repairs,
          owner payouts and retention, and where trust checks failed. Figures for the months chosen
          count only while each property was under that management; ones marked Today are
          today&rsquo;s position.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <Field label="Whose book" className="sm:w-60">
          <div className="mt-1">
            <Select
              ariaLabel="Whose book"
              value={scope}
              onValueChange={(v) => setScope(v as PmKpiScopeKind)}
              options={SCOPE_OPTIONS}
              searchable={false}
            />
          </div>
        </Field>
        {scope === 'FIRM' && (
          <Field label="Firm" className="sm:w-64">
            <div className="mt-1">
              <Select
                ariaLabel="Firm"
                value={firmId}
                onValueChange={setFirmId}
                placeholder={firms.isLoading ? 'Loading firms…' : 'Choose a firm'}
                options={(firms.data ?? []).map((f) => ({ value: f.id, label: f.name }))}
              />
            </div>
          </Field>
        )}
        <Field label="From" className="sm:w-52">
          <div className="mt-1">
            <Select ariaLabel="From month" value={from} onValueChange={setFrom} options={months} />
          </div>
        </Field>
        <Field label="To" className="sm:w-52">
          <div className="mt-1">
            <Select ariaLabel="To month" value={to} onValueChange={setTo} options={months} />
          </div>
        </Field>
      </div>
      {from > to && (
        <p className="text-sm text-destructive">The first month must not be after the last.</p>
      )}

      {scope === 'FIRM' && !firmId ? (
        <p className="text-sm text-muted-foreground">Choose a firm to see its book.</p>
      ) : report.isError ? (
        <PageErrorState
          title="Could not load the KPIs"
          description={(report.error as Error).message}
          onRetry={() => void report.refetch()}
        />
      ) : !ready ? null : report.isLoading || !report.data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <PmKpiPack
          report={report.data}
          marginAction={
            <Button href="/admin/managed-pnl" variant="outline" size="sm">
              Open the Managed P&amp;L
            </Button>
          }
        />
      )}
    </div>
  );
}
