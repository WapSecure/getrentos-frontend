'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  Activity,
  Ban,
  Coins,
  Cpu,
  Power,
  Scissors,
  ShieldAlert,
  ShieldCheck,
  Undo2,
  UserCheck,
} from 'lucide-react';
import {
  DataTable,
  EmptyState,
  PageErrorState,
  StatGridSkeleton,
  Skeleton,
  PageHeader,
  SegmentedControl,
  type Column,
} from '@sureground/ui';
import { StatCard, type StatCardAccent } from '@sureground/ui';
import { AiDailyChart, usd } from '@/components/admin/ai/AiDailyChart';
import { unwrap } from '@sureground/shared';
import { adminService } from '@/services/adminService';
import { adminKeys } from '@/lib/queryKeys';
import type { AiCapabilityUsage, AiReviewCapabilitySummary } from '@/types/admin';

// Read-only: the AI controls are env-driven. Costs are Anthropic vendor spend, in USD.

const CAPABILITY_LABELS: Record<string, string> = {
  'listing-fraud': 'Listing fraud scan',
  'ownership-doc-check': 'Ownership document check',
  'maintenance-triage': 'Maintenance triage',
  'trust-explanation': 'Trust-score explanation',
  'portfolio-briefing': 'Portfolio briefing',
  'application-tip': 'Application tip',
  'neighbourhood-insight': 'Neighbourhood insight',
  'listing-check': 'Listing check',
  'search-parse': 'Plain-language search',
  'lease-guide': 'Lease guide',
  'listing-draft': 'Listing creator',
  'inspection-draft': 'Inspection report from photos',
  'statement-explainer': 'Owner statement explainer',
  'collection-plan': 'Collection plans',
  'shortlist-compare': 'Shortlist comparison',
  'renewal-advice': 'Renew or re-let',
  'lead-followups': 'Lead follow-ups',
  'owner-query-draft': 'Owner question replies',
  'estate-report-digest': 'Estate report digest',
  'estate-announcement-draft': 'Estate announcements',
  'estate-poll-draft': 'Estate polls',
  'invoice-check': 'Vendor invoice check',
  'deposit-plan': 'Deposit-back plan',
  'repair-photo-draft': 'Repairs by photo',
  'buyer-diligence': 'Buyer due diligence',
  'dispute-summary': 'Dispute summary',
  'offer-comparison': 'Offer comparison',
  'applicant-summary': 'Applicant summary',
  'renter-assistant': 'Ask Sureground (renter)',
  'landlord-assistant': 'Ask Sureground (landlord)',
  'manager-assistant': 'Ask Sureground (manager)',
  'owner-assistant': 'Ask Sureground (owner)',
  'estate-assistant': 'Ask Sureground (estate)',
  'resident-assistant': 'Ask Sureground (resident)',
  'agent-assistant': 'Ask Sureground (agent)',
  'realtor-assistant': 'Ask Sureground (realtor)',
  'buyer-assistant': 'Ask Sureground (buyer)',
};

const PERIODS = [
  { value: '1', label: 'Today' },
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
] as const;
type Period = (typeof PERIODS)[number]['value'];

const share = (part: number, whole: number) =>
  whole ? `${Math.round((part / whole) * 100)}%` : '—';
const seconds = (ms: number | null) => (ms === null ? '—' : `${(ms / 1000).toFixed(1)} s`);

function labelFor(capability: string): string {
  return CAPABILITY_LABELS[capability] ?? capability;
}

const CAPABILITY_COLUMNS: Column<AiCapabilityUsage>[] = [
  {
    key: 'feature',
    header: 'Feature',
    render: (c) => <span className="font-medium text-foreground">{labelFor(c.capability)}</span>,
  },
  {
    key: 'calls',
    header: 'Calls',
    numeric: true,
    render: (c) => <span className="text-foreground">{c.calls}</span>,
  },
  {
    key: 'spend',
    header: 'Spend',
    numeric: true,
    render: (c) => <span className="text-foreground">{usd(c.costUsd)}</span>,
  },
  {
    key: 'perCall',
    header: 'Per call',
    numeric: true,
    render: (c) => (
      <span className="text-muted-foreground">
        {c.succeeded ? usd(c.costUsd / c.succeeded) : '—'}
      </span>
    ),
  },
  {
    key: 'typical',
    header: 'Typical time',
    numeric: true,
    render: (c) => <span className="text-foreground">{seconds(c.medianLatencyMs)}</span>,
  },
  {
    key: 'p95',
    header: 'Slowest 5%',
    numeric: true,
    render: (c) => <span className="text-muted-foreground">{seconds(c.p95LatencyMs)}</span>,
  },
  {
    key: 'fellBack',
    header: 'Rules answered',
    numeric: true,
    render: (c) => (
      <span
        className="text-foreground"
        title={`${c.failed} failed, ${c.blocked} blocked before the model`}
      >
        {c.fellBack ? `${c.fellBack} (${share(c.fellBack, c.calls)})` : '0'}
      </span>
    ),
  },
  {
    key: 'dropped',
    header: 'Parts dropped',
    numeric: true,
    render: (c) => (
      <span className="text-foreground">
        {c.dropped}
        {c.dropped > 0 && (
          <span className="block text-xs text-muted-foreground">
            {Object.entries(c.dropReasons)
              .sort((a, b) => b[1] - a[1])
              .map(([reason, n]) => `${reason} ${n}`)
              .join(', ')}
          </span>
        )}
      </span>
    ),
  },
];

