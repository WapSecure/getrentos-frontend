'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Building2, Coins, Gauge, Users, Wallet, Wrench } from 'lucide-react';
import { Card, PageErrorState } from '@getrentos/ui';
import { formatCurrency } from '@/lib/format';
import { agencyDashboardService, type AgencyDashboard } from '@/services/agencyDashboardService';

const rate = (value: number | null) => (value === null ? '—' : `${value}%`);

/**
 * The firm's book at a glance — every property it manages or delivers. Each
 * figure is worked out from the same leases, rent charges and work orders the
 * owner workspace reads, so a number here can always be traced there.
 */
export function AgencyOverviewView() {
  const query = useQuery({
    queryKey: ['agency', 'dashboard'],
    queryFn: async () => {
      const res = await agencyDashboardService.get();
      if (!res.success) throw new Error(res.error || 'Could not load the overview.');
      return res.data!;
    },
  });

  if (query.isError) {
    return (
      <div className="p-6">
        <PageErrorState
          title="Could not load the overview"
          description={(query.error as Error).message}
        />
      </div>
    );
  }
  const d = query.data;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Gauge className="h-6 w-6 text-primary" aria-hidden />
          {d ? d.firmName : 'Firm overview'}
        </h1>
        <p className="mt-1 text-muted-foreground">
          How the firm’s book is doing across every property you manage.{' '}
          <Link href="/agency/performance" className="text-primary hover:underline">
            Performance over time
          </Link>
          {' · '}
          <Link href="/agency/import" className="text-primary hover:underline">
            Import units from a CSV
          </Link>
        </p>
      </div>

      {!d ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Tile icon={Users} label="Clients" value={String(d.clients.active)}>
              {d.clients.pending} pending · {d.clients.endedLast90Days} left in 90 days
            </Tile>
            <Tile icon={Building2} label="Occupancy" value={rate(d.portfolio.occupancyRate)}>
              {d.portfolio.occupiedUnits} of {d.portfolio.units} units occupied across{' '}
              {d.portfolio.properties} {d.portfolio.properties === 1 ? 'property' : 'properties'}
            </Tile>
            <Tile
              icon={Wallet}
              label="Rent collected this month"
              value={rate(d.rentThisMonth.collectionRate)}
            >
              {formatCurrency(d.rentThisMonth.collected)} of {formatCurrency(d.rentThisMonth.due)}{' '}
              due
            </Tile>
            <Tile
              icon={Coins}
              label="Commission this month"
              value={formatCurrency(d.commissionsThisMonth)}
            >
              <Link href="/agency/commissions" className="text-primary hover:underline">
                See commissions
              </Link>
            </Tile>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <h2 className="text-sm font-semibold text-foreground">Arrears</h2>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {formatCurrency(d.arrears.total)}
              </p>
              <p className="text-xs text-muted-foreground">
                {d.arrears.charges} unpaid {d.arrears.charges === 1 ? 'charge' : 'charges'} past due
              </p>
              <Aging aging={d.arrears.aging} total={d.arrears.total} />
            </Card>
            <Card className="p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Wrench className="h-4 w-4 text-muted-foreground" /> Maintenance
              </h2>
              <dl className="mt-3 space-y-2 text-sm">
                <Row label="Open jobs" value={d.maintenance.open} />
                <Row
                  label="Past their SLA"
                  value={d.maintenance.slaBreached}
                  warn={d.maintenance.slaBreached > 0}
                />
                <Row label="Resolved this month" value={d.maintenance.resolvedThisMonth} />
                <Row label="Team members" value={d.team.active} />
              </dl>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4" aria-hidden /> {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{children}</p>
    </Card>
  );
}

function Row({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={warn ? 'font-semibold text-warning' : 'font-medium text-foreground'}>
        {value}
      </dd>
    </div>
  );
}

const BUCKETS: { key: keyof AgencyDashboard['arrears']['aging']; label: string }[] = [
  { key: 'days0to30', label: '0–30 days' },
  { key: 'days31to60', label: '31–60 days' },
  { key: 'days61to90', label: '61–90 days' },
  { key: 'days90plus', label: '90+ days' },
];

function Aging({ aging, total }: { aging: AgencyDashboard['arrears']['aging']; total: number }) {
  return (
    <div className="mt-4 space-y-2">
      {BUCKETS.map((b) => {
        const amount = aging[b.key];
        const share = total > 0 ? Math.round((amount / total) * 100) : 0;
        return (
          <div key={b.key} className="grid grid-cols-[90px_1fr_110px] items-center gap-3 text-xs">
            <span className="text-muted-foreground">{b.label}</span>
            <div className="h-2 overflow-hidden rounded-full bg-secondary" aria-hidden>
              <div className="h-full rounded-full bg-warning" style={{ width: `${share}%` }} />
            </div>
            <span className="text-right text-foreground">{formatCurrency(amount)}</span>
          </div>
        );
      })}
    </div>
  );
}
