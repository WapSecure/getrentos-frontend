'use client';

import Link from 'next/link';
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Power,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  Wrench,
  type SgIcon,
} from '@sureground/icons';
import { NairaSign } from '@sureground/ui/NairaSign';
import { Badge, Card, Skeleton } from '@sureground/ui';
import {
  formatLitres,
  formatSpendOrNoData,
  shouldShowUtilityTiles,
  type UtilitiesSummary,
  generatorServiceSummary,
} from '@sureground/shared';
import { HomeManagementTimeline } from '@/components/home-management/HomeManagementTimeline';
import { formatCurrency } from '@/lib/format';
import type { HomeManagementTab } from '@/lib/homeManagementTabs';
import type { HomeManagementDashboard } from '@/services/homeManagementService';

type AttentionItem = {
  id: string;
  count: number;
  title: string;
  icon: SgIcon;
  tab: HomeManagementTab;
  urgent?: boolean;
};

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);

interface HomeManagementOverviewProps {
  /** Calculated by the server across the whole portfolio, never from a paginated list. */
  summary?: HomeManagementDashboard;
  isLoading: boolean;
  /** Narrowed to one client's home: portfolio totals would describe other clients, so they are left out. */
  scopePropertyId?: string;
  tabHref: (tab: HomeManagementTab) => string;
  /** Power and water figures; the tiles stay hidden until something has been recorded. */
  utilities?: UtilitiesSummary;
}