export default function AdminAiUsagePage() {
  const [period, setPeriod] = useState<Period>('1');
  const days = Number(period);
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: adminKeys.aiUsage(days),
    queryFn: () => unwrap(adminService.getAiUsage(days)),
    placeholderData: keepPreviousData,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <StatGridSkeleton />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return <PageErrorState onRetry={() => void refetch()} isRetrying={isFetching} />;
  }

  const capped = data.budget.dailyBudgetUsd > 0;
  const fellBack = data.capabilities.reduce((sum, c) => sum + c.fellBack, 0);
  const dropped = data.capabilities.reduce((sum, c) => sum + c.dropped, 0);
  const periodLabel = PERIODS.find((p) => p.value === period)?.label.toLowerCase() ?? 'today';
  const spendAccent: StatCardAccent = data.budget.exceeded
    ? 'red'
    : capped && data.budget.remainingUsd < data.budget.dailyBudgetUsd * 0.2
      ? 'orange'
      : 'green';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automation usage & controls"
        description="AI spend, volume and quality per feature, with the live kill-switch and budget controls. Periods are Lagos days; the daily budget resets at 00:00 UTC."
      />

      <SegmentedControl
        value={period}
        onValueChange={setPeriod}
        segments={PERIODS}
        aria-label="Period"
        size="sm"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ControlPill
          icon={data.globallyEnabled ? Power : ShieldAlert}
          label="Global switch"
          value={data.globallyEnabled ? 'Automation enabled' : 'Automation paused'}
          tone={data.globallyEnabled ? 'ok' : 'alert'}
        />
        <ControlPill
          icon={data.keyConfigured ? ShieldCheck : ShieldAlert}
          label="API key"
          value={data.keyConfigured ? 'Configured (live)' : 'Not configured'}
          tone={data.keyConfigured ? 'ok' : 'muted'}
        />
        <ControlPill
          icon={Coins}
          label="Daily budget"
          value={capped ? `${usd(data.budget.dailyBudgetUsd)} / day` : 'No cap set'}
          tone={data.budget.exceeded ? 'alert' : 'muted'}
        />
      </div>

      {data.disabledCapabilities.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-orange-500/40 bg-orange-500/10 p-4 text-sm">
          <Ban className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" aria-hidden="true" />
          <span className="text-foreground">
            Turned off right now:{' '}
            <span className="font-semibold">
              {data.disabledCapabilities.map(labelFor).join(', ')}
            </span>
            . These return a graceful &quot;temporarily unavailable&quot; to callers.
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Activity} label="Calls" value={`${data.totalCalls}`} accent="primary" />
        <StatCard
          icon={Coins}
          label="Spend"
          value={usd(data.totalCostUsd)}
          subtitle={
            capped
              ? `Today ${usd(data.budget.spentTodayUsd)} of ${usd(data.budget.dailyBudgetUsd)}`
              : `Today ${usd(data.budget.spentTodayUsd)}`
          }
          accent={spendAccent}
        />
        <StatCard
          icon={Undo2}
          label="Answered by the rules"
          value={share(fellBack, data.totalCalls)}
          subtitle={`${fellBack} call${fellBack === 1 ? '' : 's'}: model off, over budget or failed`}
          accent="orange"
        />
        <StatCard
          icon={Scissors}
          label="Parts dropped"
          value={`${dropped}`}
          subtitle="Wording a safety check threw away"
          accent="blue"
        />
      </div>

      {data.days > 1 && <AiDailyChart daily={data.daily} />}

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="font-semibold text-foreground">By feature ({periodLabel})</h2>
        </div>
        <DataTable
          caption="AI calls, spend and quality by feature"
          columns={CAPABILITY_COLUMNS}
          data={data.capabilities}
          getRowKey={(c) => c.capability}
          emptyState={
            <EmptyState
              icon={Cpu}
              size="compact"
              title={`No AI calls recorded ${period === '1' ? 'today' : 'in this period'}.`}
            />
          }
        />
      </section>

      <HumanReviewSection />
    </div>
  );
}

