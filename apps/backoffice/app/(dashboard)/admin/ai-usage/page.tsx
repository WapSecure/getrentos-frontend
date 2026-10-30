'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Ban, Coins, Cpu, Power, ShieldAlert, ShieldCheck } from 'lucide-react';
import { PageErrorState, StatGridSkeleton, Skeleton } from '@getrentos/ui';
import { StatCard, type StatCardAccent } from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';
import { adminService } from '@/services/adminService';
import { adminKeys } from '@/lib/queryKeys';

/**
 * AI governance dashboard: today's AI spend, volume and per-capability breakdown,
 * plus the live control state (global kill switch, per-capability switches, daily
 * budget). Read-only — the controls are env-driven (ops flips them without a
 * redeploy). Costs are the Anthropic vendor spend, denominated in USD.
 */

// USD vendor spend — rendered without a "$" glyph (the product is Naira-only;
// this is an internal API cost, labelled explicitly as USD instead).
function usd(amount: number): string {
  return `USD ${amount.toFixed(amount < 1 ? 4 : 2)}`;
}

const CAPABILITY_LABELS: Record<string, string> = {
  'listing-fraud': 'Listing fraud scan',
  'maintenance-triage': 'Maintenance triage',
  'trust-explanation': 'Trust-score explanation',
};

function labelFor(capability: string): string {
  return CAPABILITY_LABELS[capability] ?? capability;
}

export default function AdminAiUsagePage() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: adminKeys.aiUsage,
    queryFn: () => unwrap(adminService.getAiUsage()),
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
  const spendAccent: StatCardAccent = data.budget.exceeded
    ? 'red'
    : capped && data.budget.remainingUsd < data.budget.dailyBudgetUsd * 0.2
      ? 'orange'
      : 'green';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI usage &amp; governance</h1>
        <p className="mt-1 text-muted-foreground">
          Today&apos;s AI spend, volume and per-capability breakdown, with the live kill-switch and
          budget controls. All figures reset at 00:00 UTC.
        </p>
      </div>

      {/* Control state */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ControlPill
          icon={data.globallyEnabled ? Power : ShieldAlert}
          label="Global switch"
          value={data.globallyEnabled ? 'AI enabled' : 'AI turned off'}
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

      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Activity}
          label="Calls today"
          value={`${data.totalCallsToday}`}
          accent="primary"
        />
        <StatCard
          icon={Coins}
          label="Spend today"
          value={usd(data.totalCostTodayUsd)}
          accent={spendAccent}
        />
        <StatCard
          icon={Coins}
          label="Budget remaining"
          value={capped ? usd(data.budget.remainingUsd) : '—'}
          accent={capped ? (data.budget.exceeded ? 'red' : 'blue') : 'blue'}
        />
        <StatCard
          icon={Ban}
          label="Blocked today"
          value={`${data.capabilities.reduce((sum, c) => sum + c.blocked, 0)}`}
          accent="orange"
        />
      </div>

      {/* Per-capability breakdown */}
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <div className="flex items-center gap-2 border-b border-border/70 px-5 py-4">
          <Cpu className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="font-semibold text-foreground">By capability (today)</h2>
        </div>
        {data.capabilities.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            No AI calls recorded today.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Capability</th>
                  <th className="px-5 py-3 text-right font-medium">Calls</th>
                  <th className="px-5 py-3 text-right font-medium">Succeeded</th>
                  <th className="px-5 py-3 text-right font-medium">Failed</th>
                  <th className="px-5 py-3 text-right font-medium">Blocked</th>
                  <th className="px-5 py-3 text-right font-medium">Spend</th>
                </tr>
              </thead>
              <tbody>
                {data.capabilities.map((c) => (
                  <tr key={c.capability} className="border-b border-border/40 last:border-0">
                    <td className="px-5 py-3 font-medium text-foreground">
                      {labelFor(c.capability)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-foreground">{c.calls}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-green-600">
                      {c.succeeded}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-red-600">{c.failed}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-orange-600">
                      {c.blocked}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-foreground">
                      {usd(c.costUsd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
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
