import type { ReactNode } from 'react';
import { Building2, HandCoins, ShieldAlert, Users, Wallet, Wrench } from 'lucide-react';
import { cn, formatCurrency } from '@getrentos/shared';
import { Badge } from './Badge';
import { Card } from './Card';
import { StatCard } from './StatCard';

/** `GET /admin/pm-kpis` and `GET /agency/kpis`. Rates are percentages to one decimal, null when unmeasured. */
export interface PmKpiReport {
  scope: { kind: 'MANAGED' | 'FIRM' | 'ALL'; name: string };
  from: string;
  to: string;
  asOf: string;
  payoutTargetDays: number;
  collection: {
    charges: number;
    billed: number;
    collected: number;
    collectionRate: number | null;
    paidOnTime: number;
    onTimeRate: number | null;
  };
  arrears: {
    total: number;
    charges: number;
    tenancies: number;
    buckets: {
      key: 'DAYS_1_30' | 'DAYS_31_60' | 'DAYS_61_90' | 'DAYS_90_PLUS';
      amount: number;
      charges: number;
    }[];
  };
  occupancy: {
    properties: number;
    units: number;
    occupiedUnits: number;
    occupancyRate: number | null;
  };
  maintenance: {
    raised: number;
    medianResponseHours: number | null;
    responseOnTimeRate: number | null;
    responseMeasured: number;
    resolved: number;
    medianResolutionDays: number | null;
    resolutionOnTimeRate: number | null;
    resolutionMeasured: number;
    openPastTarget: number;
  };
  payouts: {
    statements: number;
    paidOnTime: number;
    paidLate: number;
    overdue: number;
    notYetDue: number;
    onTimeRate: number | null;
    averageDaysToPay: number | null;
  };
  retention: {
    startingOwners: number;
    retained: number;
    lost: number;
    lostByOwnerChoice: number;
    retentionRate: number | null;
    gained: number;
  };
  trustGates: {
    mandatesDecided: number;
    mandatesRejected: number;
    rejectionRate: number | null;
    payoutsFailed: number;
    impersonationReports: number;
  };
  managedMargin: {
    revenue: number;
    partnerShare: number;
    directCosts: number;
    margin: number;
    marginPct: number | null;
  } | null;
}

const BUCKET_LABEL: Record<PmKpiReport['arrears']['buckets'][number]['key'], string> = {
  DAYS_1_30: '1–30 days late',
  DAYS_31_60: '31–60 days',
  DAYS_61_90: '61–90 days',
  DAYS_90_PLUS: 'Over 90 days',
};

const rate = (value: number | null) => (value === null ? '—' : `${value}%`);
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const hours = (h: number | null) =>
  h === null
    ? '—'
    : h < 1
      ? 'under an hour'
      : h < 48
        ? `${h} h`
        : `${Math.round((h / 24) * 10) / 10} days`;
const days = (d: number | null) => (d === null ? '—' : d < 1 ? 'same day' : `${d} days`);

const Section = ({
  title,
  icon: Icon,
  now,
  children,
}: {
  title: string;
  icon: typeof Wallet;
  now?: boolean;
  children: ReactNode;
}) => (
  <Card className="p-5">
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 font-semibold text-foreground">
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        {title}
      </h2>
      {now && <Badge variant="info">Today</Badge>}
    </div>
    {children}
  </Card>
);

const Row = ({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note?: string;
  tone?: 'bad';
}) => (
  <div className="flex items-baseline justify-between gap-4 py-1.5">
    <dt className="text-sm text-muted-foreground">
      {label}
      {note && <span className="block text-xs text-muted-foreground">{note}</span>}
    </dt>
    <dd
      className={cn(
        'text-sm font-medium tabular-nums',
        tone === 'bad' ? 'text-destructive' : 'text-foreground'
      )}
    >
      {value}
    </dd>
  </div>
);

/**
 * The property-management KPI pack: headline tiles, then rent, maintenance,
 * owners and trust gates. Presentational only; the page fetches the report and
 * owns the scope and month pickers. Today's figures (arrears, occupancy, open
 * breaches) are badged so they are not read as belonging to the months chosen.
 */
