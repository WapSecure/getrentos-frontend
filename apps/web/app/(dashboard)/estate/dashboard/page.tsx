'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BookOpen,
  Building2,
  Car,
  KeyRound,
  Megaphone,
  Package,
  ReceiptText,
  ShieldCheck,
  TriangleAlert,
  Users,
} from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  CardSkeleton,
  PageHeader,
  StatGroupSkeleton,
  StatGroup,
  Skeleton,
} from '@sureground/ui';
import { ROUTES } from '@/lib/constants/auth';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { formatCurrency, pluralize } from '@/lib/format';
import { useEstatePlan } from '@/hooks/useEstatePlan';
import { AttentionFeed } from '@/components/shared/attention/AttentionFeed';
import { ProFeatureGate } from '@/components/shared/subscription/ProFeatureGate';

const EstateDuesTrendChart = dynamic(
  () =>
    import('@/components/estate/dashboard/EstateDuesTrendChart').then(
      (m) => m.EstateDuesTrendChart
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-72 rounded-xl" />,
  }
);

const modules = [
  {
    label: 'Announcements',
    description: 'Broadcast to the estate',
    href: ROUTES.ESTATE_ANNOUNCEMENTS,
    icon: Megaphone,
  },
  {
    label: 'Households',
    description: 'Manage homes & residents',
    href: ROUTES.ESTATE_HOUSEHOLDS,
    icon: Users,
  },
  {
    label: 'Dues',
    description: 'Track and collect dues',
    href: ROUTES.ESTATE_DUES,
    icon: ReceiptText,
  },
  {
    label: 'Visitor passes',
    description: 'Issue entry passes',
    href: ROUTES.ESTATE_VISITOR_PASSES,
    icon: KeyRound,
  },
  { label: 'Vehicles', description: 'Register vehicles', href: ROUTES.ESTATE_VEHICLES, icon: Car },
  {
    label: 'Deliveries',
    description: 'Log packages at the gate',
    href: ROUTES.ESTATE_DELIVERIES,
    icon: Package,
  },
  {
    label: 'Violations',
    description: 'Review infractions',
    href: ROUTES.ESTATE_VIOLATIONS,
    icon: TriangleAlert,
  },
  {
    label: 'Governance',
    description: 'Rules & decisions',
    href: ROUTES.ESTATE_GOVERNANCE,
    icon: BookOpen,
  },
  {
    label: 'Staff',
    description: 'Manage estate staff',
    href: ROUTES.ESTATE_STAFF,
    icon: ShieldCheck,
  },
] as const;

export default function EstateDashboardPage() {
  const { estate, isLoading } = useSelectedEstate();
  const { isPro } = useEstatePlan();

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: estateKeys.dashboardStats(estate?.id ?? ''),
    queryFn: () => unwrap(estateService.getDashboardStats(estate!.id)),
    enabled: !!estate && isPro,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <StatGroupSkeleton groups={[2, 4]} />
      </div>
    );
  }

  if (!estate) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-primary">
          <Building2 className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-[-0.03em] text-foreground">
          No estate yet
        </h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          Set up your estate to start managing households.
        </p>
        <Button href={ROUTES.ESTATE_SETUP} rounded="lg" className="mt-7">
          Set up estate
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={estate.name}
        description={`${estate.address}, ${estate.city}, ${estate.state}`}
        meta={`${pluralize(estate.householdCount, 'household')} · ${pluralize(estate.gateCount ?? 0, 'active gate')}`}
      />

      {estate.householdCount === 0 && (
        <Alert
          title="Next, add your households"
          action={
            <Button href={ROUTES.ESTATE_HOUSEHOLDS} size="sm">
              Add households
            </Button>
          }
        >
          Residents get visitor passes and dues bills once their household is on the estate.
        </Alert>
      )}

      <AttentionFeed persona="estate" estateId={estate.id} />

      <ProFeatureGate
        entitled={isPro}
        title="Analytics is a Pro feature"
        description="Upgrade to Pro to see collection stats and a 6-month dues trend for this estate."
      >
        {isStatsLoading ? (
          <StatGroupSkeleton groups={[2, 4]} />
        ) : (
          <div className="space-y-4">
            <StatGroup
              title="Dues"
              items={[
                {
                  label: 'Collected this month',
                  value: stats
                    ? formatCurrency(stats.duesCollectedThisMonth, { compact: true })
                    : '—',
                  href: ROUTES.ESTATE_DUES,
                },
                {
                  label: 'Outstanding',
                  value: stats ? formatCurrency(stats.duesOutstanding, { compact: true }) : '—',
                  attention: (stats?.duesOutstanding ?? 0) > 0,
                  href: ROUTES.ESTATE_DUES,
                },
              ]}
            />
            <StatGroup
              title="Estate"
              items={[
                {
                  label: 'Households',
                  value: stats?.totalHouseholds ?? '—',
                  href: ROUTES.ESTATE_HOUSEHOLDS,
                },
                {
                  label: 'Open incidents',
                  value: stats?.openIncidents ?? '—',
                  attention: (stats?.openIncidents ?? 0) > 0,
                  href: ROUTES.ESTATE_INCIDENTS,
                },
                {
                  label: 'Open maintenance',
                  value: stats?.openMaintenanceTickets ?? '—',
                  attention: (stats?.openMaintenanceTickets ?? 0) > 0,
                  href: ROUTES.ESTATE_MAINTENANCE,
                },
                {
                  label: 'Pending violations',
                  value: stats?.pendingViolations ?? '—',
                  attention: (stats?.pendingViolations ?? 0) > 0,
                  href: ROUTES.ESTATE_VIOLATIONS,
                },
              ]}
            />
          </div>
        )}

        <EstateDuesTrendChart estateId={estate.id} />
      </ProFeatureGate>

      <section className="space-y-4">
        <div>
          <h2 className="type-heading">Manage your estate</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Households, access control, and community operations in one place.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {modules.map((module) => (
            <Card key={module.href} interactive>
              <Link href={module.href} className="group flex items-center gap-3 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                  <module.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {module.label}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {module.description}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