export function HomeManagementOverview({
  summary,
  isLoading,
  scopePropertyId,
  tabHref,
  utilities,
}: HomeManagementOverviewProps) {
  const scoped = Boolean(scopePropertyId);
  const emergencies = summary?.unacknowledgedEmergencies ?? 0;
  const candidates: AttentionItem[] = [
    {
      id: 'approvals',
      count: summary?.approvalQueue ?? 0,
      title: plural(
        summary?.approvalQueue ?? 0,
        'work order is waiting for spend approval',
        'work orders are waiting for spend approval'
      ),
      icon: ShieldCheck,
      tab: 'work-orders',
      urgent: true,
    },
    {
      id: 'overdue',
      count: summary?.overdue ?? 0,
      title: plural(
        summary?.overdue ?? 0,
        'work order is past its due date',
        'work orders are past their due date'
      ),
      icon: TriangleAlert,
      tab: 'work-orders',
      urgent: true,
    },
    {
      id: 'plans-due',
      count: summary?.plansDue ?? 0,
      title: plural(summary?.plansDue ?? 0, 'care plan is due', 'care plans are due'),
      icon: CalendarClock,
      tab: 'preventive-care',
    },
    {
      id: 'assets-service',
      count: summary?.assetsNeedingService ?? 0,
      title: plural(
        summary?.assetsNeedingService ?? 0,
        'asset needs service',
        'assets need service'
      ),
      icon: Wrench,
      tab: 'assets',
    },
    {
      id: 'generators-due',
      count: utilities?.generatorsDue ?? 0,
      title: plural(
        utilities?.generatorsDue ?? 0,
        'generator is due a service',
        'generators are due a service'
      ),
      icon: Power,
      tab: 'utilities',
    },
    {
      id: 'water-failed',
      count: utilities?.waterTestsFailedRecently ?? 0,
      title: plural(
        utilities?.waterTestsFailedRecently ?? 0,
        'water test failed in the last 90 days',
        'water tests failed in the last 90 days'
      ),
      icon: ClipboardCheck,
      tab: 'utilities',
      urgent: true,
    },
  ];
  const showUtilities = shouldShowUtilityTiles(utilities);
  const items = candidates.filter((item) => item.count > 0);
  const hasProperties = (summary?.propertiesTotal ?? 0) > 0;

  return (
    <div className={scoped ? 'space-y-6' : 'grid gap-6 lg:grid-cols-3'}>
      <div className="min-w-0 space-y-6 lg:col-span-2">
        {scoped ? (
          <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            Portfolio totals cover every property you manage, so they are hidden while you view one
            client&apos;s home.
          </p>
        ) : (
          <>
            {emergencies > 0 && (
              <section
                aria-labelledby="overview-escalations-heading"
                className="flex flex-col gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                    <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 id="overview-escalations-heading" className="font-semibold text-foreground">
                      {emergencies}{' '}
                      {plural(
                        emergencies,
                        'emergency has not been acknowledged',
                        'emergencies have not been acknowledged'
                      )}
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Acknowledge each one in Live escalations so everyone knows it is in hand.
                    </p>
                  </div>
                </div>
                <Link
                  href={tabHref('work-orders')}
                  scroll={false}
                  className="inline-flex shrink-0 items-center gap-1 rounded-sm text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Review escalations
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </section>
            )}

            <section aria-labelledby="overview-attention-heading">
              <h2
                id="overview-attention-heading"
                className="text-lg font-semibold tracking-[-0.01em] text-foreground"
              >
                Needs attention
              </h2>
              {isLoading ? (
                <Card static className="mt-3 divide-y divide-border">
                  {Array.from({ length: 3 }, (_, index) => (
                    <div key={index} className="flex items-center gap-3 px-4 py-3">
                      <Skeleton className="h-9 w-9 rounded-lg" />
                      <Skeleton className="h-4 w-56" />
                    </div>
                  ))}
                </Card>
              ) : items.length === 0 ? (
                <p className="mt-3 flex items-start gap-2.5 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-success"
                    aria-hidden="true"
                  />
                  {hasProperties
                    ? 'All clear. No approvals, overdue work, due care plans or assets needing service.'
                    : 'Add a property to start recording assets, care plans and work orders.'}
                </p>
              ) : (
                <Card static className="mt-3">
                  <ul className="divide-y divide-border">
                    {items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.id}>
                          <Link
                            href={tabHref(item.tab)}
                            scroll={false}
                            className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <Icon className="h-4 w-4" aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1 text-sm text-foreground">
                              <span className="font-semibold tabular-nums">{item.count}</span>{' '}
                              {item.title}
                            </span>
                            {item.urgent && <Badge variant="warning">Action needed</Badge>}
                            <ChevronRight
                              className="h-4 w-4 shrink-0 text-muted-foreground transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-primary"
                              aria-hidden="true"
                            />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              )}
            </section>
          </>
        )}

        <HomeManagementTimeline
          propertyId={scopePropertyId}
          preview={3}
          viewAllHref={tabHref('history')}
        />
      </div>

      {!scoped && (
        <aside aria-label="Spend" className="min-w-0">
          <Card static className="p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Approved spend</p>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <NairaSign className="h-4 w-4 text-primary" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-2 text-[1.625rem] font-semibold leading-tight tracking-[-0.02em] text-foreground tabular-nums">
              {isLoading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                formatCurrency(summary?.approvedSpend ?? 0)
              )}
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Approved across every work order recorded
              {hasProperties
                ? ` for your ${summary?.propertiesTotal} ${plural(summary?.propertiesTotal ?? 0, 'property', 'properties')}`
                : ''}
              .
            </p>
          </Card>
          {showUtilities && utilities && (
            <Card static className="mt-6 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-medium text-muted-foreground">Power and water</h2>
                <Link
                  href={tabHref('utilities')}
                  scroll={false}
                  className="rounded-sm text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Open utilities
                </Link>
              </div>
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">
                    Recorded utility spend ({utilities.monthLabel.split(' ')[0]})
                  </dt>
                  <dd className="font-semibold tabular-nums text-foreground">
                    {formatSpendOrNoData(utilities.spendThisMonth)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">Diesel this month</dt>
                  <dd className="font-semibold tabular-nums text-foreground">
                    {utilities.dieselLitresThisMonth !== null
                      ? formatLitres(utilities.dieselLitresThisMonth)
                      : utilities.dieselSpendThisMonth !== null
                        ? formatSpendOrNoData(utilities.dieselSpendThisMonth)
                        : 'No data yet'}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">Generators due a service</dt>
                  <dd className="font-semibold tabular-nums text-foreground">
                    {utilities.generatorsTotal === 0
                      ? 'None recorded'
                      : generatorServiceSummary(
                          utilities.generatorsDue,
                          utilities.generatorsDueSoon
                        )}
                  </dd>
                </div>
              </dl>
              {utilities.entriesThisMonth > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Based on {utilities.entriesThisMonth} recorded{' '}
                  {plural(utilities.entriesThisMonth, 'entry', 'entries')} this month.
                </p>
              )}
            </Card>
          )}
        </aside>
      )}
    </div>
  );
}