export const PmKpiPack = ({
  report,
  marginAction,
}: {
  report: PmKpiReport;
  marginAction?: ReactNode;
}) => {
  const {
    collection,
    arrears,
    occupancy,
    maintenance,
    payouts,
    retention,
    trustGates,
    managedMargin,
  } = report;
  const worstBucket = Math.max(1, ...arrears.buckets.map((b) => b.amount));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Collection rate"
          value={rate(collection.collectionRate)}
          subtitle={
            collection.charges
              ? `${formatCurrency(collection.collected)} of ${formatCurrency(collection.billed)} billed`
              : 'Nothing fell due in these months'
          }
          accent="primary"
        />
        <StatCard
          icon={Building2}
          label="Occupancy today"
          value={rate(occupancy.occupancyRate)}
          subtitle={`${occupancy.occupiedUnits} of ${plural(occupancy.units, 'unit')} occupied`}
        />
        <StatCard
          icon={HandCoins}
          label="Owner payouts on time"
          value={rate(payouts.onTimeRate)}
          subtitle={`Within ${report.payoutTargetDays} days of the period ending`}
        />
        <StatCard
          icon={Users}
          label="Owner retention"
          value={rate(retention.retentionRate)}
          subtitle={
            retention.startingOwners
              ? `${retention.retained} of ${plural(retention.startingOwners, 'owner')} kept`
              : 'No owners at the start of the range'
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Rent collection" icon={Wallet}>
          <dl className="divide-y divide-border">
            <Row
              label="Billed"
              value={formatCurrency(collection.billed)}
              note={plural(collection.charges, 'charge')}
            />
            <Row
              label="Collected"
              value={formatCurrency(collection.collected)}
              note="Part-payments included"
            />
            <Row
              label="Paid in full by the due date"
              value={rate(collection.onTimeRate)}
              note={`${collection.paidOnTime} of ${collection.charges}`}
            />
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            Rent, service charge and levies that fell due while the property was under this
            management. Deposits and late fees are left out.
          </p>
        </Section>

        <Section title="Arrears" icon={ShieldAlert} now>
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            {formatCurrency(arrears.total)}
          </p>
          <p className="text-xs text-muted-foreground">
            Owed on {plural(arrears.charges, 'charge')} across{' '}
            {plural(arrears.tenancies, 'tenancy', 'tenancies')}
          </p>
          <ul className="mt-4 space-y-2.5">
            {arrears.buckets.map((b) => (
              <li key={b.key}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-muted-foreground">{BUCKET_LABEL[b.key]}</span>
                  <span className="tabular-nums text-foreground">
                    {formatCurrency(b.amount)}
                    {b.charges > 0 && (
                      <span className="ml-1 text-xs text-muted-foreground">({b.charges})</span>
                    )}
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-secondary" aria-hidden="true">
                  {b.amount > 0 && (
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${Math.max(2, (b.amount / worstBucket) * 100)}%` }}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Maintenance" icon={Wrench}>
          <dl className="divide-y divide-border">
            <Row label="Requests raised" value={String(maintenance.raised)} />
            <Row
              label="Typical time to respond"
              value={hours(maintenance.medianResponseHours)}
              note="Median"
            />
            <Row
              label="Responded within target"
              value={rate(maintenance.responseOnTimeRate)}
              note={`${plural(maintenance.responseMeasured, 'request')} measured`}
            />
            <Row
              label="Typical time to fix"
              value={days(maintenance.medianResolutionDays)}
              note="Median"
            />
            <Row
              label="Fixed within target"
              value={rate(maintenance.resolutionOnTimeRate)}
              note={`${plural(maintenance.resolutionMeasured, 'request')} measured`}
            />
            <Row
              label="Open and past target today"
              value={String(maintenance.openPastTarget)}
              tone={maintenance.openPastTarget > 0 ? 'bad' : undefined}
            />
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            Requests still inside their target are not counted either way.
          </p>
        </Section>

        <Section title="Owners" icon={Users}>
          <dl className="divide-y divide-border">
            <Row label="Statements due a payout" value={String(payouts.statements)} />
            <Row label="Paid on time" value={String(payouts.paidOnTime)} />
            <Row
              label="Paid late"
              value={String(payouts.paidLate)}
              tone={payouts.paidLate ? 'bad' : undefined}
            />
            <Row
              label="Unpaid past the target"
              value={String(payouts.overdue)}
              tone={payouts.overdue ? 'bad' : undefined}
            />
            {payouts.notYetDue > 0 && <Row label="Not yet due" value={String(payouts.notYetDue)} />}
            <Row label="Average days to pay" value={days(payouts.averageDaysToPay)} />
            <Row
              label="Owners kept"
              value={`${retention.retained} of ${retention.startingOwners}`}
            />
            <Row
              label="Owners lost"
              value={String(retention.lost)}
              note={
                retention.lost ? `${retention.lostByOwnerChoice} by the owner's choice` : undefined
              }
              tone={retention.lost ? 'bad' : undefined}
            />
            <Row label="New owners" value={String(retention.gained)} />
          </dl>
        </Section>

        <Section title="Trust gates" icon={ShieldAlert}>
          <dl className="divide-y divide-border">
            <Row
              label="Engagements turned down at verification"
              value={rate(trustGates.rejectionRate)}
              note={`${trustGates.mandatesRejected} of ${trustGates.mandatesDecided} decided`}
            />
            <Row
              label="Owner payouts failed or refused"
              value={String(trustGates.payoutsFailed)}
              tone={trustGates.payoutsFailed ? 'bad' : undefined}
            />
            <Row
              label="Impersonation reports from tenants"
              value={String(trustGates.impersonationReports)}
              tone={trustGates.impersonationReports ? 'bad' : undefined}
            />
          </dl>
        </Section>

        {managedMargin && (
          <Section title="Managed margin" icon={HandCoins}>
            <dl className="divide-y divide-border">
              <Row label="Fee revenue" value={formatCurrency(managedMargin.revenue)} />
              <Row label="Partner share" value={formatCurrency(managedMargin.partnerShare)} />
              <Row label="Direct costs" value={formatCurrency(managedMargin.directCosts)} />
              <Row
                label="Contribution margin"
                value={`${managedMargin.margin < 0 ? '−' : ''}${formatCurrency(Math.abs(managedMargin.margin))}${
                  managedMargin.marginPct === null ? '' : ` (${managedMargin.marginPct}%)`
                }`}
                tone={managedMargin.margin < 0 ? 'bad' : undefined}
              />
            </dl>
            {marginAction && <div className="mt-3">{marginAction}</div>}
          </Section>
        )}
      </div>
    </div>
  );
};
