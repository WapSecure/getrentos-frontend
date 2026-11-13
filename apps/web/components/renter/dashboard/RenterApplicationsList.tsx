'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MapPin, Clock, ChevronRight, Home, Building2 } from '@sureground/icons';
import { Badge, type BadgeVariant } from '@sureground/ui';
import { Button } from '@sureground/ui';
import { ListSkeleton } from '@sureground/ui';
import { QueryState } from '@sureground/ui';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
type PeriodType = 'month' | 'year' | 'week';

const statusConfig: Record<
  ApplicationStatus,
  { label: string; variant: BadgeVariant; icon: React.ElementType }
> = {
  pending: {
    label: 'Pending review',
    variant: 'warning',
    icon: Clock,
  },
  under_review: {
    label: 'Under review',
    variant: 'info',
    icon: Building2,
  },
  approved: {
    label: 'Approved',
    variant: 'success',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Rejected',
    variant: 'danger',
    icon: XCircle,
  },
  withdrawn: {
    label: 'Withdrawn',
    variant: 'neutral',
    icon: XCircle,
  },
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
};

const formatPrice = (price: number, period: PeriodType) => {
  const formatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const periodMap: Record<PeriodType, string> = {
    month: '/mo',
    year: '/yr',
    week: '/wk',
  };
  return `${formatter.format(price)}${periodMap[period]}`;
};

import { CheckCircle, XCircle } from '@sureground/icons';
import { ROUTES } from '@/lib/constants/auth';

export const RenterApplicationsList = () => {
  const { t } = useLanguage();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: [...renterKeys.applications, { page: 1, pageSize: 5 }],
    queryFn: () => unwrap(renterService.listMyApplications({ page: 1, pageSize: 5 })),
  });
  const applications = data?.items ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="overflow-hidden rounded-xl border border-border bg-card shadow-xs"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-base font-semibold tracking-[-0.015em] text-foreground">
            {t('dashboard.applications.title')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('dashboard.applications.subtitle')}</p>
        </div>
        <Button href={ROUTES.RENTER_APPLICATIONS} variant="link" size="sm">
          {t('dashboard.applications.view_all')}
        </Button>
      </div>

      <QueryState
        isLoading={isLoading}
        isError={isError && !data}
        onRetry={() => void refetch()}
        isRetrying={isRefetching}
        isEmpty={applications.length === 0}
        empty={{
          icon: Home,
          title: 'No applications yet',
          description: 'Homes you apply for will appear here with their status.',
          action: (
            <Button href={ROUTES.RENTER_DISCOVER} variant="outline" size="sm">
              Find a home
            </Button>
          ),
        }}
        loading={<ListSkeleton rows={3} className="rounded-none border-0" />}
      >
        <ul className="divide-y divide-border">
          {applications.map((app, index) => {
            const status = statusConfig[app.status];
            const StatusIcon = status.icon;
            const facts = [
              app.bedrooms ? `${app.bedrooms} ${app.bedrooms === 1 ? 'bed' : 'beds'}` : null,
              app.bathrooms ? `${app.bathrooms} ${app.bathrooms === 1 ? 'bath' : 'baths'}` : null,
              app.size ? `${app.size} m²` : null,
              `Applied ${formatDate(app.date)}`,
            ].filter(Boolean);

            return (
              <motion.li
                key={app.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.3 }}
              >
                <Link
                  href={ROUTES.RENTER_APPLICATIONS}
                  className="group flex items-center gap-3.5 px-5 py-4 transition-colors hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Home className="h-5 w-5" aria-hidden="true" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground transition-colors group-hover:text-primary">
                      {app.title}
                    </span>
                    <span className="mt-0.5 flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{app.address}</span>
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground tabular-nums">
                      {facts.map((fact, i) => (
                        <span key={fact} className="whitespace-nowrap">
                          {i > 0 && (
                            <span aria-hidden="true" className="mr-1.5">
                              ·
                            </span>
                          )}
                          {fact}
                        </span>
                      ))}
                    </span>
                    <span className="mt-2 block sm:hidden">
                      <Badge variant={status.variant} icon={<StatusIcon className="h-3 w-3" />}>
                        {status.label}
                      </Badge>
                    </span>
                  </span>

                  <span className="flex shrink-0 flex-col items-end gap-1.5 text-right">
                    <span className="data-value whitespace-nowrap text-sm font-semibold text-foreground sm:text-base">
                      {formatPrice(app.price, app.period)}
                    </span>
                    <span className="hidden sm:block">
                      <Badge variant={status.variant} icon={<StatusIcon className="h-3 w-3" />}>
                        {status.label}
                      </Badge>
                    </span>
                  </span>
                  <ChevronRight
                    className="hidden h-4 w-4 shrink-0 text-muted-foreground/70 transition-[color,transform] duration-150 group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transition-none sm:block"
                    aria-hidden="true"
                  />
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </QueryState>
    </motion.div>
  );
};