const pct = (value: number | null) => (value === null ? '—' : `${value}%`);
const duration = (minutes: number | null) => {
  if (minutes === null) return '—';
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 48 * 60) return `${Math.round(minutes / 60)} h`;
  return `${Math.round(minutes / 1440)} days`;
};

function HumanReviewSection() {
  const { data, isLoading, isError } = useQuery({
    queryKey: adminKeys.aiReviews,
    queryFn: () => unwrap(adminService.getAiReviews()),
  });
  const fraud = data?.capabilities.find((c) => c.capability === 'listing-fraud');
  const triage = data?.capabilities.find((c) => c.capability === 'maintenance-triage');

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
      <div className="flex items-center gap-2 border-b border-border/70 px-5 py-4">
        <UserCheck className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 className="font-semibold text-foreground">Human review (all time)</h2>
      </div>
      {isLoading ? (
        <div className="p-5">
          <Skeleton className="h-16 w-full" />
        </div>
      ) : isError || !data ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">
          Review figures are unavailable right now.
        </p>
      ) : (
        <div className="grid gap-4 p-5 md:grid-cols-2">
          {fraud && <FraudReviewCard summary={fraud} />}
          {triage && <TriageReviewCard summary={triage} />}
        </div>
      )}
    </div>
  );
}

function FraudReviewCard({ summary }: { summary: AiReviewCapabilitySummary }) {
  return (
    <section className="space-y-2 rounded-lg border border-border/70 p-4">
      <h3 className="font-medium text-foreground">{labelFor(summary.capability)}</h3>
      <p className="text-3xl font-semibold tabular-nums text-foreground">
        {pct(summary.precision)}
      </p>
      <p className="text-xs text-muted-foreground">
        Precision: of the alerts a reviewer has decided, how many were confirmed fraud.
      </p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 pt-2 text-sm">
        <dt className="text-muted-foreground">Listings scanned</dt>
        <dd className="text-right tabular-nums">{summary.total}</dd>
        <dt className="text-muted-foreground">Alerts opened</dt>
        <dd className="text-right tabular-nums">{summary.alertsOpened}</dd>
        <dt className="text-muted-foreground">Confirmed / cleared</dt>
        <dd className="text-right tabular-nums">
          {summary.byOutcome.CONFIRMED} / {summary.byOutcome.CLEARED}
        </dd>
        <dt className="text-muted-foreground">Alerts awaiting a decision</dt>
        <dd className="text-right tabular-nums">{summary.alertsOpened - summary.alertsDecided}</dd>
        <dt className="text-muted-foreground">Typical time to a decision</dt>
        <dd className="text-right tabular-nums">{duration(summary.medianMinutesToDecision)}</dd>
      </dl>
    </section>
  );
}

function TriageReviewCard({ summary }: { summary: AiReviewCapabilitySummary }) {
  return (
    <section className="space-y-2 rounded-lg border border-border/70 p-4">
      <h3 className="font-medium text-foreground">{labelFor(summary.capability)}</h3>
      <p className="text-3xl font-semibold tabular-nums text-foreground">
        {pct(summary.acceptanceRate)}
      </p>
      <p className="text-xs text-muted-foreground">
        Acceptance: of the proposals a person decided, how many were applied (as is or edited).
      </p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 pt-2 text-sm">
        <dt className="text-muted-foreground">Proposals made</dt>
        <dd className="text-right tabular-nums">{summary.total}</dd>
        <dt className="text-muted-foreground">Accepted / edited / rejected</dt>
        <dd className="text-right tabular-nums">
          {summary.byOutcome.ACCEPTED} / {summary.byOutcome.EDITED} / {summary.byOutcome.REJECTED}
        </dd>
        <dt className="text-muted-foreground">Not yet decided</dt>
        <dd className="text-right tabular-nums">{summary.pending}</dd>
        <dt className="text-muted-foreground">Typical suggestion → decision</dt>
        <dd className="text-right tabular-nums">{duration(summary.medianMinutesToDecision)}</dd>
        <dt className="text-muted-foreground">Typical report → triaged</dt>
        <dd className="text-right tabular-nums">
          {duration(summary.medianMinutesReportedToDecision)}
        </dd>
      </dl>
    </section>
  );
}

function ControlPill({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone: 'ok' | 'alert' | 'muted';
}) {
  const toneClass =
    tone === 'ok' ? 'text-green-600' : tone === 'alert' ? 'text-red-600' : 'text-muted-foreground';
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-4">
      <div className="inline-flex rounded-lg bg-accent p-2.5">
        <Icon className={`h-5 w-5 ${toneClass}`} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`font-semibold ${toneClass}`}>{value}</p>
      </div>
    </div>
  );
}
